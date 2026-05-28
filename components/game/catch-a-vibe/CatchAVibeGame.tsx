"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { submitArcadeScore } from "@/hooks/usePostRun";
import type { AchievementDef } from "@/lib/achievements";
import { GameModal } from "../GameModal";
import { AuthModal } from "../AuthModal";
import { CatchTitleScreen } from "./CatchTitleScreen";
import { CatchHud } from "./CatchHud";
import { CatchResultScreen } from "./CatchResultScreen";
import { CatchGoalsPanel } from "./CatchGoalsPanel";
import { CatchSettingsPanel } from "./CatchSettingsPanel";
import { CatchLeaderboardPanel } from "./CatchLeaderboardPanel";
import { CatchCollectionPanel } from "./CatchCollectionPanel";
import {
  CATCH_DISPLAY_MAX_WIDTH,
  CATCH_GAME_ID,
  CATCH_LEVEL_ID,
  CATCH_WORLD,
  MAX_MOTES,
  MAX_PARTICLES,
  MAX_SHOCKWAVES,
} from "@/lib/catch-a-vibe/catchConfig";
import {
  activeEntities,
  startAbsorb,
  tickEntities,
  type CatchVibe,
} from "@/lib/catch-a-vibe/catchEntities";
import {
  createSwipeTrail,
  swipeEnd,
  swipeMove,
  swipeStart,
  testSegmentHits,
  updateNearMissGlow,
  type SwipeTrail,
} from "@/lib/catch-a-vibe/catchSwipe";
import {
  initComboState,
  isFullBloom,
  milestoneLabel,
  registerCatch,
  resetCombo,
  type ComboState,
} from "@/lib/catch-a-vibe/catchCombo";
import { countBloomChainsTriggered, findBloomCascade } from "@/lib/catch-a-vibe/catchBloom";
import {
  applyBadCatch,
  applyBadDodge,
  applyGoodCatch,
  applyGoodMiss,
  initRunState,
  type CatchRunState,
} from "@/lib/catch-a-vibe/catchPressure";
import { detectCatchGameOver } from "@/lib/catch-a-vibe/catchEndReason";
import {
  baseCatchPoints,
  comboMultiplier,
  goldenCatchBonus,
  survivalScorePerSec,
} from "@/lib/catch-a-vibe/catchScoring";
import { createSpawnScheduler, tickSpawnScheduler } from "@/lib/catch-a-vibe/catchSpawn";
import { catchDailySeed, catchRunSeed, catchSpawnRand } from "@/lib/catch-a-vibe/catchDaily";
import { paintCatchWorld } from "@/lib/catch-a-vibe/catchPaint";
import {
  createBurst,
  createFloatLabel,
  createShockwave,
  spawnAmbientMote,
  spawnCatchParticles,
  spawnParticles,
  tickBursts,
  tickFloatLabels,
  tickMotes,
  tickParticles,
  tickShockwaves,
  type CatchBurst,
  type CatchFloatLabel,
  type CatchMote,
  type CatchParticle,
  type CatchShockwave,
} from "@/lib/catch-a-vibe/catchJuice";
import { preloadCatchFaces } from "@/lib/catch-a-vibe/catchFaces";
import { loadCatchPersisted, saveCatchPersisted, recordCatchRun } from "@/lib/catch-a-vibe/catchStorage";
import { evaluateCatchAchievements } from "@/lib/catch-a-vibe/catchAchievements";
import { preloadMergeBackgrounds } from "@/lib/vibe-merge/mergeBackgrounds";
import type { CatchEndReason } from "@/lib/catch-a-vibe/catchEndReason";
import {
  playCatchCalm,
  playCatchCombo,
  playCatchCorruption,
  playCatchFullBloom,
  playCatchGameOver,
  playCatchSuccess,
  playCatchSwish,
} from "@/lib/catch-a-vibe/catchSounds";
import { playUiClick } from "@/lib/sounds";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { hasCompletedOnboarding } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";
import { ArcadeResumePrompt } from "@/components/arcade/ArcadeResumePrompt";
import {
  catchResumeDetail,
  loadCatchResumeSnapshot,
  saveCatchResume,
  type CatchResumeSnapshot,
} from "@/lib/catch-a-vibe/catchResume";

export type CatchPhase = "menu" | "playing" | "paused" | "gameover";
export type CatchMode = "classic" | "daily" | "zen";

export interface CatchAVibeGameProps {
  onExitToLibrary?: () => void;
}

function pointerToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const sx = CATCH_WORLD.width / rect.width;
  const sy = CATCH_WORLD.height / rect.height;
  return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
}

export default function CatchAVibeGame({ onExitToLibrary }: CatchAVibeGameProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<CatchVibe[]>([]);
  const trailRef = useRef<SwipeTrail>(createSwipeTrail());
  const comboRef = useRef<ComboState>(initComboState());
  const runRef = useRef<CatchRunState>(initRunState());
  const spawnRef = useRef<ReturnType<typeof createSpawnScheduler> | null>(null);
  const runSeedRef = useRef("");
  const rafRef = useRef<number>(0);
  const floatsRef = useRef<CatchFloatLabel[]>([]);
  const burstsRef = useRef<CatchBurst[]>([]);
  const particlesRef = useRef<CatchParticle[]>([]);
  const shockwavesRef = useRef<CatchShockwave[]>([]);
  const motesRef = useRef<CatchMote[]>([]);
  const shakeRef = useRef(0);
  const calmPulseRef = useRef(0);
  const hitStopRef = useRef(0);
  const endGameRef = useRef<(reason: CatchEndReason) => void>(() => undefined);
  const mutedRef = useRef(false);
  const caughtThisSwipeRef = useRef<Set<number>>(new Set());
  const bloomChainsRef = useRef(0);
  const goldenCatchesRef = useRef(0);
  const survivalAccRef = useRef(0);
  const scoreRef = useRef(0);
  const warnedBadRef = useRef(false);

  const [phase, setPhase] = useState<CatchPhase>("menu");
  const [persisted, setPersisted] = useState(loadCatchPersisted);
  const [mode, setMode] = useState<CatchMode>("classic");
  const [dailySeed, setDailySeed] = useState(catchDailySeed);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [badStrikes, setBadStrikes] = useState(0);
  const [runStart, setRunStart] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [finalStats, setFinalStats] = useState({
    maxCombo: 0,
    bloomChains: 0,
    badDodged: 0,
    catches: 0,
    misses: 0,
    survivalSec: 0,
  });
  const [endReason, setEndReason] = useState<CatchEndReason>("bad_vibes");
  const [leadersOpen, setLeadersOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<CatchResumeSnapshot | null>(null);
  const [serverRank, setServerRank] = useState<number | null>(null);
  const [resultAchSlugs, setResultAchSlugs] = useState<string[]>([]);

  const muted = persisted.soundMuted;
  mutedRef.current = muted;

  useArcadeAudioZone(phase === "playing" ? "game" : "hub");

  useEffect(() => {
    void preloadCatchFaces();
    void preloadMergeBackgrounds();
    setPendingResume(loadCatchResumeSnapshot());
  }, []);

  const selectPlayBackground = useCallback((id: string) => {
    setPersisted((prev) => {
      const next = { ...prev, playBackgroundId: id };
      saveCatchPersisted(next);
      return next;
    });
  }, []);

  const syncHud = useCallback((s: number, c: number, strikes: number) => {
    setScore(s);
    setCombo(c);
    setBadStrikes(strikes);
  }, []);

  const resolveCatch = useCallback(
    (vibe: CatchVibe, now: number) => {
      if (vibe.state === "absorbing") return;

      if (vibe.kind === "bad") {
        startAbsorb(vibe);
        playCatchCorruption(mutedRef.current);
        resetCombo(comboRef.current);
        floatsRef.current.push(createFloatLabel("BAD VIBE!", vibe.x, vibe.y, 1, true));
        shakeRef.current = Math.max(shakeRef.current, 10);
        particlesRef.current = spawnParticles(
          particlesRef.current,
          vibe.x,
          vibe.y,
          "#B06BFF",
          12,
          MAX_PARTICLES
        );

        const gameOver = applyBadCatch(runRef.current);
        syncHud(scoreRef.current, 0, runRef.current.badStrikes);

        if (gameOver && mode !== "zen") {
          setTimeout(() => endGameRef.current("bad_vibes"), 400);
        } else if (runRef.current.badStrikes === 2 && !warnedBadRef.current) {
          warnedBadRef.current = true;
          toast("One more bad vibe and you're out!", { icon: "⚠️", duration: 2500 });
        }
        return;
      }

      const prevCombo = comboRef.current.count;
      const wasGolden = vibe.kind === "golden" || vibe.colorId === 6;

      const { combo: newCombo } = registerCatch(comboRef.current, vibe.colorId, now);
      setMaxCombo((mc) => Math.max(mc, newCombo));
      applyGoodCatch(runRef.current);

      startAbsorb(vibe);
      playCatchSuccess(mutedRef.current, newCombo);
      playCatchSwish(mutedRef.current);

      let pts = baseCatchPoints(vibe.colorId);
      if (wasGolden) {
        pts += goldenCatchBonus();
        goldenCatchesRef.current += 1;
      }

      const mult = comboMultiplier(newCombo);
      const total = Math.round(pts * mult);
      scoreRef.current += total;

      bloomChainsRef.current += countBloomChainsTriggered(newCombo, prevCombo);

      burstsRef.current.push(createBurst(vibe.x, vibe.y, vibe.colorId, 22 + newCombo * 2));
      particlesRef.current = spawnCatchParticles(
        particlesRef.current,
        vibe.x,
        vibe.y,
        vibe.colorId,
        newCombo,
        MAX_PARTICLES
      );

      if (isFullBloom(newCombo)) {
        playCatchFullBloom(mutedRef.current);
        playCatchCalm(mutedRef.current);
        calmPulseRef.current = 1;
        hitStopRef.current = 320;
        shakeRef.current = 14;
        shockwavesRef.current = [
          ...shockwavesRef.current.slice(-MAX_SHOCKWAVES + 1),
          createShockwave(vibe.x, vibe.y, 200, "full", vibe.colorId),
          createShockwave(vibe.x, vibe.y, 120, "calm", vibe.colorId),
        ];
      } else if (newCombo >= 3) {
        shockwavesRef.current = [
          ...shockwavesRef.current.slice(-MAX_SHOCKWAVES + 1),
          createShockwave(vibe.x, vibe.y, 40 + newCombo * 12, "bloom", vibe.colorId),
        ];
        if (newCombo >= 5) hitStopRef.current = Math.max(hitStopRef.current, 100);
        shakeRef.current = Math.max(shakeRef.current, 6);
      }

      playCatchCombo(mutedRef.current, newCombo);

      const label = milestoneLabel(newCombo);
      if (label) {
        floatsRef.current.push(createFloatLabel(label, vibe.x, vibe.y, newCombo, newCombo >= 7));
      }
      if (newCombo >= 3) {
        floatsRef.current.push(createFloatLabel(`×${mult.toFixed(1)}`, vibe.x, vibe.y - 20, newCombo, false));
      }

      const bloom = findBloomCascade(entitiesRef.current, vibe, newCombo);
      for (const c of bloom.cascaded) {
        if (c.state !== "absorbing" && !caughtThisSwipeRef.current.has(c.id)) {
          caughtThisSwipeRef.current.add(c.id);
          startAbsorb(c);
          const cascadePts = Math.round(baseCatchPoints(c.colorId) * mult * 0.75);
          scoreRef.current += cascadePts;
          applyGoodCatch(runRef.current);
          burstsRef.current.push(createBurst(c.x, c.y, c.colorId, 18));
          particlesRef.current = spawnCatchParticles(
            particlesRef.current,
            c.x,
            c.y,
            c.colorId,
            newCombo,
            MAX_PARTICLES
          );
        }
      }

      syncHud(scoreRef.current, newCombo, runRef.current.badStrikes);
    },
    [mode, syncHud]
  );

  const buildCatchSnapshot = useCallback((): CatchResumeSnapshot | null => {
    if (phase !== "playing" && phase !== "paused") return null;
    if (mode === "zen") return null;
    if (!spawnRef.current) return null;
    const elapsedMs = runStart ? performance.now() - runStart : 0;
    return {
      version: 1,
      savedAt: Date.now(),
      mode,
      dailySeed,
      runSeed: runSeedRef.current,
      runStart,
      elapsedMs,
      score: scoreRef.current,
      combo: comboRef.current.count,
      maxCombo: comboRef.current.maxCombo,
      comboState: { ...comboRef.current },
      bloomChains: bloomChainsRef.current,
      goldenCatches: goldenCatchesRef.current,
      survivalAcc: survivalAccRef.current,
      run: { ...runRef.current },
      entities: entitiesRef.current.map((e) => ({ ...e })),
      spawn: {
        nextSpawnAt: spawnRef.current.nextSpawnAt,
        intervalMs: spawnRef.current.intervalMs,
        startInterval: spawnRef.current.startInterval,
      },
    };
  }, [phase, mode, dailySeed, runStart]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    const id = window.setInterval(() => {
      const snap = buildCatchSnapshot();
      if (snap) saveCatchResume(snap);
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase, buildCatchSnapshot]);

  const endGame = useCallback(
    async (reason: CatchEndReason) => {
      saveCatchResume(null);
      if (phase === "gameover") return;
      playCatchGameOver(mutedRef.current);

      const survivalMs = runStart ? performance.now() - runStart : 0;
      const finalScore = scoreRef.current;
      const stats = {
        catches: runRef.current.catches,
        maxCombo: comboRef.current.maxCombo,
        bloomChains: bloomChainsRef.current,
        badDodged: runRef.current.badDodged,
        goldenCatches: goldenCatchesRef.current,
      };

      setEndReason(reason);
      setFinalStats({
        maxCombo: stats.maxCombo,
        bloomChains: stats.bloomChains,
        badDodged: stats.badDodged,
        catches: stats.catches,
        misses: runRef.current.misses,
        survivalSec: survivalMs / 1000,
      });

      let nextPersisted = recordCatchRun(persisted, mode, finalScore, stats);
      const newAch = evaluateCatchAchievements(nextPersisted, { ...stats, score: finalScore });
      if (newAch.length) {
        nextPersisted = {
          ...nextPersisted,
          achievements: [...nextPersisted.achievements, ...newAch.map((a) => a.slug)],
        };
      }
      setResultAchSlugs(newAch.map((a) => a.slug));
      setServerRank(null);
      setPersisted(nextPersisted);
      saveCatchPersisted(nextPersisted);

      const best = mode === "daily" ? nextPersisted.bestDaily : nextPersisted.bestClassic;
      setIsNewBest(mode !== "zen" && finalScore >= best && finalScore > 0);

      if (user && mode !== "zen") {
        const { rank } = await submitArcadeScore({
          gameId: CATCH_GAME_ID,
          mode,
          levelId: CATCH_LEVEL_ID,
          seed: mode === "daily" ? dailySeed : runSeedRef.current,
          score: finalScore,
          stars: 0,
          shotsUsed: stats.catches,
          shotsTotal: runRef.current.misses,
          won: true,
          moves_json: JSON.stringify({
            survivalMs: Math.floor(survivalMs),
            catches: stats.catches,
            totalCatches: stats.catches,
            maxCombo: stats.maxCombo,
            combo: stats.maxCombo,
            bloomChains: stats.bloomChains,
            badDodged: stats.badDodged,
            badStrikes: runRef.current.badStrikes,
            seed: mode === "daily" ? dailySeed : runSeedRef.current,
          }),
          run_hash: typeof crypto !== "undefined" ? crypto.randomUUID() : `c-${Date.now()}`,
          client_version: "vibe-sling@0.1.0",
        });
        setServerRank(rank);
      }

      entitiesRef.current = [];
      setPhase("gameover");
    },
    [dailySeed, mode, persisted, phase, runStart, user]
  );

  endGameRef.current = endGame;

  const startRun = useCallback((m: CatchMode) => {
    saveCatchResume(null);
    const seed = catchRunSeed(m);
    const daily = catchDailySeed();
    runSeedRef.current = seed;
    setDailySeed(daily);

    entitiesRef.current = [];
    trailRef.current = createSwipeTrail();
    comboRef.current = initComboState();
    runRef.current = initRunState();
    floatsRef.current = [];
    burstsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    motesRef.current = [];
    shakeRef.current = 0;
    calmPulseRef.current = 0;
    hitStopRef.current = 0;
    caughtThisSwipeRef.current = new Set();
    bloomChainsRef.current = 0;
    goldenCatchesRef.current = 0;
    survivalAccRef.current = 0;
    scoreRef.current = 0;
    warnedBadRef.current = false;

    spawnRef.current = createSpawnScheduler(catchSpawnRand(seed), m);

    if (m === "daily") void bumpNightStreakLoggedIn(!!user);

    setMode(m);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setBadStrikes(0);
    setRunStart(performance.now());
    setCoachOpen(!hasCompletedOnboarding(CATCH_GAME_ID));
    setPhase("playing");
  }, [user]);

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let last = performance.now();
    let frame = 0;
    let hudTick = 0;

    const loop = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(50, now - last);
      const feelScale = hitStopRef.current > 0 ? 0.45 : 1;
      const feelDt = dt * feelScale;
      last = now;
      frame += 1;

      hitStopRef.current = Math.max(0, hitStopRef.current - dt);
      calmPulseRef.current = Math.max(0, calmPulseRef.current - dt * 0.00085);
      shakeRef.current = Math.max(0, shakeRef.current - dt * 0.018);

      if (frame % 75 === 0) {
        motesRef.current = spawnAmbientMote(motesRef.current, CATCH_WORLD.width, CATCH_WORLD.height, MAX_MOTES);
      }
      motesRef.current = tickMotes(motesRef.current, feelDt, CATCH_WORLD.height);
      shockwavesRef.current = tickShockwaves(shockwavesRef.current, feelDt);
      floatsRef.current = tickFloatLabels(floatsRef.current, feelDt);
      burstsRef.current = tickBursts(burstsRef.current, feelDt);
      particlesRef.current = tickParticles(particlesRef.current, feelDt);

      const elapsed = now - runStart;

      if (mode !== "zen" && spawnRef.current) {
        const spawned = tickSpawnScheduler(spawnRef.current, entitiesRef.current, elapsed, elapsed);
        if (spawned) entitiesRef.current.push(spawned);

        const overReason = detectCatchGameOver(runRef.current, false);
        if (overReason) {
          endGameRef.current(overReason);
          return;
        }
      } else if (spawnRef.current) {
        const spawned = tickSpawnScheduler(spawnRef.current, entitiesRef.current, elapsed, elapsed);
        if (spawned) entitiesRef.current.push(spawned);
      }

      const { escaped, remaining } = tickEntities(entitiesRef.current, feelDt);
      entitiesRef.current = remaining;

      for (const e of escaped) {
        if (e.state === "absorbing") continue;
        if (e.kind === "bad") {
          applyBadDodge(runRef.current);
          if (e.y < CATCH_WORLD.escapeTop) {
            floatsRef.current.push(createFloatLabel("DODGED!", e.x, Math.max(24, e.y + 28), 1, false));
          }
        } else if (mode !== "zen") {
          applyGoodMiss(runRef.current);
        }
      }

      if (mode !== "zen") {
        survivalAccRef.current += dt;
        if (survivalAccRef.current >= 1000) {
          survivalAccRef.current -= 1000;
          scoreRef.current += survivalScorePerSec(elapsed);
        }
      }

      updateNearMissGlow(entitiesRef.current, trailRef.current);

      hudTick += dt;
      if (hudTick >= 120) {
        hudTick = 0;
        syncHud(scoreRef.current, comboRef.current.count, runRef.current.badStrikes);
      }

      paintCatchWorld(ctx, {
        entities: entitiesRef.current,
        trail: trailRef.current,
        backgroundId: persisted.playBackgroundId,
        badStrikes: runRef.current.badStrikes,
        calmPulse: calmPulseRef.current,
        shake: shakeRef.current,
        now,
        floats: floatsRef.current,
        bursts: burstsRef.current,
        particles: particlesRef.current,
        shockwaves: shockwavesRef.current,
        motes: motesRef.current,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, persisted.playBackgroundId, phase, runStart, syncHud]);

  const onPointerDown = useCallback(
    (ev: React.PointerEvent) => {
      if (phase !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(ev.pointerId);
      const { x, y } = pointerToWorld(canvas, ev.clientX, ev.clientY);
      caughtThisSwipeRef.current = new Set();
      swipeStart(trailRef.current, x, y, ev.pointerId);
    },
    [phase]
  );

  const onPointerMove = useCallback(
    (ev: React.PointerEvent) => {
      if (phase !== "playing" || !trailRef.current.active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = pointerToWorld(canvas, ev.clientX, ev.clientY);
      const trail = trailRef.current;
      const prev = trail.points[trail.points.length - 1];
      swipeMove(trail, x, y);
      if (!prev) return;

      const hits = testSegmentHits(activeEntities(entitiesRef.current), prev.x, prev.y, x, y);
      const now = performance.now();
      for (const v of hits) {
        if (caughtThisSwipeRef.current.has(v.id)) continue;
        caughtThisSwipeRef.current.add(v.id);
        resolveCatch(v, now);
      }
    },
    [phase, resolveCatch]
  );

  const onPointerUp = useCallback(() => {
    swipeEnd(trailRef.current);
    setTimeout(() => {
      if (!trailRef.current.active) trailRef.current.points = [];
    }, 120);
  }, []);

  const best = mode === "daily" ? persisted.bestDaily : persisted.bestClassic;

  const resumeRun = useCallback(() => {
    const snap = pendingResume ?? loadCatchResumeSnapshot();
    if (!snap) return;
    playUiClick(muted);
    saveCatchResume(null);
    runSeedRef.current = snap.runSeed;
    setDailySeed(snap.dailySeed);
    entitiesRef.current = snap.entities.map((e) => ({ ...e }));
    trailRef.current = createSwipeTrail();
    comboRef.current = { ...snap.comboState };
    runRef.current = { ...snap.run };
    floatsRef.current = [];
    burstsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    motesRef.current = [];
    shakeRef.current = 0;
    calmPulseRef.current = 0;
    hitStopRef.current = 0;
    caughtThisSwipeRef.current = new Set();
    bloomChainsRef.current = snap.bloomChains;
    goldenCatchesRef.current = snap.goldenCatches;
    survivalAccRef.current = snap.survivalAcc;
    scoreRef.current = snap.score;
    warnedBadRef.current = false;
    spawnRef.current = {
      ...snap.spawn,
      rand: catchSpawnRand(snap.runSeed),
    };
    setMode(snap.mode);
    setScore(snap.score);
    setCombo(snap.combo);
    setMaxCombo(snap.maxCombo);
    setBadStrikes(snap.run.badStrikes);
    setRunStart(performance.now() - snap.elapsedMs);
    setPendingResume(null);
    setPhase("playing");
  }, [muted, pendingResume]);

  const discardResume = useCallback(() => {
    saveCatchResume(null);
    setPendingResume(null);
  }, []);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center px-2 py-4 pb-arcade-player pt-arcade-player">
      {phase === "menu" ? (
        <CatchTitleScreen
          muted={muted}
          playBackgroundId={persisted.playBackgroundId}
          onSelectBackground={selectPlayBackground}
          onPlay={() => startRun("classic")}
          onDaily={() => startRun("daily")}
          onZen={() => startRun("zen")}
          onLeaders={() => setLeadersOpen(true)}
          onBadges={() => setBadgesOpen(true)}
          onCollection={() => setCollectionOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onBack={onExitToLibrary}
          resume={
            pendingResume ? (
              <ArcadeResumePrompt
                label="Resume catch"
                detail={catchResumeDetail(pendingResume)}
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
          className="relative w-full rounded-2xl border border-gvc-gold/20 bg-black/40 shadow-[0_0_48px_rgba(255,224,72,0.08)]"
          style={{ maxWidth: CATCH_DISPLAY_MAX_WIDTH, aspectRatio: `${CATCH_WORLD.width}/${CATCH_WORLD.height}` }}
        >
          <canvas
            ref={canvasRef}
            width={CATCH_WORLD.width}
            height={CATCH_WORLD.height}
            className="h-full w-full touch-none rounded-2xl"
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <CatchHud
            score={score}
            best={best}
            combo={combo}
            maxCombo={maxCombo}
            badStrikes={badStrikes}
            mode={mode}
            dailySeed={dailySeed}
            onPause={() => {
              playUiClick(muted);
              setPhase(phase === "paused" ? "playing" : "paused");
            }}
          />
          <FirstRunCoachOverlay
            gameId={CATCH_GAME_ID}
            open={coachOpen}
            muted={muted}
            onComplete={() => setCoachOpen(false)}
          />
        </div>
      )}

      {phase === "paused" ? (
        <GameModal open title="Paused" onClose={() => setPhase("playing")} muted={muted}>
          <button
            type="button"
            onClick={() => {
              playUiClick(muted);
              setPhase("playing");
            }}
            className="mb-2 w-full rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={() => {
              playUiClick(muted);
              const snap = buildCatchSnapshot();
              if (snap) saveCatchResume(snap);
              setPhase("menu");
              setPendingResume(loadCatchResumeSnapshot());
            }}
            className="w-full rounded-xl border border-white/15 py-3 font-display text-sm font-bold uppercase text-white/70"
          >
            Quit to menu
          </button>
        </GameModal>
      ) : null}

      {phase === "gameover" ? (
        <CatchResultScreen
          score={score}
          best={best}
          maxCombo={finalStats.maxCombo}
          bloomChains={finalStats.bloomChains}
          badDodged={finalStats.badDodged}
          catches={finalStats.catches}
          survivalSec={finalStats.survivalSec}
          endReason={endReason}
          mode={mode}
          isNewBest={isNewBest}
          muted={muted}
          signedIn={!!user}
          serverRank={serverRank}
          newAchievementSlugs={resultAchSlugs}
          onRetry={() => startRun(mode)}
          onMenu={() => {
            setPhase("menu");
            setPendingResume(loadCatchResumeSnapshot());
          }}
          onSignIn={() => setAuthOpen(true)}
          onOpenLeaderboard={() => setLeadersOpen(true)}
        />
      ) : null}

      <CatchLeaderboardPanel open={leadersOpen} onClose={() => setLeadersOpen(false)} muted={muted} />
      <CatchGoalsPanel open={badgesOpen} onClose={() => setBadgesOpen(false)} muted={muted} persisted={persisted} />
      <CatchSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        muted={muted}
        onToggleMute={() => {
          setPersisted((p) => {
            const next = { ...p, soundMuted: !p.soundMuted };
            saveCatchPersisted(next);
            return next;
          });
        }}
      />
      <CatchCollectionPanel
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
        muted={muted}
        persisted={persisted}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} />
    </div>
  );
}
