"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { submitArcadeScore } from "@/hooks/usePostRun";
import type { AchievementDef } from "@/lib/achievements";
import { GameModal } from "../GameModal";
import { AuthModal } from "../AuthModal";
import { GardenTitleScreen } from "./GardenTitleScreen";
import { GardenHud } from "./GardenHud";
import { GardenResultScreen } from "./GardenResultScreen";
import { GardenGoalsPanel } from "./GardenGoalsPanel";
import { GardenSettingsPanel } from "./GardenSettingsPanel";
import { GardenLeaderboardPanel } from "./GardenLeaderboardPanel";
import { GardenCollectionPanel } from "./GardenCollectionPanel";
import { GardenZenPalette } from "./GardenZenPalette";
import {
  COMBO_WINDOW_MS,
  DAILY_RUN_MS,
  GARDEN_DISPLAY_MAX_WIDTH,
  GARDEN_GAME_ID,
  GARDEN_LEVEL_ID,
  GARDEN_WORLD,
  MAX_ENTITIES,
  MAX_MOTES,
  MAX_PARTICLES,
  MAX_SHOCKWAVES,
  colorDef,
  type GardenColorId,
} from "@/lib/vibe-garden/gardenConfig";
import {
  createGardenWorld,
  drainGardenEvents,
  entityCount,
  plantEntity,
  addEntityDirect,
  markCorrupted,
  pluginOf,
  tickPendingPops,
  type CreatedGardenWorld,
} from "@/lib/vibe-garden/gardenPhysics";
import { plantAndReact } from "@/lib/vibe-garden/gardenReactions";
import {
  applyBloomPressure,
  applyCleanse,
  applyEvictPenalty,
  initCorruptionState,
  tickCorruption,
  type GardenCorruptionState,
} from "@/lib/vibe-garden/gardenCorruption";
import {
  detectGameOver,
  type GardenEndReason,
} from "@/lib/vibe-garden/gardenEndReason";
import { riskScoreMultiplier, survivalScorePerSec } from "@/lib/vibe-garden/gardenBalance";
import { popBonusPoints } from "@/lib/vibe-garden/gardenScoring";
import { paintGardenWorld } from "@/lib/vibe-garden/gardenPaint";
import {
  createBurst,
  createFloatLabel,
  createShockwave,
  spawnAmbientMote,
  spawnBloomParticles,
  spawnParticles,
  tickBursts,
  tickFloatLabels,
  tickMotes,
  tickParticles,
  tickShockwaves,
  type GardenBurst,
  type GardenFloatLabel,
  type GardenMote,
  type GardenParticle,
  type GardenShockwave,
} from "@/lib/vibe-garden/gardenJuice";
import { preloadGardenFaces } from "@/lib/vibe-garden/gardenFaces";
import { PlantQueue, createPlantQueue, plantQueueFromSnapshot } from "@/lib/vibe-garden/gardenQueue";
import {
  dailyCorruptionScript,
  dailyPlantQueue,
  dailyStartLayout,
  gardenDailySeed,
} from "@/lib/vibe-garden/gardenDaily";
import { loadGardenPersisted, saveGardenPersisted, recordGardenRun } from "@/lib/vibe-garden/gardenStorage";
import { preloadMergeBackgrounds } from "@/lib/vibe-merge/mergeBackgrounds";
import { evaluateGardenAchievements } from "@/lib/vibe-garden/gardenAchievements";
import {
  playGardenBloom,
  playGardenCalm,
  playGardenCascade,
  playGardenCleanse,
  playGardenCombo,
  playGardenCorruption,
  playGardenFullBloom,
  playGardenGameOver,
  playGardenPlant,
  playGardenPop,
} from "@/lib/vibe-garden/gardenSounds";
import { playUiClick } from "@/lib/sounds";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { hasCompletedOnboarding } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";
import { ArcadeResumePrompt } from "@/components/arcade/ArcadeResumePrompt";
import {
  gardenResumeDetail,
  loadGardenResumeSnapshot,
  saveGardenResume,
  type GardenResumeSnapshot,
} from "@/lib/vibe-garden/gardenResume";

export type GardenPhase = "menu" | "playing" | "paused" | "gameover";
export type GardenMode = "classic" | "daily" | "zen";

export interface VibeGardenGameProps {
  onExitToLibrary?: () => void;
}

function pointerToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const sx = GARDEN_WORLD.width / rect.width;
  const sy = GARDEN_WORLD.height / rect.height;
  return {
    x: (clientX - rect.left) * sx,
    y: (clientY - rect.top) * sy,
  };
}

export default function VibeGardenGame({ onExitToLibrary }: VibeGardenGameProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<CreatedGardenWorld | null>(null);
  const queueRef = useRef<PlantQueue | null>(null);
  const corruptionRef = useRef<GardenCorruptionState>(initCorruptionState());
  const rafRef = useRef<number>(0);
  const floatsRef = useRef<GardenFloatLabel[]>([]);
  const burstsRef = useRef<GardenBurst[]>([]);
  const particlesRef = useRef<GardenParticle[]>([]);
  const shockwavesRef = useRef<GardenShockwave[]>([]);
  const motesRef = useRef<GardenMote[]>([]);
  const shakeRef = useRef(0);
  const bowlPulseRef = useRef(0);
  const calmPulseRef = useRef(0);
  const hitStopRef = useRef(0);
  const endGameRef = useRef<(reason: GardenEndReason) => void>(() => undefined);
  const mutedRef = useRef(false);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const lastComboAt = useRef(0);
  const plantsRef = useRef(0);
  const maxChainRef = useRef(0);
  const cleansesRef = useRef(0);
  const goldBloomsRef = useRef(0);
  const dailyEventsRef = useRef<{ atMs: number; x: number; y: number }[]>([]);
  const dailyEventIdx = useRef(0);
  const survivalAccRef = useRef(0);
  const showHintRef = useRef(true);
  const zenColorRef = useRef<GardenColorId>(0);
  const scoreRef = useRef(0);
  const warnedCorruptionRef = useRef(false);
  const warnedStabilityRef = useRef(false);
  const warnedFullRef = useRef(false);

  const [phase, setPhase] = useState<GardenPhase>("menu");
  const [persisted, setPersisted] = useState(loadGardenPersisted);
  const [mode, setMode] = useState<GardenMode>("classic");
  const [dailySeed, setDailySeed] = useState(gardenDailySeed);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [corruption, setCorruption] = useState(4);
  const [stability, setStability] = useState(88);
  const [riskMult, setRiskMult] = useState(1);
  const [nextColor, setNextColor] = useState<GardenColorId>(0);
  const [zenColor, setZenColor] = useState<GardenColorId>(0);
  const [runStart, setRunStart] = useState(0);
  const [dailyRemainingSec, setDailyRemainingSec] = useState(DAILY_RUN_MS / 1000);
  const [isNewBest, setIsNewBest] = useState(false);
  const [finalStats, setFinalStats] = useState({ maxChain: 0, cleanses: 0, survivalSec: 0, stability: 100, corruption: 0 });
  const [endReason, setEndReason] = useState<GardenEndReason>("corruption");
  const [leadersOpen, setLeadersOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<GardenResumeSnapshot | null>(null);
  const [serverRank, setServerRank] = useState<number | null>(null);
  const [resultAchSlugs, setResultAchSlugs] = useState<string[]>([]);
  const runStartRef = useRef(0);

  const muted = persisted.soundMuted;
  mutedRef.current = muted;

  useArcadeAudioZone(phase === "playing" ? "game" : "hub");
  zenColorRef.current = zenColor;

  useEffect(() => {
    void preloadGardenFaces();
    void preloadMergeBackgrounds();
    setPendingResume(loadGardenResumeSnapshot());
  }, []);

  const selectPlayBackground = useCallback((id: string) => {
    setPersisted((prev) => {
      const next = { ...prev, playBackgroundId: id };
      saveGardenPersisted(next);
      return next;
    });
  }, []);

  const syncHud = useCallback((s: number, c: number, corr: number, stab: number) => {
    setScore(s);
    setCombo(c);
    setCorruption(corr);
    setStability(stab);
    setRiskMult(riskScoreMultiplier(corr));
  }, []);

  const buildGardenSnapshot = useCallback((): GardenResumeSnapshot | null => {
    const world = worldRef.current;
    if (!world || mode === "zen") return null;
    const q = queueRef.current;
    if (!q) return null;
    const elapsedMs = runStartRef.current ? performance.now() - runStartRef.current : 0;
    return {
      version: 1,
      savedAt: Date.now(),
      mode,
      dailySeed,
      runStart: runStartRef.current,
      elapsedMs,
      score: scoreRef.current,
      combo: comboRef.current,
      maxCombo: maxComboRef.current,
      plants: plantsRef.current,
      maxChain: maxChainRef.current,
      cleanses: cleansesRef.current,
      goldBlooms: goldBloomsRef.current,
      corruption: { ...corruptionRef.current },
      queue: q.exportSnapshot(),
      nextColor: q.peek(),
      entities: world.entities.map((b) => {
        const p = pluginOf(b);
        return { x: b.position.x, y: b.position.y, colorId: p.colorId, state: p.state };
      }),
      dailyEventIdx: dailyEventIdx.current,
    };
  }, [mode, dailySeed]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "paused") return;
    const id = window.setInterval(() => {
      const snap = buildGardenSnapshot();
      if (snap) saveGardenResume(snap);
    }, 2000);
    return () => window.clearInterval(id);
  }, [phase, buildGardenSnapshot]);

  const endGame = useCallback(
    async (reason: GardenEndReason) => {
      saveGardenResume(null);
      const world = worldRef.current;
      if (!world || phase === "gameover") return;
      if (reason !== "daily_complete") playGardenGameOver(mutedRef.current);

      const survivalMs = runStart ? performance.now() - runStart : 0;
      const finalScore = scoreRef.current;
      const stats = {
        plants: plantsRef.current,
        maxChain: maxChainRef.current,
        cleanses: cleansesRef.current,
        goldBlooms: goldBloomsRef.current,
      };

      setEndReason(reason);
      setFinalStats({
        maxChain: stats.maxChain,
        cleanses: stats.cleanses,
        survivalSec: survivalMs / 1000,
        stability: corruptionRef.current.stability,
        corruption: corruptionRef.current.meter,
      });

      let nextPersisted = recordGardenRun(persisted, mode, finalScore, stats);
      const newAch = evaluateGardenAchievements(nextPersisted, {
        score: finalScore,
        maxChain: stats.maxChain,
        cleanses: stats.cleanses,
        survivalMs,
        goldBlooms: stats.goldBlooms,
      });
      if (newAch.length) {
        nextPersisted = {
          ...nextPersisted,
          achievements: [...nextPersisted.achievements, ...newAch.map((a) => a.slug)],
        };
      }
      setResultAchSlugs(newAch.map((a) => a.slug));
      setServerRank(null);
      setPersisted(nextPersisted);
      saveGardenPersisted(nextPersisted);

      const best = mode === "daily" ? nextPersisted.bestDaily : nextPersisted.bestClassic;
      setIsNewBest(mode !== "zen" && finalScore >= best && finalScore > 0);

      if (user && mode !== "zen") {
        const { rank } = await submitArcadeScore({
          gameId: GARDEN_GAME_ID,
          mode,
          levelId: GARDEN_LEVEL_ID,
          seed: mode === "daily" ? dailySeed : null,
          score: finalScore,
          stars: 0,
          shotsUsed: stats.plants,
          shotsTotal: 999,
          won: true,
          moves_json: JSON.stringify({
            survivalMs: Math.floor(survivalMs),
            plants: stats.plants,
            totalPlants: stats.plants,
            maxBloomChain: stats.maxChain,
            blooms: stats.maxChain,
            cleanses: stats.cleanses,
          }),
          run_hash: typeof crypto !== "undefined" ? crypto.randomUUID() : `g-${Date.now()}`,
          client_version: "vibe-sling@0.1.0",
        });
        setServerRank(rank);
      }

      world.dispose();
      worldRef.current = null;
      setPhase("gameover");
    },
    [dailySeed, mode, persisted, phase, runStart, user]
  );

  endGameRef.current = endGame;

  const startRun = useCallback(
    (m: GardenMode) => {
      saveGardenResume(null);
      worldRef.current?.dispose();
      const world = createGardenWorld();
      worldRef.current = world;
      corruptionRef.current = initCorruptionState();
      floatsRef.current = [];
      burstsRef.current = [];
      particlesRef.current = [];
      shockwavesRef.current = [];
      motesRef.current = [];
      shakeRef.current = 0;
      bowlPulseRef.current = 0;
      calmPulseRef.current = 0;
      hitStopRef.current = 0;
      comboRef.current = 0;
      maxComboRef.current = 0;
      lastComboAt.current = 0;
      plantsRef.current = 0;
      maxChainRef.current = 0;
      cleansesRef.current = 0;
      goldBloomsRef.current = 0;
      survivalAccRef.current = 0;
      showHintRef.current = true;
      dailyEventIdx.current = 0;
      warnedCorruptionRef.current = false;
      warnedStabilityRef.current = false;
      warnedFullRef.current = false;

      const seed = gardenDailySeed();
      setDailySeed(seed);

      if (m === "classic") {
        queueRef.current = createPlantQueue(() => Math.random());
      } else if (m === "daily") {
        queueRef.current = dailyPlantQueue(seed);
        dailyEventsRef.current = dailyCorruptionScript(seed);
        let dailyCorrupt = 0;
        for (const ent of dailyStartLayout(seed)) {
          const body = addEntityDirect(world, ent.x, ent.y, ent.colorId);
          if (ent.corrupted) {
            markCorrupted(body);
            dailyCorrupt += 1;
          }
        }
        corruptionRef.current.meter = Math.min(55, 10 + dailyCorrupt * 6);
        corruptionRef.current.stability = Math.max(62, 86 - dailyCorrupt * 5);
      } else {
        queueRef.current = null;
      }

      const peek = m === "zen" ? zenColorRef.current : queueRef.current!.peek();
      setNextColor(peek);
      setMode(m);
      setScore(0);
      scoreRef.current = 0;
      setCombo(0);
      setMaxCombo(0);
      maxComboRef.current = 0;
      setCorruption(corruptionRef.current.meter);
      setStability(corruptionRef.current.stability);
      setRiskMult(riskScoreMultiplier(corruptionRef.current.meter));
      setRunStart(performance.now());
      runStartRef.current = performance.now();
      if (m === "daily") void bumpNightStreakLoggedIn(!!user);
      setCoachOpen(!hasCompletedOnboarding("vibe-garden"));
      setPhase("playing");
    },
    [user]
  );

  const handlePlant = useCallback(
    (wx: number, wy: number) => {
      const world = worldRef.current;
      if (!world || phase !== "playing") return;

      const colorId = mode === "zen" ? zenColorRef.current : queueRef.current?.peek();
      if (colorId === undefined) return;

      const wasCrowded = mode !== "zen" && entityCount(world) >= MAX_ENTITIES;
      const body = plantEntity(world, wx, wy, colorId);
      if (!body) return;

      const evicted = world.lastEvict;
      if (evicted) {
        world.lastEvict = null;
        applyEvictPenalty(corruptionRef.current);
        playGardenPop(mutedRef.current, 1);
        burstsRef.current.push(createBurst(evicted.x, evicted.y, evicted.colorId, 18));
        particlesRef.current = spawnParticles(
          particlesRef.current,
          evicted.x,
          evicted.y,
          colorDef(evicted.colorId).accent,
          5,
          MAX_PARTICLES
        );
        floatsRef.current.push(createFloatLabel("FADED", evicted.x, evicted.y - 10, 1, false));
        toast("+3% corruption — build 3+ chains to clear space!", { id: "garden-evict", duration: 2200 });
      } else if (wasCrowded) {
        toast("Garden crowded — need 3+ chains to pop vibes!", { id: "garden-room", duration: 2200 });
      }

      showHintRef.current = false;
      plantsRef.current += 1;
      playGardenPlant(mutedRef.current);

      if (mode !== "zen" && queueRef.current) {
        queueRef.current.consume();
        setNextColor(queueRef.current.peek());
      }

      const result = plantAndReact(world, body, comboRef.current, mode !== "zen");
      if (result.points > 0) {
        const now = performance.now();
        if (now - lastComboAt.current < COMBO_WINDOW_MS) {
          comboRef.current += 1;
        } else {
          comboRef.current = 1;
        }
        lastComboAt.current = now;
        setMaxCombo((mc) => {
          const next = Math.max(mc, comboRef.current);
          maxComboRef.current = next;
          return next;
        });
        maxChainRef.current = Math.max(maxChainRef.current, result.chain);
        cleansesRef.current += result.cleanses;
        if (result.cascade) goldBloomsRef.current += 1;

        const popPts = popBonusPoints(result.pops);
        const risk = riskScoreMultiplier(corruptionRef.current.meter);
        const bloomPts = Math.round((result.points + popPts) * risk);
        scoreRef.current += bloomPts;
        setScore(scoreRef.current);
        applyBloomPressure(corruptionRef.current, result.chain);
        if (result.cleanses > 0) applyCleanse(corruptionRef.current, result.chain);

        playGardenBloom(mutedRef.current, result.chain);
        if (result.fullBloom) {
          playGardenFullBloom(mutedRef.current);
          playGardenCalm(mutedRef.current);
          bowlPulseRef.current = 1;
          calmPulseRef.current = 1;
          hitStopRef.current = 340;
          shakeRef.current = 16;
          shockwavesRef.current = [
            ...shockwavesRef.current.slice(-MAX_SHOCKWAVES + 1),
            createShockwave(body.position.x, body.position.y, 200, "full", colorId),
            createShockwave(body.position.x, body.position.y, 130, "calm", colorId),
          ];
        } else if (result.chain >= 3) {
          bowlPulseRef.current = Math.max(bowlPulseRef.current, 0.35 + result.chain * 0.06);
          shockwavesRef.current = [
            ...shockwavesRef.current.slice(-MAX_SHOCKWAVES + 1),
            createShockwave(body.position.x, body.position.y, 35 + result.chain * 14, "bloom", colorId),
          ];
          if (result.chain >= 5) hitStopRef.current = Math.max(hitStopRef.current, 120);
        }
        if (result.cascade) playGardenCascade(mutedRef.current);
        if (result.cleanses) playGardenCleanse(mutedRef.current);
        playGardenCombo(mutedRef.current, comboRef.current);

        if (result.cascade) shakeRef.current = Math.max(shakeRef.current, 10);
        else if (result.chain >= 4) shakeRef.current = Math.max(shakeRef.current, 5);

        burstsRef.current.push(createBurst(body.position.x, body.position.y, colorId, 24 + result.chain * 3));
        particlesRef.current = spawnBloomParticles(
          particlesRef.current,
          body.position.x,
          body.position.y,
          colorId,
          result.chain,
          MAX_PARTICLES
        );
        if (result.chain >= 3 && result.pops > 0) {
          floatsRef.current.push(
            createFloatLabel(`RISK ×${risk.toFixed(2)}`, body.position.x, body.position.y - 24, result.chain, false)
          );
        }
      for (const label of result.labels) {
          const mega =
            label.includes("LEGENDARY") ||
            label.includes("GOLDEN") ||
            label.includes("FULL BLOOM") ||
            label.includes("ECOSYSTEM");
          floatsRef.current.push(createFloatLabel(label, body.position.x, body.position.y - (mega ? 18 : 0), result.chain, mega));
        }
      }

      syncHud(
        scoreRef.current,
        comboRef.current,
        corruptionRef.current.meter,
        corruptionRef.current.stability
      );
    },
    [mode, phase, syncHud]
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let last = performance.now();
    let frame = 0;
    let hudTick = 0;

    const loop = (now: number) => {
      const world = worldRef.current;
      const ctx = canvas.getContext("2d");
      if (!world || !ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(50, now - last);
      const feelScale = hitStopRef.current > 0 ? 0.45 : 1;
      const feelDt = dt * feelScale;
      last = now;
      frame += 1;

      hitStopRef.current = Math.max(0, hitStopRef.current - dt);
      bowlPulseRef.current = Math.max(0, bowlPulseRef.current - dt * 0.0018);
      calmPulseRef.current = Math.max(0, calmPulseRef.current - dt * 0.00085);
      shakeRef.current = Math.max(0, shakeRef.current - dt * 0.018);

      if (frame % 75 === 0) {
        motesRef.current = spawnAmbientMote(motesRef.current, GARDEN_WORLD.width, GARDEN_WORLD.height, MAX_MOTES);
      }
      motesRef.current = tickMotes(motesRef.current, feelDt, GARDEN_WORLD.height);
      shockwavesRef.current = tickShockwaves(shockwavesRef.current, feelDt);

      const elapsed = now - runStart;
      const corruptionEnabled = mode !== "zen";

      if (corruptionEnabled) {
        const corruptTick = tickCorruption(
          world,
          corruptionRef.current,
          now,
          dt,
          elapsed,
          true,
          mode === "classic" ? undefined : 0
        );
        if (corruptTick.spawned) {
          playGardenCorruption(mutedRef.current, corruptionRef.current.meter / 100);
          const cx = 120 + Math.random() * (GARDEN_WORLD.width - 240);
          const cy = 140 + Math.random() * 100;
          shockwavesRef.current = [
            ...shockwavesRef.current.slice(-MAX_SHOCKWAVES + 1),
            createShockwave(cx, cy, 70, "corrupt", 0),
          ];
        }

        if (mode === "daily") {
          setDailyRemainingSec(Math.max(0, Math.ceil((DAILY_RUN_MS - elapsed) / 1000)));
          while (
            dailyEventIdx.current < dailyEventsRef.current.length &&
            dailyEventsRef.current[dailyEventIdx.current]!.atMs <= elapsed
          ) {
            const ev = dailyEventsRef.current[dailyEventIdx.current]!;
            if (entityCount(world) < MAX_ENTITIES - 1) {
              const b = addEntityDirect(world, ev.x, ev.y, 0);
              markCorrupted(b);
            }
            dailyEventIdx.current += 1;
          }
          if (elapsed >= DAILY_RUN_MS) {
            endGameRef.current("daily_complete");
            return;
          }
        }

        const overReason = detectGameOver(corruptionRef.current, false);
        if (overReason) {
          endGameRef.current(overReason);
          return;
        }

        const meter = corruptionRef.current.meter;
        const stab = corruptionRef.current.stability;
        if (meter >= 55 && !warnedCorruptionRef.current) {
          warnedCorruptionRef.current = true;
          toast("Corruption rising — hit orange vibes in 3+ chains!", { icon: "⚠️", duration: 3000 });
        }
        if (stab <= 40 && meter >= 25 && !warnedStabilityRef.current) {
          warnedStabilityRef.current = true;
          toast("Stability falling — big chains (3+) restore balance!", { icon: "⚠️", duration: 3000 });
        }
        const count = entityCount(world);
        if (count >= MAX_ENTITIES - 3 && !warnedFullRef.current) {
          warnedFullRef.current = true;
          toast("Garden crowded — only 3+ chains pop vibes!", { icon: "🌸", duration: 2500 });
        }
      }

      const survPts = survivalScorePerSec(
        corruptionRef.current.meter,
        corruptionRef.current.stability
      );
      if (survPts > 0) {
        survivalAccRef.current += dt;
        if (survivalAccRef.current >= 1000) {
          survivalAccRef.current -= 1000;
          scoreRef.current += survPts;
          setScore(scoreRef.current);
        }
      }

      for (const ev of drainGardenEvents(world)) {
        if (ev.label) {
          floatsRef.current.push(createFloatLabel(ev.label, ev.x, ev.y, ev.chain, ev.type === "cascade"));
        }
      }

      for (const pop of tickPendingPops(world, now)) {
        playGardenPop(mutedRef.current, 1);
        burstsRef.current.push(createBurst(pop.x, pop.y, pop.colorId, 22));
        particlesRef.current = spawnParticles(
          particlesRef.current,
          pop.x,
          pop.y,
          colorDef(pop.colorId).accent,
          pop.reason === "cleanse" ? 10 : 6,
          MAX_PARTICLES
        );
        if (pop.reason === "bloom" || pop.reason === "cleanse") {
          floatsRef.current.push(createFloatLabel("POP!", pop.x, pop.y - 12, 1, pop.reason === "cleanse"));
        }
      }

      floatsRef.current = tickFloatLabels(floatsRef.current, feelDt);
      burstsRef.current = tickBursts(burstsRef.current, feelDt);
      particlesRef.current = tickParticles(particlesRef.current, feelDt);

      hudTick += dt;
      if (hudTick >= 100) {
        hudTick = 0;
        syncHud(scoreRef.current, comboRef.current, corruptionRef.current.meter, corruptionRef.current.stability);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, GARDEN_WORLD.width, GARDEN_WORLD.height);
      paintGardenWorld(ctx, world.engine, {
        corruption: corruptionRef.current.meter,
        stability: corruptionRef.current.stability,
        backgroundId: persisted.playBackgroundId,
        floats: floatsRef.current,
        bursts: burstsRef.current,
        particles: particlesRef.current,
        shockwaves: shockwavesRef.current,
        motes: motesRef.current,
        shakeX: (Math.random() - 0.5) * shakeRef.current,
        shakeY: (Math.random() - 0.5) * shakeRef.current,
        bowlPulse: bowlPulseRef.current,
        calmPulse: calmPulseRef.current,
        showHint: showHintRef.current,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode, phase, runStart, syncHud, persisted.playBackgroundId]);

  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = pointerToWorld(canvas, e.clientX, e.clientY);
    handlePlant(x, y);
  };

  const resumeRun = useCallback(() => {
    const snap = pendingResume ?? loadGardenResumeSnapshot();
    if (!snap) return;
    playUiClick(muted);
    saveGardenResume(null);
    worldRef.current?.dispose();
    const world = createGardenWorld();
    worldRef.current = world;
    corruptionRef.current = { ...snap.corruption };
    if (snap.mode === "daily") {
      dailyEventsRef.current = dailyCorruptionScript(snap.dailySeed);
      dailyEventIdx.current = snap.dailyEventIdx;
      queueRef.current = plantQueueFromSnapshot(snap.queue);
    } else if (snap.mode === "classic") {
      queueRef.current = plantQueueFromSnapshot(snap.queue);
    } else {
      queueRef.current = null;
    }
    for (const ent of snap.entities) {
      const body = addEntityDirect(world, ent.x, ent.y, ent.colorId, ent.state);
      if (ent.state === "corrupted") markCorrupted(body);
    }
    plantsRef.current = snap.plants;
    maxChainRef.current = snap.maxChain;
    cleansesRef.current = snap.cleanses;
    goldBloomsRef.current = snap.goldBlooms;
    comboRef.current = snap.combo;
    maxComboRef.current = snap.maxCombo;
    scoreRef.current = snap.score;
    const resumedAt = performance.now();
    runStartRef.current = resumedAt - snap.elapsedMs;
    setMode(snap.mode);
    setDailySeed(snap.dailySeed);
    setScore(snap.score);
    setCombo(snap.combo);
    setMaxCombo(snap.maxCombo);
    setCorruption(snap.corruption.meter);
    setStability(snap.corruption.stability);
    setRiskMult(riskScoreMultiplier(snap.corruption.meter));
    setNextColor(snap.nextColor);
    setRunStart(runStartRef.current);
    floatsRef.current = [];
    burstsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    motesRef.current = [];
    setPendingResume(null);
    setPhase("playing");
  }, [muted, pendingResume]);

  const discardResume = useCallback(() => {
    saveGardenResume(null);
    setPendingResume(null);
  }, []);

  const best = mode === "daily" ? persisted.bestDaily : persisted.bestClassic;

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center px-2 py-4 pb-arcade-player pt-arcade-player">
      {phase === "menu" ? (
        <GardenTitleScreen
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
                label="Resume garden"
                detail={gardenResumeDetail(pendingResume)}
                muted={muted}
                onResume={resumeRun}
                onDiscard={discardResume}
              />
            ) : undefined
          }
        />
      ) : null}

      {phase === "playing" || phase === "paused" ? (
        <div
          className="relative w-full rounded-2xl border border-gvc-gold/20 bg-black/40 shadow-[0_0_48px_rgba(255,224,72,0.08)]"
          style={{ maxWidth: GARDEN_DISPLAY_MAX_WIDTH, aspectRatio: `${GARDEN_WORLD.width}/${GARDEN_WORLD.height}` }}
        >
          <canvas
            ref={canvasRef}
            width={GARDEN_WORLD.width}
            height={GARDEN_WORLD.height}
            className="h-full w-full touch-none rounded-2xl"
            style={{ touchAction: "none" }}
            onPointerDown={onCanvasPointer}
          />
          <GardenHud
            score={score}
            best={best}
            nextColor={mode === "zen" ? zenColor : nextColor}
            combo={combo}
            corruption={corruption}
            stability={stability}
            riskMult={riskMult}
            mode={mode}
            dailySeed={dailySeed}
            dailyRemainingSec={mode === "daily" ? dailyRemainingSec : undefined}
            onPause={() => {
              playUiClick(muted);
              setPhase("paused");
            }}
          />
          {mode === "zen" ? (
            <GardenZenPalette
              selected={zenColor}
              onSelect={(c) => {
                setZenColor(c);
                setNextColor(c);
              }}
              muted={muted}
            />
          ) : null}
          <FirstRunCoachOverlay
            gameId="vibe-garden"
            open={coachOpen}
            muted={muted}
            onComplete={() => setCoachOpen(false)}
          />
        </div>
      ) : null}

      {phase === "paused" ? (
        <GameModal open onClose={() => {}} title="Paused" muted={muted}>
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
              const snap = buildGardenSnapshot();
              if (snap) saveGardenResume(snap);
              worldRef.current?.dispose();
              worldRef.current = null;
              setPhase("menu");
              setPendingResume(loadGardenResumeSnapshot());
            }}
            className="w-full rounded-xl border border-white/12 py-3 font-display text-xs font-bold uppercase text-white/60"
          >
            Quit to menu
          </button>
        </GameModal>
      ) : null}

      {phase === "gameover" && mode !== "zen" ? (
        <GardenResultScreen
          score={score}
          best={best}
          maxChain={finalStats.maxChain}
          cleanses={finalStats.cleanses}
          survivalSec={finalStats.survivalSec}
          stability={finalStats.stability}
          corruption={finalStats.corruption}
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
            setPendingResume(loadGardenResumeSnapshot());
          }}
          onSignIn={() => setAuthOpen(true)}
          onOpenLeaderboard={() => setLeadersOpen(true)}
        />
      ) : null}

      {phase === "gameover" && mode === "zen" ? (
        <GameModal open onClose={() => setPhase("menu")} title="Zen session" muted={muted}>
          <p className="font-body text-sm text-white/60">Planted {plantsRef.current} vibes this session.</p>
          <button
            type="button"
            onClick={() => startRun("zen")}
            className="mt-4 w-full rounded-xl bg-gvc-gold py-3 font-display text-sm font-black uppercase text-gvc-black"
          >
            Continue zen
          </button>
        </GameModal>
      ) : null}

      <GardenLeaderboardPanel open={leadersOpen} onClose={() => setLeadersOpen(false)} muted={muted} />
      <GardenGoalsPanel open={badgesOpen} onClose={() => setBadgesOpen(false)} muted={muted} persisted={persisted} />
      <GardenCollectionPanel
        open={collectionOpen}
        onClose={() => setCollectionOpen(false)}
        muted={muted}
        persisted={persisted}
      />
      <GardenSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        muted={muted}
        onToggleMute={() => {
          setPersisted((p) => {
            const n = { ...p, soundMuted: !p.soundMuted };
            saveGardenPersisted(n);
            return n;
          });
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} muted={muted} />
    </div>
  );
}
