"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import type { AchievementDef } from "@/lib/achievements";
import { showAchievementToasts } from "../AchievementToast";
import { GameModal } from "../GameModal";
import { ShiftTitleScreen } from "./ShiftTitleScreen";
import { ShiftHud } from "./ShiftHud";
import { ShiftResultScreen } from "./ShiftResultScreen";
import { ShiftLevelUpModal } from "./ShiftLevelUpModal";
import { ShiftBoardCanvas } from "./ShiftBoardCanvas";
import { ShiftLeaderboardPanel } from "./ShiftLeaderboardPanel";
import { ShiftGoalsPanel } from "./ShiftGoalsPanel";
import { ShiftSettingsPanel } from "./ShiftSettingsPanel";
import {
  SHIFT_GAME_ID,
  SHIFT_LEVEL_ID,
  PRODUCT_TITLE,
  type ShiftMode,
} from "@/lib/vibe-shift/shiftConfig";
import {
  applyPlayerMoveWithSteps,
  continueAfterLevelUp,
  initClassicRun,
  initDailyRun,
  serializeMoves,
  type ShiftRunState,
} from "@/lib/vibe-shift/shiftEngine";
import type { Board, ShiftMove } from "@/lib/vibe-shift/shiftBoard";
import { shiftDailySeed, shiftRunSeed } from "@/lib/vibe-shift/shiftClassic";
import { computeDailyFinalScore } from "@/lib/vibe-shift/shiftDaily";
import { preloadShiftFaces } from "@/lib/vibe-shift/shiftFaces";
import {
  loadShiftPersisted,
  saveShiftPersisted,
  recordShiftRun,
  loadShiftResumeSnapshot,
  saveShiftResumeSnapshot,
  shiftResumeDetail,
  type ShiftResumeSnapshot,
} from "@/lib/vibe-shift/shiftStorage";
import { evaluateShiftAchievements } from "@/lib/vibe-shift/shiftAchievements";
import { preloadMergeBackgrounds } from "@/lib/vibe-merge/mergeBackgrounds";
import type { ShiftEndReason } from "@/lib/vibe-shift/shiftEndReason";
import {
  playShiftGameOver,
  playShiftLevelUp,
  playShiftMatch,
  playShiftRevert,
  playShiftSlide,
} from "@/lib/vibe-shift/shiftSounds";
import { playUiClick } from "@/lib/sounds";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { ArcadeResumePrompt } from "@/components/arcade/ArcadeResumePrompt";
import { hasCompletedOnboarding, markOnboardingComplete } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";
import type { CascadeStepDetail } from "@/lib/vibe-shift/shiftRefill";
import { emptyShiftJuice, spawnMatchJuice, type ShiftJuiceFx } from "@/lib/vibe-shift/shiftJuice";
import type { FallMove } from "@/lib/vibe-shift/shiftGravity";
import { cellSize } from "@/lib/vibe-shift/shiftPaint";

export type ShiftPhase = "menu" | "playing" | "resolving" | "levelUp" | "gameover";

export interface VibeShiftGameProps {
  onExitToLibrary?: () => void;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function animateFall(duration: number, onFrame: (t: number) => void): Promise<void> {
  const start = performance.now();
  return new Promise((resolve) => {
    const frame = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      onFrame(t);
      if (t >= 1) resolve();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

export default function VibeShiftGame({ onExitToLibrary }: VibeShiftGameProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ShiftPhase>("menu");
  const phaseRef = useRef<ShiftPhase>("menu");
  phaseRef.current = phase;
  const [mode, setMode] = useState<ShiftMode>("classic");
  const [run, setRun] = useState<ShiftRunState | null>(null);
  const runRef = useRef<ShiftRunState | null>(null);
  const [persisted, setPersisted] = useState(loadShiftPersisted);
  const [reverting, setReverting] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [endReason, setEndReason] = useState<ShiftEndReason | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [displayBoard, setDisplayBoard] = useState<Board | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [juice, setJuice] = useState<ShiftJuiceFx>(emptyShiftJuice());
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [clearFade, setClearFade] = useState(0);
  const [fallProgress, setFallProgress] = useState<number | null>(null);
  const [falls, setFalls] = useState<FallMove[] | null>(null);
  const [fallBoard, setFallBoard] = useState<Board | null>(null);
  const resolvingRef = useRef(false);

  const [leadersOpen, setLeadersOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<ShiftResumeSnapshot | null>(null);

  const runSeedRef = useRef("");
  const dailySeedRef = useRef(shiftDailySeed());

  const muted = persisted.soundMuted;

  useArcadeAudioZone(phase === "playing" || phase === "resolving" ? "game" : "hub");

  useEffect(() => {
    preloadShiftFaces();
    preloadMergeBackgrounds();
    if (!hasCompletedOnboarding("vibe-shift")) setShowCoach(true);
    setPendingResume(loadShiftResumeSnapshot());
  }, []);

  useEffect(() => {
    const state = runRef.current;
    if (!state || state.phase === "ended") return;
    if (phase !== "playing" && phase !== "levelUp") return;
    saveShiftResumeSnapshot({
      version: 1,
      savedAt: Date.now(),
      state,
      runSeed: runSeedRef.current || state.runSeed,
    });
  }, [run, phase]);

  const finishRun = useCallback(
    async (state: ShiftRunState) => {
      const rawScore = state.score;
      const score = state.mode === "daily" ? computeDailyFinalScore(rawScore, state.movesUsed) : rawScore;
      setFinalScore(score);
      setEndReason(state.endReason);

      let nextPersisted = recordShiftRun(persisted, state.mode, score, {
        level: state.level,
        totalClears: state.totalClears,
        maxCascade: state.maxCascade,
        endReason: state.endReason,
      });

      const newAch = evaluateShiftAchievements(nextPersisted, {
        score,
        level: state.level,
        totalClears: state.totalClears,
        maxCascade: state.maxCascade,
        endReason: state.endReason,
        mode: state.mode,
      });

      if (newAch.length) {
        nextPersisted = {
          ...nextPersisted,
          achievements: [...nextPersisted.achievements, ...newAch.map((a) => a.slug)],
        };
        showAchievementToasts(newAch as AchievementDef[], "vibe-shift");
      }

      setPersisted(nextPersisted);
      saveShiftPersisted(nextPersisted);

      const best = state.mode === "daily" ? nextPersisted.bestDaily : nextPersisted.bestClassic;
      setIsNewBest(score >= best && score > 0);

      playShiftGameOver(muted);
      setPhase("gameover");
      saveShiftResumeSnapshot(null);
      bumpNightStreakLoggedIn(!!user);

      if (user) {
        try {
          await fetch("/api/scores", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gameId: SHIFT_GAME_ID,
              mode: state.mode,
              levelId: SHIFT_LEVEL_ID,
              seed: state.mode === "daily" ? state.seed : runSeedRef.current,
              score,
              stars: 0,
              shotsUsed: state.movesUsed,
              shotsTotal: state.maxMoves ?? 999,
              won: true,
              moves_json: serializeMoves(state.moves),
              runSeed: state.mode === "classic" ? runSeedRef.current : undefined,
            }),
          });
        } catch {
          toast.error("Could not submit score.");
        }
      }
    },
    [persisted, muted, user]
  );

  const playCascadeSteps = useCallback(
    async (steps: CascadeStepDetail[], startScore: number) => {
      let score = startScore;
      for (const step of steps) {
        setFallProgress(null);
        setFalls(null);
        setFallBoard(null);
        setClearFade(0);
        setDisplayBoard(step.board.map((row) => [...row]));

        const cs = cellSize(step.board);
        setJuice(
          spawnMatchJuice(
            step.groups,
            step.coords,
            step.scoreDelta,
            cs,
            step.cascadeIndex,
            step.board.length,
            step.board[0]?.length ?? 6
          )
        );
        playShiftMatch(muted, step.cascadeIndex);
        await sleep(380);

        const matched = new Set(step.coords.map(({ r, c }) => `${r},${c}`));
        setClearingCells(matched);
        for (let f = 0; f <= 1; f += 0.25) {
          setClearFade(f);
          await sleep(55);
        }
        setClearingCells(new Set());
        setClearFade(0);
        setJuice(emptyShiftJuice());

        const cleared = step.boardCleared.map((row) => [...row]);
        setDisplayBoard(cleared);
        setFallBoard(cleared);
        setFalls(step.falls);

        await animateFall(480, (t) => setFallProgress(t));

        setFallProgress(null);
        setFalls(null);
        setFallBoard(null);
        setDisplayBoard(step.boardAfter.map((row) => [...row]));
        score += step.scoreDelta;
        setDisplayScore(score);
        await sleep(120);
      }
      setJuice(emptyShiftJuice());
      setClearingCells(new Set());
      setClearFade(0);
    },
    [muted]
  );

  const startClassic = () => {
    playUiClick(muted);
    saveShiftResumeSnapshot(null);
    setPendingResume(null);
    const seed = shiftRunSeed();
    runSeedRef.current = seed;
    const state = initClassicRun(seed);
    runRef.current = state;
    setRun(state);
    setDisplayBoard(null);
    setDisplayScore(0);
    setMode("classic");
    setPhase("playing");
  };

  const startDaily = () => {
    playUiClick(muted);
    saveShiftResumeSnapshot(null);
    setPendingResume(null);
    dailySeedRef.current = shiftDailySeed();
    const state = initDailyRun(dailySeedRef.current);
    runRef.current = state;
    setRun(state);
    setDisplayBoard(null);
    setDisplayScore(0);
    setMode("daily");
    setPhase("playing");
  };

  const handleShift = useCallback(
    (move: ShiftMove): boolean => {
      const state = runRef.current;
      if (!state || phaseRef.current !== "playing" || resolvingRef.current) return false;

      playShiftSlide(muted);
      const { state: next, reverted, steps } = applyPlayerMoveWithSteps(state, move);

      if (reverted) {
        runRef.current = next;
        setRun({ ...next });
        playShiftRevert(muted);
        setReverting(true);
        window.setTimeout(() => setReverting(false), 300);
        return true;
      }

      resolvingRef.current = true;
      setPhase("resolving");

      void (async () => {
        await playCascadeSteps(steps, state.score);

        runRef.current = next;
        setRun({ ...next });
        setDisplayBoard(null);
        setDisplayScore(next.score);
        resolvingRef.current = false;

        if (next.phase === "levelUp") {
          playShiftLevelUp(muted);
          setPhase("levelUp");
        } else if (next.phase === "ended") {
          void finishRun(next);
        } else {
          setPhase("playing");
        }
      })();

      return true;
    },
    [muted, playCascadeSteps, finishRun]
  );

  const continueLevel = () => {
    const state = runRef.current;
    if (!state) return;
    const next = continueAfterLevelUp(state);
    runRef.current = next;
    setRun({ ...next });
    setDisplayBoard(null);
    setDisplayScore(next.score);
    setPhase(next.phase === "ended" ? "gameover" : "playing");
    if (next.phase === "ended") void finishRun(next);
  };

  const toggleMute = () => {
    const next = { ...persisted, soundMuted: !persisted.soundMuted };
    setPersisted(next);
    saveShiftPersisted(next);
  };

  const resumeRun = () => {
    const snap = pendingResume ?? loadShiftResumeSnapshot();
    if (!snap) return;
    playUiClick(muted);
    runSeedRef.current = snap.runSeed;
    if (snap.state.mode === "daily") dailySeedRef.current = snap.state.seed;
    runRef.current = snap.state;
    setRun(snap.state);
    setMode(snap.state.mode);
    setDisplayBoard(null);
    setDisplayScore(snap.state.score);
    setPhase(snap.state.phase === "levelUp" ? "levelUp" : "playing");
    setPendingResume(null);
  };

  const discardResume = () => {
    saveShiftResumeSnapshot(null);
    setPendingResume(null);
  };

  const boardToShow = displayBoard ?? run?.board;
  const scoreToShow = phase === "resolving" ? displayScore : (run?.score ?? 0);

  if (phase === "menu") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-3 pb-arcade-player pt-arcade-player">
      <>
        {showCoach && (
          <FirstRunCoachOverlay
            gameId="vibe-shift"
            open={showCoach}
            muted={muted}
            onComplete={() => {
              markOnboardingComplete("vibe-shift");
              setShowCoach(false);
            }}
          />
        )}
        <ShiftTitleScreen
          muted={muted}
          playBackgroundId={persisted.playBackgroundId}
          onSelectBackground={(id) => {
            const next = { ...persisted, playBackgroundId: id };
            setPersisted(next);
            saveShiftPersisted(next);
          }}
          onPlay={startClassic}
          onDaily={startDaily}
          onLeaders={() => setLeadersOpen(true)}
          onBadges={() => setBadgesOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onBack={onExitToLibrary}
          resume={
            pendingResume ? (
              <ArcadeResumePrompt
                label="Resume shift"
                detail={shiftResumeDetail(pendingResume)}
                muted={muted}
                onResume={resumeRun}
                onDiscard={discardResume}
              />
            ) : undefined
          }
        />
        <ShiftLeaderboardPanel open={leadersOpen} onClose={() => setLeadersOpen(false)} muted={muted} />
        <GameModal open={badgesOpen} onClose={() => setBadgesOpen(false)} title="Shift badges" muted={muted} tall>
          <ShiftGoalsPanel persisted={persisted} />
        </GameModal>
        <ShiftSettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} muted={muted} onToggleMute={toggleMute} />
      </>
      </div>
    );
  }

  if (phase === "gameover" && run) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 py-8 pb-arcade-player pt-arcade-player">
        <ShiftResultScreen
          mode={mode}
          score={finalScore}
          level={run.level}
          endReason={endReason}
          isNewBest={isNewBest}
          muted={muted}
          onRestart={mode === "daily" ? startDaily : startClassic}
          onMenu={() => {
            setPhase("menu");
            setRun(null);
            runRef.current = null;
            setPendingResume(loadShiftResumeSnapshot());
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col gap-3 px-3 py-4 pb-arcade-player pt-arcade-player sm:pt-4">
      <ShiftHud mode={mode} score={scoreToShow} level={run?.level ?? 1} movesUsed={run?.movesUsed ?? 0} scorePulse={phase === "resolving"} />
      <p className="text-center font-body text-xs text-white/45">
        Drag rows, columns · match 3+ lines or 2×2 squares
      </p>
      {boardToShow && (
        <ShiftBoardCanvas
          board={boardToShow}
          disabled={phase !== "playing"}
          reverting={reverting}
          juice={juice}
          clearingCells={clearingCells}
          clearFade={clearFade}
          fallProgress={fallProgress}
          falls={falls}
          fallBoard={fallBoard}
          onShift={handleShift}
        />
      )}
      <button
        type="button"
        onClick={() => {
          playUiClick(muted);
          setPhase("menu");
          setRun(null);
          runRef.current = null;
          setDisplayBoard(null);
          setPendingResume(loadShiftResumeSnapshot());
        }}
        className="font-display text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-gvc-gold"
      >
        Exit to menu
      </button>
      {phase === "levelUp" && run && <ShiftLevelUpModal level={run.level} onContinue={continueLevel} />}
    </div>
  );
}
