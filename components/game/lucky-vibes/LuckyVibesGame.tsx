"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { ArcadeResumePrompt } from "@/components/arcade/ArcadeResumePrompt";
import { hasCompletedOnboarding, markOnboardingComplete } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useAuth } from "@/hooks/useAuth";
import { submitArcadeScore } from "@/hooks/usePostRun";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";
import type { SymbolAsset } from "@/lib/lucky-vibes/luckyAssets";
import { preloadLuckyAssets } from "@/lib/lucky-vibes/luckyAssets";
import { evaluateLuckyAchievements } from "@/lib/lucky-vibes/luckyAchievements";
import {
  LUCKY_GAME_ID,
  LUCKY_LEVEL_ID,
  LUCKY_STAGE_SIZE,
  REELS,
  VIBE_LOCK_RESPINS,
  winTierForAmount,
  type LuckyMode,
  type WinTier,
} from "@/lib/lucky-vibes/luckyConfig";
import {
  applySpin,
  finalRunScore,
  initClassicRun,
  initDailyRun,
  initZenRun,
  serializeMoves,
  type LuckyRunState,
} from "@/lib/lucky-vibes/luckyEngine";
import type { Grid } from "@/lib/lucky-vibes/luckyGrid";
import { cellKey, generateGrid, gridFromVibeLockState } from "@/lib/lucky-vibes/luckyGrid";
import { orbKeysFromGrid, vibeLockTriggerGrid } from "@/lib/lucky-vibes/luckyLockFeature";
import { luckySpinsAward } from "@/lib/lucky-vibes/luckySpinsFeature";
import { winningCellKeys } from "@/lib/lucky-vibes/luckyWays";
import { emptyLuckyJuice, spawnWinJuice, type LuckyJuiceFx } from "@/lib/lucky-vibes/luckyJuice";
import { cellSize } from "@/lib/lucky-vibes/luckyPaint";
import {
  playLuckyFeatureEnter,
  playLuckyGameOver,
  playLuckyGrandVibe,
  playLuckyMultBump,
  playLuckyPull,
  playLuckyReelStop,
  playLuckyRetrigger,
  playLuckySpinsEnter,
  playLuckySpinsExit,
  playLuckyWinBig,
  playLuckyWinSmall,
} from "@/lib/lucky-vibes/luckySounds";
import {
  loadLuckyPersisted,
  recordLuckyRun,
  saveLuckyPersisted,
  loadLuckyResumeSnapshot,
  saveLuckyResumeSnapshot,
  luckyResumeDetail,
  type LuckyResumeSnapshot,
  type LuckyPersisted,
} from "@/lib/lucky-vibes/luckyStorage";
import { playUiClick } from "@/lib/sounds";
import { GameModal } from "../GameModal";
import { AuthModal } from "../AuthModal";
import { LuckyGoalsPanel } from "./LuckyGoalsPanel";
import { LuckyCabinetFrame } from "./LuckyCabinetFrame";
import { LuckyHud, LuckySpinButton } from "./LuckyHud";
import { LuckyLeaderboardPanel } from "./LuckyLeaderboardPanel";
import { LuckyPaytableModal } from "./LuckyPaytableModal";
import { LuckyReelStage } from "./LuckyReelStage";
import { LuckyResultScreen } from "./LuckyResultScreen";
import { LuckySettingsPanel } from "./LuckySettingsPanel";
import { LuckyTitleScreen } from "./LuckyTitleScreen";
import { LuckyWinOverlay } from "./LuckyWinOverlay";
import { LuckySpinsTransition, type LuckySpinsTransitionPhase } from "./LuckySpinsTransition";
import { VibeLockTransition, type VibeLockTransitionPhase } from "./VibeLockTransition";
import type { SymbolId } from "@/lib/lucky-vibes/luckyConfig";

export type LuckyUiPhase = "menu" | "playing" | "gameover";

export interface LuckyVibesGameProps {
  onExitToLibrary?: () => void;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function winCellCenters(keys: Set<string>): { x: number; y: number }[] {
  const { cw, ch } = cellSize(LUCKY_STAGE_SIZE);
  return [...keys].map((key) => {
    const [reel, row] = key.split(",").map(Number);
    return { x: reel! * cw + cw / 2, y: row! * ch + ch / 2 };
  });
}

export default function LuckyVibesGame({ onExitToLibrary }: LuckyVibesGameProps) {
  const { user } = useAuth();
  const [uiPhase, setUiPhase] = useState<LuckyUiPhase>("menu");
  const [mode, setMode] = useState<LuckyMode>("classic");
  const [run, setRun] = useState<LuckyRunState | null>(null);
  const runRef = useRef<LuckyRunState | null>(null);
  const [persisted, setPersisted] = useState(loadLuckyPersisted);
  const [assets, setAssets] = useState<Map<SymbolId, SymbolAsset> | null>(null);
  const [displayGrid, setDisplayGrid] = useState<Grid | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [winKeys, setWinKeys] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);
  const [reelStopMask, setReelStopMask] = useState(REELS);
  const [juice, setJuice] = useState<LuckyJuiceFx>(emptyLuckyJuice());
  const [winOverlay, setWinOverlay] = useState<{ tier: WinTier; amount: number } | null>(null);
  const [featureTint, setFeatureTint] = useState<"none" | "luckySpins" | "vibeLock">("none");
  const [spinAnimIndex, setSpinAnimIndex] = useState(-1);
  const [inFeature, setInFeature] = useState(false);
  const [luckyTransition, setLuckyTransition] = useState<LuckySpinsTransitionPhase>(null);
  const [vibeLockTransition, setVibeLockTransition] = useState<VibeLockTransitionPhase>(null);
  const [vibeLockRespins, setVibeLockRespins] = useState<number | null>(null);
  const [vibeLockGrandVibe, setVibeLockGrandVibe] = useState(false);
  const [lockedOrbKeys, setLockedOrbKeys] = useState<Set<string>>(new Set());
  const [vibeLockRollingKeys, setVibeLockRollingKeys] = useState<Set<string>>(new Set());
  const [expandedReels, setExpandedReels] = useState<number[]>([]);
  const [luckySpinsLeft, setLuckySpinsLeft] = useState<number | null>(null);
  const [luckyMultiplier, setLuckyMultiplier] = useState<number | null>(null);
  const [featureExitWin, setFeatureExitWin] = useState(0);
  const spinningRef = useRef(false);

  const [finalScore, setFinalScore] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const [leadersOpen, setLeadersOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paytableOpen, setPaytableOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pendingResume, setPendingResume] = useState<LuckyResumeSnapshot | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [serverRank, setServerRank] = useState<number | null>(null);
  const [resultAchSlugs, setResultAchSlugs] = useState<string[]>([]);

  const muted = persisted.soundMuted;

  useArcadeAudioZone(uiPhase === "playing" ? "game" : "hub");

  useEffect(() => {
    preloadLuckyAssets().then(setAssets).catch(console.error);
    if (!hasCompletedOnboarding("lucky-vibes")) setShowCoach(true);
    setPendingResume(loadLuckyResumeSnapshot());
  }, []);

  useEffect(() => {
    const state = runRef.current;
    if (!state || state.phase === "ended" || state.mode === "zen") return;
    if (uiPhase !== "playing") return;
    saveLuckyResumeSnapshot({ version: 1, savedAt: Date.now(), state });
  }, [run, uiPhase]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const startRun = useCallback(
    (m: LuckyMode) => {
      playUiClick(muted);
      saveLuckyResumeSnapshot(null);
      setPendingResume(null);
      if (m === "daily") void bumpNightStreakLoggedIn(!!user);
      const state = m === "daily" ? initDailyRun() : m === "zen" ? initZenRun() : initClassicRun();
      runRef.current = state;
      setRun(state);
      setMode(m);
      setDisplayScore(0);
      setDisplayGrid(generateGrid(state.seed, -1, m));
      setSpinAnimIndex(-1);
      setWinKeys(new Set());
      setJuice(emptyLuckyJuice());
      setFeatureTint("none");
      setReelStopMask(REELS);
      setSpinning(false);
      setInFeature(false);
      setLuckyTransition(null);
      setVibeLockTransition(null);
      setVibeLockGrandVibe(false);
      setLockedOrbKeys(new Set());
      setVibeLockRollingKeys(new Set());
      setExpandedReels([]);
      setLuckySpinsLeft(null);
      setLuckyMultiplier(null);
      setVibeLockRespins(null);
      setFeatureExitWin(0);
      setUiPhase("playing");
    },
    [muted, user]
  );

  const finishRun = useCallback(
    async (state: LuckyRunState) => {
      const score = finalRunScore(state);
      setFinalScore(score);

      const lineWins = state.moves.filter((m) => m.kind === "spin").length;
      let nextPersisted = recordLuckyRun(persisted, state.mode, score, {
        spinsUsed: state.spinsUsed,
        lineWins,
        luckySpinsTriggered: state.featureStats.luckySpinsTriggered,
        vibeLockTriggered: state.featureStats.vibeLockTriggered,
        grandVibe: state.featureStats.grandVibe,
        bestSingleSpin: state.featureStats.bestSingleSpin,
        maxStreak: state.maxStreak,
        maxMultiplier: state.maxMultiplier,
      });

      const newAch = evaluateLuckyAchievements(nextPersisted, {
        score,
        mode: state.mode,
        luckySpinsTriggered: state.featureStats.luckySpinsTriggered,
        vibeLockTriggered: state.featureStats.vibeLockTriggered,
        grandVibe: state.featureStats.grandVibe,
        bestSingleSpin: state.featureStats.bestSingleSpin,
        maxStreak: state.maxStreak,
        maxMultiplier: state.maxMultiplier,
        lastWins: state.lastWins,
      });

      if (newAch.length) {
        nextPersisted = {
          ...nextPersisted,
          achievements: [...nextPersisted.achievements, ...newAch.map((a) => a.slug)],
        };
      }
      setResultAchSlugs(newAch.map((a) => a.slug));
      setServerRank(null);

      const bestBefore = state.mode === "daily" ? persisted.bestDaily : persisted.bestClassic;
      setIsNewBest(score > bestBefore && state.mode !== "zen");
      saveLuckyPersisted(nextPersisted);
      setPersisted(nextPersisted);

      playLuckyGameOver(muted);
      saveLuckyResumeSnapshot(null);

      if (user && state.mode !== "zen") {
        const { rank } = await submitArcadeScore({
          gameId: LUCKY_GAME_ID,
          levelId: LUCKY_LEVEL_ID,
          mode: state.mode,
          seed: state.seed,
          score,
          stars: 0,
          shotsUsed: state.spinsUsed,
          shotsTotal: state.maxSpins,
          moves_json: serializeMoves(state.moves),
          won: true,
          run_hash: typeof crypto !== "undefined" ? crypto.randomUUID() : `l-${Date.now()}`,
          client_version: "vibe-sling@0.1.0",
        });
        setServerRank(rank);
      }

      setUiPhase("gameover");
    },
    [muted, persisted, user]
  );

  const animateReelSpin = useCallback(
    async (grid: Grid, animIndex: number) => {
      setDisplayGrid(grid);
      setSpinAnimIndex(animIndex);
      setWinKeys(new Set());
      setJuice(emptyLuckyJuice());
      setSpinning(true);
      setReelStopMask(0);

      if (!reducedMotion) {
        for (let r = 1; r <= REELS; r++) {
          await sleep(r === REELS ? 180 : 145);
          setReelStopMask(r);
          playLuckyReelStop(muted, r - 1);
        }
        await sleep(220);
      } else {
        setReelStopMask(REELS);
      }

      setSpinning(false);
    },
    [muted, reducedMotion]
  );

  const animateVibeLockRespin = useCallback(
    async (
      fromGrid: Grid,
      toGrid: Grid,
      lockedBefore: Set<string>,
      rollingKeys: Set<string>,
      newKeys: Set<string>
    ) => {
      setDisplayGrid(fromGrid);
      setLockedOrbKeys(lockedBefore);
      setVibeLockRollingKeys(rollingKeys);
      setWinKeys(new Set());
      setSpinning(false);
      setReelStopMask(REELS);

      await sleep(reducedMotion ? 450 : 1000);

      setVibeLockRollingKeys(new Set());
      setDisplayGrid(toGrid);
      setLockedOrbKeys(orbKeysFromGrid(toGrid));
      setWinKeys(newKeys);

      if (newKeys.size > 0) {
        const first = [...newKeys][0]!;
        const reel = Number(first.split(",")[0]);
        playLuckyReelStop(muted, reel);
      }

      await sleep(reducedMotion ? 300 : 500);
    },
    [muted, reducedMotion]
  );

  const handleSpin = useCallback(async () => {
    const state = runRef.current;
    if (!state || state.phase !== "playing" || spinningRef.current || inFeature) return;
    if (state.spinsLeft <= 0 && state.mode !== "zen") return;

    spinningRef.current = true;
    playLuckyPull(muted);

    const animIndex = state.spinIndex;
    const result = applySpin(state);
    runRef.current = result.state;
    setRun(result.state);

    const vibeFeatureWin = result.vibeLockPlayback?.featureWin ?? 0;
    const luckyFeatureWin = result.luckySpinsPlayback?.featureWin ?? 0;
    const featureWin = vibeFeatureWin + luckyFeatureWin;
    const baseSpinWin = result.spinWin - featureWin;
    const scoreAfterBase = result.state.score - featureWin;

    await animateReelSpin(result.grid, animIndex);

    setDisplayScore(scoreAfterBase);
    const baseKeys = winningCellKeys(result.wins);
    setWinKeys(baseKeys);

    if (baseSpinWin > 0) {
      if (baseSpinWin >= 500) playLuckyWinBig(muted);
      else playLuckyWinSmall(muted);
      const tier = winTierForAmount(baseSpinWin);
      if (tier !== "none" && !result.luckySpinsPlayback && !result.vibeLockPlayback) {
        setWinOverlay({ tier, amount: baseSpinWin });
        await sleep(reducedMotion ? 400 : 1200);
        setWinOverlay(null);
      }
      setJuice(
        spawnWinJuice(
          emptyLuckyJuice(),
          baseSpinWin,
          tier === "none" ? "nice" : tier,
          LUCKY_STAGE_SIZE / 2,
          LUCKY_STAGE_SIZE / 2,
          baseKeys,
          winCellCenters(baseKeys)
        )
      );
      await sleep(reducedMotion ? 300 : result.luckySpinsPlayback || result.vibeLockPlayback ? 400 : 500);
    }

    if (result.vibeLockPlayback) {
      const { steps, featureWin: totalFeatureWin, grandVibe, triggerGrid } = result.vibeLockPlayback;

      setInFeature(true);
      setFeatureTint("vibeLock");
      setDisplayGrid(triggerGrid);
      setLockedOrbKeys(orbKeysFromGrid(triggerGrid));
      setVibeLockTransition("enter");
      playLuckyFeatureEnter(muted);
      toast.success("Vibe Lock!", { icon: "🔒", duration: 2500 });
      await sleep(reducedMotion ? 700 : 1600);
      setVibeLockTransition(null);

      let runningScore = scoreAfterBase;
      setVibeLockRespins(VIBE_LOCK_RESPINS);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!;
        const lockedBefore = new Set(
          step.state.locked
            .filter((o) => !step.newOrbs.some((n) => cellKey(n.coord) === cellKey(o.coord)))
            .map((o) => cellKey(o.coord))
        );
        const gridBefore = gridFromVibeLockState(
          step.state.locked.filter((o) => !step.newOrbs.some((n) => cellKey(n.coord) === cellKey(o.coord)))
        );

        setVibeLockRespins(step.respinsLeftBefore);
        setDisplayGrid(gridBefore);
        setLockedOrbKeys(lockedBefore);

        const rollingKeys = new Set(step.rolledKeys);
        const newKeys = new Set(step.newOrbs.map((o) => cellKey(o.coord)));

        await animateVibeLockRespin(gridBefore, step.gridAfter, lockedBefore, rollingKeys, newKeys);

        setVibeLockRespins(step.respinsLeft);
        setLockedOrbKeys(orbKeysFromGrid(step.gridAfter));

        if (step.newOrbs.length > 0) {
          if (step.respinsLeft === VIBE_LOCK_RESPINS && step.respinsLeftBefore < VIBE_LOCK_RESPINS) {
            toast.success("Craig locked — respins reset!", { icon: "✨", duration: 2000 });
          }
          runningScore += step.newOrbs.reduce((s, o) => s + o.points, 0);
          setDisplayScore(Math.min(runningScore, result.state.score));
        } else {
          await sleep(reducedMotion ? 300 : 500);
        }

        await sleep(reducedMotion ? 350 : 650);
      }

      setDisplayScore(result.state.score);
      setVibeLockGrandVibe(grandVibe);

      if (totalFeatureWin >= 200) {
        const tier = winTierForAmount(totalFeatureWin);
        if (tier !== "none") {
          setWinOverlay({ tier, amount: totalFeatureWin });
          await sleep(reducedMotion ? 500 : 1200);
          setWinOverlay(null);
        }
      }

      setFeatureExitWin(totalFeatureWin);
      setVibeLockTransition("exit");
      if (grandVibe) playLuckyGrandVibe(muted);
      await sleep(reducedMotion ? 600 : 1000);
      setVibeLockTransition(null);

      setInFeature(false);
      setFeatureTint("none");
      setVibeLockRespins(null);
      setLockedOrbKeys(new Set());
      setVibeLockRollingKeys(new Set());
      setWinKeys(new Set());
    } else if (result.luckySpinsPlayback) {
      const { steps, scatterCount, featureWin: totalFeatureWin } = result.luckySpinsPlayback;

      setInFeature(true);
      setFeatureTint("luckySpins");
      setLuckyMultiplier(1);
      setLuckySpinsLeft(luckySpinsAward(scatterCount));
      setExpandedReels(steps[0]?.expandedReels ?? [1, 2, 3, 4]);

      setLuckyTransition("enter");
      playLuckySpinsEnter(muted);
      await sleep(reducedMotion ? 700 : 1600);
      setLuckyTransition(null);

      let runningScore = scoreAfterBase;
      let prevMult = 1;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!;
        setLuckySpinsLeft(step.state.spinsLeft);
        setLuckyMultiplier(step.multiplierAfter);
        setExpandedReels(step.expandedReels);

        await animateReelSpin(step.grid, 10000 + i);

        const stepKeys = winningCellKeys(step.wins);
        setWinKeys(stepKeys);
        runningScore += step.spinWin;
        setDisplayScore(runningScore);

        if (step.multiplierAfter > prevMult) {
          playLuckyMultBump(muted, step.multiplierAfter);
          prevMult = step.multiplierAfter;
        }

        if (step.spinWin > 0) {
          if (step.spinWin >= 500) playLuckyWinBig(muted);
          else playLuckyWinSmall(muted);
          const tier = winTierForAmount(step.spinWin);
          setJuice(
            spawnWinJuice(
              emptyLuckyJuice(),
              step.spinWin,
              tier === "none" ? "nice" : tier,
              LUCKY_STAGE_SIZE / 2,
              LUCKY_STAGE_SIZE / 2,
              stepKeys,
              winCellCenters(stepKeys)
            )
          );
        }

        if (step.retriggerSpins > 0) {
          playLuckyRetrigger(muted);
          toast.success(`+${step.retriggerSpins} Lucky Spins!`, { icon: "✨", duration: 2500 });
        }

        await sleep(reducedMotion ? 350 : 650);
      }

      if (totalFeatureWin >= 200) {
        const tier = winTierForAmount(totalFeatureWin);
        if (tier !== "none") {
          setWinOverlay({ tier, amount: totalFeatureWin });
          await sleep(reducedMotion ? 500 : 1400);
          setWinOverlay(null);
        }
      }

      setFeatureExitWin(totalFeatureWin);
      setLuckyTransition("exit");
      playLuckySpinsExit(muted);
      await sleep(reducedMotion ? 600 : 1100);
      setLuckyTransition(null);

      setInFeature(false);
      setFeatureTint("none");
      setExpandedReels([]);
      setLuckySpinsLeft(null);
      setLuckyMultiplier(null);
      setDisplayScore(result.state.score);
    } else if (baseSpinWin > 0) {
      /* already handled above when no feature */
    } else {
      setDisplayScore(result.state.score);
    }

    spinningRef.current = false;

    if (result.state.phase === "ended") {
      await sleep(500);
      await finishRun(result.state);
    }
  }, [muted, finishRun, reducedMotion, animateReelSpin, animateVibeLockRespin, inFeature]);

  const toggleMute = () => {
    const next = !muted;
    const p = { ...persisted, soundMuted: next };
    saveLuckyPersisted(p);
    setPersisted(p);
  };

  const resumeRun = () => {
    const snap = pendingResume ?? loadLuckyResumeSnapshot();
    if (!snap) return;
    playUiClick(muted);
    runRef.current = snap.state;
    setRun(snap.state);
    setMode(snap.state.mode);
    setDisplayScore(snap.state.score);
    setDisplayGrid(snap.state.lastGrid ?? generateGrid(snap.state.seed, snap.state.spinIndex, snap.state.mode));
    setUiPhase("playing");
    setPendingResume(null);
  };

  const discardResume = () => {
    saveLuckyResumeSnapshot(null);
    setPendingResume(null);
  };

  if (uiPhase === "menu") {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-lg px-3 pb-arcade-player pt-arcade-player">
        {showCoach ? (
          <FirstRunCoachOverlay
            gameId="lucky-vibes"
            open={showCoach}
            muted={muted}
            onComplete={() => {
              markOnboardingComplete("lucky-vibes");
              setShowCoach(false);
            }}
          />
        ) : null}
        <LuckyTitleScreen
          muted={muted}
          onPlay={() => startRun("classic")}
          onDaily={() => startRun("daily")}
          onZen={() => startRun("zen")}
          onLeaders={() => setLeadersOpen(true)}
          onBadges={() => setBadgesOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onBack={onExitToLibrary}
          resume={
            pendingResume ? (
              <ArcadeResumePrompt
                label="Resume spins"
                detail={luckyResumeDetail(pendingResume)}
                muted={muted}
                onResume={resumeRun}
                onDiscard={discardResume}
              />
            ) : undefined
          }
        />
        <LuckyLeaderboardPanel open={leadersOpen} onClose={() => setLeadersOpen(false)} muted={muted} />
        <GameModal open={badgesOpen} onClose={() => setBadgesOpen(false)} title="Lucky Vibes badges" muted={muted} tall>
          <LuckyGoalsPanel persisted={persisted} />
        </GameModal>
        <LuckySettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} muted={muted} onToggleMute={toggleMute} />
      </div>
    );
  }

  if (uiPhase === "gameover" && run) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-arcade-player pt-arcade-player py-8">
        <LuckyResultScreen
          mode={mode}
          score={finalScore}
          spinsUsed={run.spinsUsed}
          bestSingleSpin={run.featureStats.bestSingleSpin}
          maxMultiplier={run.maxMultiplier}
          luckySpinsTriggered={run.featureStats.luckySpinsTriggered}
          vibeLockTriggered={run.featureStats.vibeLockTriggered}
          grandVibe={run.featureStats.grandVibe}
          isNewBest={isNewBest}
          muted={muted}
          isLoggedIn={!!user}
          serverRank={serverRank}
          newAchievementSlugs={resultAchSlugs}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenLeaderboard={() => setLeadersOpen(true)}
          onRestart={() => startRun(mode)}
          onMenu={() => {
            setUiPhase("menu");
            setRun(null);
            runRef.current = null;
            setPendingResume(loadLuckyResumeSnapshot());
          }}
        />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} title="Lucky Vibes" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col px-3 pb-arcade-player pt-arcade-player sm:pt-4">
      {winOverlay ? <LuckyWinOverlay tier={winOverlay.tier} amount={winOverlay.amount} /> : null}
      <LuckySpinsTransition
        phase={luckyTransition}
        freeSpins={luckySpinsLeft ?? undefined}
        totalWin={luckyTransition === "exit" ? featureExitWin : undefined}
      />
      <VibeLockTransition
        phase={vibeLockTransition}
        totalWin={vibeLockTransition === "exit" ? featureExitWin : undefined}
        grandVibe={vibeLockGrandVibe}
      />

      <LuckyHud
        score={displayScore}
        spinsLeft={run?.spinsLeft ?? 0}
        maxSpins={run?.maxSpins ?? 30}
        streak={run?.streak ?? 0}
        mode={mode}
        spinning={spinning}
        luckySpinsLeft={inFeature ? luckySpinsLeft : null}
        multiplier={inFeature ? luckyMultiplier : null}
        vibeLockRespins={inFeature && featureTint === "vibeLock" ? vibeLockRespins : null}
      />

      <div className="my-3 flex-1">
        {assets ? (
          <LuckyCabinetFrame
            featureLabel={
              featureTint === "luckySpins" ? "Lucky Spins" : featureTint === "vibeLock" ? "Vibe Lock" : null
            }
          >
            <LuckyReelStage
              grid={displayGrid}
              assets={assets}
              winningKeys={winKeys}
              spinning={spinning}
              reelStopMask={reelStopMask}
              juice={juice}
              featureTint={featureTint}
              lockedKeys={lockedOrbKeys.size > 0 ? lockedOrbKeys : undefined}
              rollingKeys={vibeLockRollingKeys.size > 0 ? vibeLockRollingKeys : undefined}
              spinSeed={run?.seed ?? "idle"}
              spinIndex={spinAnimIndex}
              mode={mode}
              reducedMotion={reducedMotion}
              expandedReels={expandedReels}
            />
          </LuckyCabinetFrame>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-2xl border border-gvc-gold/20 bg-black/40">
            <p className="font-body text-sm text-white/50">Loading symbols…</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 pb-2">
        <LuckySpinButton
          disabled={spinning || inFeature || !assets || ((run?.spinsLeft ?? 0) <= 0 && mode !== "zen")}
          onClick={handleSpin}
          label={inFeature ? "Feature…" : undefined}
        />
        <button
          type="button"
          onClick={() => setPaytableOpen(true)}
          className="font-body text-xs text-white/40 underline underline-offset-2"
        >
          Paytable
        </button>
      </div>

      <LuckyPaytableModal open={paytableOpen} onClose={() => setPaytableOpen(false)} muted={muted} />
    </div>
  );
}
