"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { submitArcadeScore } from "@/hooks/usePostRun";
import type { AchievementDef } from "@/lib/achievements";
import { GameModal } from "../GameModal";
import { AuthModal } from "../AuthModal";
import { MergeTitleScreen } from "./MergeTitleScreen";
import { MergeHud } from "./MergeHud";
import { MergeResultScreen } from "./MergeResultScreen";
import { MergeGoalsPanel } from "./MergeGoalsPanel";
import { MergeCollectionPanel } from "./MergeCollectionPanel";
import { MergeSettingsPanel } from "./MergeSettingsPanel";
import { MergeLeaderboardPanel } from "./MergeLeaderboardPanel";
import {
  COMBO_WINDOW_MS,
  DANGER_Y,
  MERGE_GAME_ID,
  MERGE_LEVEL_ID,
  MERGE_DISPLAY_MAX_WIDTH,
  MERGE_WORLD,
  PRODUCT_TITLE,
  type MergeTierId,
} from "@/lib/vibe-merge/mergeConfig";
import { DropQueue, createDropQueue, dropQueueFromSnapshot } from "@/lib/vibe-merge/mergeQueue";
import { dailyDropQueue, mergeDailySeed } from "@/lib/vibe-merge/mergeDaily";
import { pointsForMerge, survivalBonus } from "@/lib/vibe-merge/mergeScoring";
import {
  canDropHeld,
  createMergeWorld,
  drainMergeEvents,
  dropHeldPiece,
  highestPieceTier,
  moveAimX,
  setHoldingTier,
  evaluateDangerLine,
  restoreMergeStack,
  type CreatedMergeWorld,
  type MergePiecePlugin,
} from "@/lib/vibe-merge/mergePhysics";
import { paintMergeWorld } from "@/lib/vibe-merge/mergePaint";
import {
  createFloatLabel,
  tickFloatLabels,
  tickMergeBursts,
  type MergeBurst,
  type MergeFloatLabel,
} from "@/lib/vibe-merge/mergeJuice";
import { preloadMergeBackgrounds } from "@/lib/vibe-merge/mergeBackgrounds";
import { preloadMergeFaces } from "@/lib/vibe-merge/mergeFaces";
import { loadMergePersisted, saveMergePersisted, recordRun } from "@/lib/vibe-merge/mergeStorage";
import { evaluateMergeAchievements } from "@/lib/vibe-merge/mergeAchievements";
import {
  playMergeDrop,
  playMergePop,
  playMergeCombo,
  playMergeDanger,
  playMergeGameOver,
  playBigMerge,
} from "@/lib/vibe-merge/mergeSounds";
import { playUiClick } from "@/lib/sounds";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { hasCompletedOnboarding } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";
import { ArcadeResumePrompt } from "@/components/arcade/ArcadeResumePrompt";
import {
  loadMergeResumeSnapshot,
  mergeResumeDetail,
  saveMergeResume,
  type MergeResumeSnapshot,
} from "@/lib/vibe-merge/mergeResume";

export type MergePhase = "menu" | "playing" | "paused" | "gameover";

export interface VibeMergeGameProps {
  onExitToLibrary?: () => void;
}

export default function VibeMergeGame({ onExitToLibrary }: VibeMergeGameProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<CreatedMergeWorld | null>(null);
  const queueRef = useRef<DropQueue | null>(null);
  const rafRef = useRef<number>(0);
  const floatsRef = useRef<MergeFloatLabel[]>([]);
  const burstsRef = useRef<MergeBurst[]>([]);
  const shakeRef = useRef(0);
  const dangerPulseRef = useRef(0);
  const canDropRef = useRef(true);
  const highestRef = useRef(1);
  const mutedRef = useRef(false);
  const endGameRef = useRef<() => void>(() => undefined);

  const [phase, setPhase] = useState<MergePhase>("menu");
  const [persisted, setPersisted] = useState(loadMergePersisted);
  const [mode, setMode] = useState<"classic" | "daily">("classic");
  const [dailySeed, setDailySeed] = useState(mergeDailySeed);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mergeCount, setMergeCount] = useState(0);
  const [highestTier, setHighestTier] = useState(1);
  const [currentTier, setCurrentTier] = useState<MergeTierId>(1);
  const [nextTier, setNextTier] = useState<MergeTierId>(1);
  const [runStart, setRunStart] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [leadersOpen, setLeadersOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const lastComboAt = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const dropInFlightRef = useRef(false);
  const dangerNearRef = useRef(false);
  const [canDrop, setCanDrop] = useState(true);
  const [coachOpen, setCoachOpen] = useState(false);
  const [dangerNear, setDangerNear] = useState(false);
  const [pendingResume, setPendingResume] = useState<MergeResumeSnapshot | null>(null);
  const [serverRank, setServerRank] = useState<number | null>(null);
  const [resultAchSlugs, setResultAchSlugs] = useState<string[]>([]);
  const mergeCountRef = useRef(0);
  const maxComboRef = useRef(0);

  const muted = persisted.soundMuted;

  useArcadeAudioZone(phase === "playing" ? "game" : "hub");
  mutedRef.current = muted;

  useEffect(() => {
    void preloadMergeFaces();
    void preloadMergeBackgrounds();
    setPendingResume(loadMergeResumeSnapshot());
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const selectPlayBackground = useCallback((id: string) => {
    setPersisted((prev) => {
      const next = { ...prev, playBackgroundId: id };
      saveMergePersisted(next);
      return next;
    });
  }, []);

  const addFloat = useCallback((text: string, x: number, y: number, combo: number, big: boolean) => {
    const next = [...floatsRef.current, createFloatLabel(text, x, y, combo, big)];
    floatsRef.current = next.length > 10 ? next.slice(-10) : next;
  }, []);

  const buildMergeSnapshot = useCallback((): MergeResumeSnapshot | null => {
    const world = worldRef.current;
    const q = queueRef.current;
    if (!world || !q) return null;
    return {
      version: 1,
      savedAt: Date.now(),
      mode,
      dailySeed,
      queue: q.exportSnapshot(),
      score: scoreRef.current,
      combo: comboRef.current,
      maxCombo: maxComboRef.current,
      mergeCount: mergeCountRef.current,
      highestTier: highestRef.current as MergeTierId,
      holdingTier: world.holdingTier,
      aimX: world.aimX,
      runStart,
      pieces: world.pieces.map((b) => {
        const p = b.plugin as MergePiecePlugin;
        return {
          tier: p.mergeTier,
          x: b.position.x,
          y: b.position.y,
          angle: b.angle,
        };
      }),
    };
  }, [mode, dailySeed, runStart]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    const id = window.setInterval(() => {
      const snap = buildMergeSnapshot();
      if (snap) saveMergeResume(snap);
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase, buildMergeSnapshot]);

  const startRun = useCallback((m: "classic" | "daily") => {
    saveMergeResume(null);
    worldRef.current?.dispose();
    const seed = m === "daily" ? mergeDailySeed() : "classic";
    setDailySeed(seed);
    setMode(m);
    const q =
      m === "daily"
        ? new DropQueue(dailyDropQueue(seed))
        : new DropQueue(createDropQueue(() => Math.random()));
    queueRef.current = q;
    const world = createMergeWorld();
    worldRef.current = world;
    setCurrentTier(q.current());
    setNextTier(q.next());
    setHoldingTier(world, q.current());
    setCanDrop(true);
    dropInFlightRef.current = false;
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setMaxCombo(0);
    setMergeCount(0);
    setHighestTier(1);
    floatsRef.current = [];
    burstsRef.current = [];
    shakeRef.current = 0;
    dangerPulseRef.current = 0;
    dangerNearRef.current = false;
    setDangerNear(false);
    highestRef.current = 1;
    canDropRef.current = true;
    setRunStart(Date.now());
    setIsNewBest(false);
    setServerRank(null);
    setResultAchSlugs([]);
    lastComboAt.current = 0;
    comboRef.current = 0;
    mergeCountRef.current = 0;
    maxComboRef.current = 0;
    if (m === "daily") void bumpNightStreakLoggedIn(!!user);
    setCoachOpen(!hasCompletedOnboarding("vibe-merge"));
    setPhase("playing");
  }, [user]);

  const endGame = useCallback(async () => {
    saveMergeResume(null);
    const survival = Date.now() - runStart;
    const finalScore = scoreRef.current + survivalBonus(survival);
    const hi = highestTier;
    let p = loadMergePersisted();
    const prevBest = mode === "classic" ? p.bestClassic : p.bestDaily;
    setIsNewBest(finalScore > prevBest);
    const owned = new Set(p.achievements);
    const newly = evaluateMergeAchievements(owned, {
      score: finalScore,
      highestTier: hi,
      maxCombo,
      merges: mergeCount,
      mode,
    }, p);
    p = recordRun(p, {
      mode,
      score: finalScore,
      highestTier: hi,
      merges: mergeCount,
      maxCombo,
      dailySeed: mode === "daily" ? dailySeed : undefined,
    });
    p.achievements = [...owned, ...newly.map((a) => a.slug)];
    saveMergePersisted(p);
    setPersisted(p);
    setScore(finalScore);
    setResultAchSlugs(newly.map((a) => a.slug));
    playMergeGameOver(muted);
    setPhase("gameover");

    if (user) {
      const { rank } = await submitArcadeScore({
        gameId: MERGE_GAME_ID,
        mode,
        levelId: MERGE_LEVEL_ID,
        seed: mode === "daily" ? dailySeed : null,
        score: finalScore,
        stars: 0,
        shotsUsed: queueRef.current?.dropsUsed ?? 0,
        shotsTotal: 999,
        won: true,
        moves_json: JSON.stringify({ merges: mergeCount, highestTier: hi }),
        run_hash: typeof crypto !== "undefined" ? crypto.randomUUID() : `m-${Date.now()}`,
        client_version: "vibe-sling@0.1.0",
      });
      setServerRank(rank);
    }
  }, [runStart, highestTier, maxCombo, mergeCount, mode, dailySeed, muted, user]);

  endGameRef.current = () => {
    void endGame();
  };

  const dropPiece = useCallback(() => {
    const world = worldRef.current;
    const q = queueRef.current;
    if (!world || !q || phase !== "playing" || dropInFlightRef.current) return;
    if (!canDropHeld(world)) return;

    dropInFlightRef.current = true;
    const dropped = dropHeldPiece(world);
    if (!dropped) {
      dropInFlightRef.current = false;
      return;
    }

    playMergeDrop(muted);
    q.advance();
    setCurrentTier(q.current());
    setNextTier(q.next());
    setHoldingTier(world, q.current());
    canDropRef.current = false;
    setCanDrop(false);
    dropInFlightRef.current = false;
  }, [phase, muted]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = worldRef.current;
    if (!world) return;

    const bgId = persisted.playBackgroundId;
    let dangerSoundPlayed = false;
    let last = performance.now();
    let hudTick = 0;

    const loop = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const m = mutedRef.current;
      dangerPulseRef.current += dt / 1000;

      const events = drainMergeEvents(world);
      for (const ev of events) {
        const c =
          now - lastComboAt.current < COMBO_WINDOW_MS ? comboRef.current + 1 : 1;
        comboRef.current = c;
        lastComboAt.current = now;
        maxComboRef.current = Math.max(maxComboRef.current, c);
        setMaxCombo((prev) => Math.max(prev, c));
        const { points, label } = pointsForMerge(ev.scoreTier, c);
        const big = ev.intoTier >= 7 || c >= 3;
        scoreRef.current += points;
        mergeCountRef.current += 1;
        setMergeCount((n) => n + 1);
        addFloat(label, ev.x, ev.y, c, big);
        burstsRef.current.push({
          x: ev.x,
          y: ev.y,
          tier: ev.intoTier,
          life: 1,
          maxLife: 280 + ev.intoTier * 20,
        });
        const shakeAmt = (ev.intoTier >= 7 ? 5 : c >= 3 ? 4 : c >= 2 ? 2.5 : 1.2) * (dt / 16.67);
        shakeRef.current = Math.min(8, shakeRef.current + shakeAmt);
        if (ev.intoTier >= 7) playBigMerge(m, ev.intoTier);
        else if (c >= 2) playMergeCombo(m, c);
        else playMergePop(m, ev.intoTier, c);
      }

      const hi = highestPieceTier(world);
      if (hi > highestRef.current) {
        highestRef.current = hi;
        setHighestTier(hi);
      }

      const cd = canDropHeld(world);
      if (cd !== canDropRef.current) {
        canDropRef.current = cd;
        setCanDrop(cd);
      }

      const danger = evaluateDangerLine(world, DANGER_Y, now);
      if (dangerNearRef.current !== danger.touching) {
        dangerNearRef.current = danger.touching;
        setDangerNear(danger.touching);
      }
      if (danger.touching) {
        if (danger.fill > 0.05) playMergeDanger(m, danger.fill);
        if (!dangerSoundPlayed && danger.fill > 0.2) dangerSoundPlayed = true;
        shakeRef.current = Math.min(6, shakeRef.current + danger.fill * 0.15 * (dt / 16.67));
        if (danger.gameOver) {
          shakeRef.current = 10;
          endGameRef.current();
          return;
        }
      } else {
        dangerSoundPlayed = false;
      }

      floatsRef.current = tickFloatLabels(floatsRef.current, dt);
      burstsRef.current = tickMergeBursts(burstsRef.current, dt);
      shakeRef.current *= 0.82;

      hudTick += dt;
      if (hudTick >= 120) {
        hudTick = 0;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
      }

      const shakeX = (Math.random() - 0.5) * shakeRef.current * 0.6;
      const shakeY = (Math.random() - 0.5) * shakeRef.current * 0.4;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        paintMergeWorld(ctx, world.engine, {
          holding: world.holdingTier
            ? { tier: world.holdingTier, x: world.aimX, ready: cd }
            : null,
          dangerActive: danger.touching,
          dangerFill: danger.fill,
          dangerPulse: dangerPulseRef.current,
          scale: 1,
          backgroundId: bgId,
          floats: floatsRef.current,
          bursts: burstsRef.current,
          shakeX,
          shakeY,
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, addFloat, persisted.playBackgroundId]);

  const pointerToWorldX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return MERGE_WORLD.width / 2;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * MERGE_WORLD.width;
    return x;
  };

  const draggingRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "playing" || !worldRef.current || !canDropHeld(worldRef.current)) return;
    e.preventDefault();
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    moveAimX(worldRef.current, pointerToWorldX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (phase !== "playing" || !worldRef.current || !draggingRef.current) return;
    e.preventDefault();
    moveAimX(worldRef.current, pointerToWorldX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (phase !== "playing" || !draggingRef.current) return;
    e.preventDefault();
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (worldRef.current && canDropHeld(worldRef.current)) dropPiece();
  };

  const onPointerCancel = () => {
    draggingRef.current = false;
  };

  const resumeRun = useCallback(() => {
    const snap = pendingResume ?? loadMergeResumeSnapshot();
    if (!snap) return;
    playUiClick(muted);
    saveMergeResume(null);
    worldRef.current?.dispose();
    const world = createMergeWorld();
    worldRef.current = world;
    restoreMergeStack(world, snap.pieces);
    world.aimX = snap.aimX;
    const q = dropQueueFromSnapshot(snap.queue);
    queueRef.current = q;
    setHoldingTier(world, snap.holdingTier ?? q.current());
    setMode(snap.mode);
    setDailySeed(snap.dailySeed);
    setCurrentTier(q.current());
    setNextTier(q.next());
    scoreRef.current = snap.score;
    comboRef.current = snap.combo;
    maxComboRef.current = snap.maxCombo;
    mergeCountRef.current = snap.mergeCount;
    highestRef.current = snap.highestTier;
    setScore(snap.score);
    setCombo(snap.combo);
    setMaxCombo(snap.maxCombo);
    setMergeCount(snap.mergeCount);
    setHighestTier(snap.highestTier);
    setRunStart(snap.runStart);
    floatsRef.current = [];
    burstsRef.current = [];
    shakeRef.current = 0;
    dangerPulseRef.current = 0;
    dangerNearRef.current = false;
    setDangerNear(false);
    canDropRef.current = true;
    setCanDrop(true);
    dropInFlightRef.current = false;
    setPendingResume(null);
    setPhase("playing");
  }, [muted, pendingResume]);

  const discardResume = useCallback(() => {
    saveMergeResume(null);
    setPendingResume(null);
  }, []);

  const best = mode === "classic" ? persisted.bestClassic : persisted.bestDaily;

  return (
    <div
      className="relative mx-auto flex min-h-[100dvh] w-full flex-col items-center justify-center overscroll-none px-2 py-4 pb-arcade-player pt-arcade-player touch-none"
      style={{ maxWidth: `min(${MERGE_DISPLAY_MAX_WIDTH}px, calc(100vw - 1rem))` }}
    >
      {phase === "menu" ? (
        <MergeTitleScreen
          muted={muted}
          playBackgroundId={persisted.playBackgroundId}
          onSelectBackground={selectPlayBackground}
          onPlay={() => startRun("classic")}
          onDaily={() => startRun("daily")}
          onLeaders={() => setLeadersOpen(true)}
          onBadges={() => setBadgesOpen(true)}
          onCollection={() => setCollectionOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onBack={onExitToLibrary}
          resume={
            pendingResume ? (
              <ArcadeResumePrompt
                label="Resume stack"
                detail={mergeResumeDetail(pendingResume)}
                muted={muted}
                onResume={resumeRun}
                onDiscard={discardResume}
              />
            ) : undefined
          }
        />
      ) : null}

      {(phase === "playing" || phase === "paused") && (
        <div
          className="relative mx-auto w-full max-w-full select-none"
          style={{ maxWidth: MERGE_DISPLAY_MAX_WIDTH, touchAction: "none" }}
        >
          <canvas
            ref={canvasRef}
            width={MERGE_WORLD.width}
            height={MERGE_WORLD.height}
            className="block w-full rounded-2xl border border-gvc-gold/20 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            style={{
              aspectRatio: `${MERGE_WORLD.width}/${MERGE_WORLD.height}`,
              touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
          <MergeHud
            score={score}
            best={best}
            currentTier={currentTier}
            nextTier={nextTier}
            canDrop={canDrop}
            combo={combo}
            mode={mode}
            dailySeed={dailySeed}
            dangerNear={dangerNear}
            onPause={() => setPhase("paused")}
            muted={muted}
          />
          <FirstRunCoachOverlay
            gameId="vibe-merge"
            open={coachOpen}
            muted={muted}
            onComplete={() => setCoachOpen(false)}
          />
          <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-body text-[10px] text-white/50 drop-shadow-md">
            {canDrop ? "Drag to aim · release to drop" : "Let the last vibe settle…"}
          </p>
        </div>
      )}

      {phase === "gameover" ? (
        <MergeResultScreen
          score={score}
          best={Math.max(best, score)}
          highestTier={highestTier}
          maxCombo={maxCombo}
          merges={mergeCount}
          mode={mode}
          isNewBest={isNewBest}
          muted={muted}
          signedIn={!!user}
          serverRank={serverRank}
          newAchievementSlugs={resultAchSlugs}
          onRetry={() => startRun(mode)}
          onMenu={() => {
            setPhase("menu");
            setPendingResume(loadMergeResumeSnapshot());
          }}
          onSignIn={user ? undefined : () => setAuthOpen(true)}
          onOpenLeaderboard={() => setLeadersOpen(true)}
        />
      ) : null}

      <GameModal open={phase === "paused"} onClose={() => setPhase("playing")} title="Paused" muted={muted}>
        <div className="flex flex-col gap-2">
          <button type="button" className="min-h-[48px] rounded-xl bg-gvc-gold font-display text-sm font-black uppercase text-gvc-black" onClick={() => setPhase("playing")}>
            Resume
          </button>
          <button type="button" className="min-h-[44px] rounded-xl border border-white/12 font-display text-xs font-bold uppercase text-white/70" onClick={() => { saveMergeResume(buildMergeSnapshot()); setPhase("menu"); worldRef.current?.dispose(); setPendingResume(loadMergeResumeSnapshot()); }}>
            Quit to menu
          </button>
        </div>
      </GameModal>

      <MergeLeaderboardPanel open={leadersOpen} onClose={() => setLeadersOpen(false)} muted={muted} />
      <GameModal open={badgesOpen} onClose={() => setBadgesOpen(false)} title="Badges" muted={muted} tall>
        <MergeGoalsPanel persisted={persisted} />
      </GameModal>
      <GameModal open={collectionOpen} onClose={() => setCollectionOpen(false)} title="Collection" muted={muted} tall>
        <MergeCollectionPanel persisted={persisted} />
      </GameModal>
      <GameModal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" muted={muted}>
        <MergeSettingsPanel
          muted={muted}
          onToggleMute={() => {
            const p = { ...persisted, soundMuted: !persisted.soundMuted };
            saveMergePersisted(p);
            setPersisted(p);
          }}
        />
      </GameModal>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} title={PRODUCT_TITLE} />
    </div>
  );
}
