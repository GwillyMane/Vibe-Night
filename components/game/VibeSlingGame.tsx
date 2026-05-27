"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Matter from "matter-js";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { createPhysicsWorld } from "@/lib/physics/createWorld";
import { getBlockMaterial, getTargetPhysics, getVibeKind, addTargetImpactDamage, TARGET_IMPACT_DAMAGE_POP } from "@/lib/physics/collisions";
import type { VibeBodyPlugin } from "@/lib/physics/collisions";
import {
  WORLD,
  dailyHandcraftedLevelId,
  dailyPersistKey,
  resolveChallenge,
  type ActiveChallenge,
  worldGroundY,
} from "@/lib/levels";
import { validateLevelPhysics } from "@/lib/physics/levelValidation";
import { todaySeed } from "@/lib/daily-seed";
import {
  BONUS_PER_REMAINING_SHOT,
  COMBO_EXTRA_TARGET,
  SCORE_BLOCK,
  SCORE_FRAGILE_BREAK,
  SCORE_TARGET,
  SCORE_UNDER_PAR,
  comboBonusForTargets,
  finalizeScore,
} from "@/lib/scoring";
import { evaluateAchievements } from "@/lib/achievements";
import {
  addLifetimeGlassBreaks,
  bumpDailyStreak,
  loadPersisted,
  mergeLifetimeWinStats,
  pushLocalLeaderRow,
  savePersisted,
  type PersistedState,
} from "@/lib/storage";
import {
  playAimStart,
  playComboHit,
  playGameOver,
  playImpact,
  playLaunch,
  playLevelComplete,
  playTargetClear,
  playModalOpen,
  playUiClick,
  resumeAudio,
} from "@/lib/sounds";
import { attachMatterBoardPaint, preloadProjectileUrl, type BoardFxSnapshot } from "@/lib/board/matterBoardPaint";
import { spawnParticles } from "@/lib/effects/particles";
import { BAD_VIBE_FACE_URL } from "@/lib/assets/gvcBrandFaces";
import { levelBackgroundUrl } from "@/lib/assets/gvcLevelBackgrounds";
import { getDemoTokenEntries } from "@/lib/assets/gvcMetadata";
import {
  loadProjectileSkinFromStorage,
  projectileTextureUrlForSkin,
  projectileUsesCircularMask,
  saveProjectileSkinToStorage,
  type ProjectileSkinId,
} from "@/lib/assets/projectileSkins";
import { showAchievementToasts } from "./AchievementToast";
import { GameBackground } from "./GameBackground";
import { GameHud } from "./GameHud";
import { GamePlayActionBar } from "./GamePlayActionBar";
import { GameMenu } from "./GameMenu";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { ResultScreen } from "./ResultScreen";
import { GameModal } from "./GameModal";
import { CrashersBadgesPanel } from "./GoalsPanel";
import { GameplayFloatingFeedback, type HudFloatItem } from "./GameplayFloatingFeedback";
import { AuthModal } from "./AuthModal";
import { FirstRunCoachOverlay } from "@/components/arcade/FirstRunCoachOverlay";
import { hasCompletedOnboarding } from "@/lib/arcade/onboarding";
import { bumpNightStreakLoggedIn } from "@/lib/arcade/nightStreakClient";
import { useArcadeAudioZone } from "@/hooks/useArcadeAudioZone";

export type GamePhase =
  | "menu"
  | "aiming"
  | "launched"
  | "resolving"
  | "levelComplete"
  | "gameOver"
  | "paused";

const MAX_PULL = 155;
const MIN_PULL = 14;
const PROJECTILE_RADIUS = 16;
const AIM_WORLD_INSET = 8;
/** Ignore settle checks right after launch (impulses / spin). */
const LAUNCH_GRACE_MS = 480;
/** Do not end the shot on “settled” until the projectile has had time to travel. */
const MIN_FLIGHT_BEFORE_SETTLE_MS = 950;
/** Shot auto-resolve if still running (ms from launch). */
const SHOT_RESOLVE_DEADLINE_MS = 24000;
/** Impulse scale: tuned with projectile density + frictionAir in createWorld. */
const LAUNCH_SCALE = 0.112;

function closingAlongNormal(
  MatterLib: typeof Matter,
  bodyA: Matter.Body,
  bodyB: Matter.Body,
  collision: Matter.Collision | undefined
): number {
  const n = collision?.normal;
  if (!n) return 0;
  const rv = MatterLib.Vector.sub(bodyB.velocity, bodyA.velocity);
  return Math.abs(MatterLib.Vector.dot(rv, n));
}

function blockBreakThreshold(body: Matter.Body): number | null {
  const p = body.plugin as VibeBodyPlugin | undefined;
  if (!p?.breakable) return null;
  return p.breakThreshold ?? 2.6;
}

function worldFromClient(clientX: number, clientY: number, rect: DOMRect) {
  const x = ((clientX - rect.left) / rect.width) * WORLD.width;
  const y = ((clientY - rect.top) / rect.height) * WORLD.height;
  return { x, y };
}

function clampClientToCanvas(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: Math.min(rect.right, Math.max(rect.left, clientX)),
    y: Math.min(rect.bottom, Math.max(rect.top, clientY)),
  };
}

/** Keep the aim position inside the board so pulls can’t park the ball off-screen. */
function clampProjectilePosition(x: number, y: number) {
  const r = PROJECTILE_RADIUS;
  const p = AIM_WORLD_INSET;
  const minX = r + p;
  const maxX = WORLD.width - r - p;
  const minY = r + p;
  const maxY = WORLD.height - r - p;
  return { x: Math.min(maxX, Math.max(minX, x)), y: Math.min(maxY, Math.max(minY, y)) };
}

function bodySpeed(b: Matter.Body): number {
  return Matter.Vector.magnitude(b.velocity);
}

export interface VibeSlingGameProps {
  onExitToLibrary?: () => void;
}

export default function VibeSlingGame({ onExitToLibrary }: VibeSlingGameProps = {}) {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [challenge, setChallenge] = useState<ActiveChallenge>({ kind: "handcrafted", levelId: "1", seed: "level-1" });
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(4);
  const [muted, setMuted] = useState(false);

  const inGameplay = phase !== "menu" && phase !== "gameOver";
  useArcadeAudioZone(inGameplay ? "game" : "hub");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [persisted, setPersisted] = useState<PersistedState | null>(null);
  const [result, setResult] = useState<{
    won: boolean;
    score: number;
    stars: 1 | 2 | 3;
    shotsUsed: number;
    newAchievementSlugs?: string[];
    serverRank?: number | null;
    submitId?: string;
  } | null>(null);
  const [hudFloats, setHudFloats] = useState<HudFloatItem[]>([]);
  const [aimLine, setAimLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [aimPullNorm, setAimPullNorm] = useState(0);
  const [projectileSkin, setProjectileSkin] = useState<ProjectileSkinId>("shaka");
  const [tokenOptions, setTokenOptions] = useState<{ id: string; name: string; imageUrl: string }[]>([]);
  const [slingUiNorm, setSlingUiNorm] = useState({ x: 0.17, y: 0.72 });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const practiceRef = useRef(false);

  const { user } = useAuth();
  const userRef = useRef(user);
  const scoreSubmitSigRef = useRef<string>("");
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const worldRef = useRef<ReturnType<typeof createPhysicsWorld> | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const tokenImageMapRef = useRef<Record<string, string>>({});
  const boardFxRef = useRef<BoardFxSnapshot>({
    projectileTextureUrl: "/shaka.png",
    projectileCircularMask: false,
    badVibeTextureUrl: BAD_VIBE_FACE_URL,
    proceduralOrb: null,
    aimPullNorm: 0,
    dragging: false,
    reducedMotion: false,
    particles: [],
    shake: 0,
    flashes: [],
    trail: [],
    starBurst: 0,
    debugDraw: false,
    gameplayArena: false,
  });
  const detachBoardPaintRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<GamePhase>("menu");
  const shotsRef = useRef(4);
  const scoreRef = useRef(0);
  const challengeRef = useRef<ActiveChallenge>({ kind: "handcrafted", levelId: "1", seed: "level-1" });
  const maxShotsRef = useRef(4);
  const targetsInitialRef = useRef(0);
  const clearedThisLaunchRef = useRef(0);
  const blocksThisLaunchRef = useRef(0);
  const maxComboTargetsRef = useRef(0);
  const maxBlocksLaunchRef = useRef(0);
  const sessionLaunchedRef = useRef(false);
  const resolveDeadlineRef = useRef(0);
  const launchGraceUntilRef = useRef(0);
  const minFlightBeforeSettleUntilRef = useRef(0);
  const worldTickRef = useRef<(() => void) | null>(null);
  const collisionHandlerRef = useRef<((e: Matter.IEventCollision<Matter.Engine>) => void) | null>(null);
  const collisionActiveRef = useRef<((e: Matter.IEventCollision<Matter.Engine>) => void) | null>(null);
  const shotBusyRef = useRef(false);
  const vibeCoreBrokenRef = useRef(false);
  const glassBrokenThisShotRef = useRef(0);
  const projectileSkinRef = useRef<ProjectileSkinId>("shaka");
  const phaseBeforePauseRef = useRef<GamePhase>("aiming");
  const dragRef = useRef<{
    active: boolean;
    id: number | null;
    startRest: { x: number; y: number };
    /** Latest pointer in world space (canvas-clamped only) — launch power uses full stretch here even when the ball is clamped on-screen. */
    lastPointerWorld: { x: number; y: number };
  }>({ active: false, id: null, startRest: { x: 0, y: 0 }, lastPointerWorld: { x: 0, y: 0 } });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    projectileSkinRef.current = projectileSkin;
  }, [projectileSkin]);

  const pushHudFloat = useCallback((text: string, wx: number, wy: number, kind: HudFloatItem["kind"] = "pop") => {
    if (prefersReducedMotion && kind === "pop") return;
    const id = `${performance.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setHudFloats((prev) => [...prev.slice(-8), { id, text, wx, wy, kind }]);
    window.setTimeout(() => {
      setHudFloats((prev) => prev.filter((x) => x.id !== id));
    }, kind === "hero" ? 2200 : 1500);
  }, [prefersReducedMotion]);

  useEffect(() => {
    boardFxRef.current.gameplayArena = phase !== "menu";
  }, [phase]);

  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);

  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const p = loadPersisted();
    setPersisted(p);
    setMuted(p.soundMuted);
    const params = new URLSearchParams(window.location.search);
    const s = params.get("seed");
    if (s) setChallenge((c) => ({ ...c, seed: s }));
    setProjectileSkin(loadProjectileSkinFromStorage());
    preloadProjectileUrl(BAD_VIBE_FACE_URL);
    const dbg = params.get("debug") === "1";
    setDebugMode(dbg);
    boardFxRef.current.debugDraw = dbg;
    void getDemoTokenEntries().then((rows) => {
      setTokenOptions(rows);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const v = mq.matches;
      boardFxRef.current.reducedMotion = v;
      setPrefersReducedMotion(v);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const m: Record<string, string> = {};
    for (const r of tokenOptions) m[r.id] = r.imageUrl;
    tokenImageMapRef.current = m;
    const fx = boardFxRef.current;
    fx.projectileCircularMask = projectileUsesCircularMask(projectileSkin);
    if (projectileSkin.startsWith("token:")) {
      fx.proceduralOrb = null;
      fx.projectileTextureUrl = projectileTextureUrlForSkin(projectileSkin, m);
      preloadProjectileUrl(fx.projectileTextureUrl);
    }
  }, [tokenOptions, projectileSkin]);

  useEffect(() => {
    saveProjectileSkinToStorage(projectileSkin);
    const fx = boardFxRef.current;
    fx.projectileCircularMask = projectileUsesCircularMask(projectileSkin);
    if (projectileSkin === "gold") {
      fx.proceduralOrb = "gold";
      fx.projectileTextureUrl = null;
    } else if (projectileSkin === "badge") {
      fx.proceduralOrb = "badge";
      fx.projectileTextureUrl = null;
    } else {
      fx.proceduralOrb = null;
      fx.projectileTextureUrl = projectileTextureUrlForSkin(projectileSkin, tokenImageMapRef.current);
    }
    preloadProjectileUrl(fx.projectileTextureUrl);
  }, [projectileSkin]);

  const persistMute = useCallback((m: boolean) => {
    setMuted(m);
    const p = loadPersisted();
    p.soundMuted = m;
    savePersisted(p);
    setPersisted(p);
  }, []);

  const teardownWorld = useCallback(() => {
    shotBusyRef.current = false;
    if (collisionHandlerRef.current && worldRef.current) {
      Matter.Events.off(worldRef.current.engine, "collisionStart", collisionHandlerRef.current);
      collisionHandlerRef.current = null;
    }
    if (collisionActiveRef.current && worldRef.current) {
      Matter.Events.off(worldRef.current.engine, "collisionActive", collisionActiveRef.current);
      collisionActiveRef.current = null;
    }
    if (worldTickRef.current && worldRef.current) {
      Matter.Events.off(worldRef.current.engine, "afterUpdate", worldTickRef.current);
      worldTickRef.current = null;
    }
    if (detachBoardPaintRef.current) {
      detachBoardPaintRef.current();
      detachBoardPaintRef.current = null;
    }
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      renderRef.current.canvas.remove();
      renderRef.current = null;
    }
    if (worldRef.current) {
      worldRef.current.dispose();
      worldRef.current = null;
    }
  }, []);

  const finishShot = useCallback(() => {
    if (phaseRef.current !== "launched" || shotBusyRef.current) return;
    const w = worldRef.current;
    if (!w) return;
    shotBusyRef.current = true;

    const gb = glassBrokenThisShotRef.current;
    glassBrokenThisShotRef.current = 0;
    if (gb > 0) addLifetimeGlassBreaks(gb);

    const clearedTargets = clearedThisLaunchRef.current;
    const clearedBlocks = blocksThisLaunchRef.current;
    maxComboTargetsRef.current = Math.max(maxComboTargetsRef.current, clearedTargets);
    maxBlocksLaunchRef.current = Math.max(maxBlocksLaunchRef.current, clearedBlocks);

    const combo = clearedTargets >= 2 ? comboBonusForTargets(clearedTargets) : 0;
    scoreRef.current += combo;
    setScore(scoreRef.current);
    if (combo > 0) {
      playComboHit(muted);
      pushHudFloat(`COMBO ×${clearedTargets} · +${combo}`, WORLD.width / 2, 96, "hero");
      if (clearedTargets >= 3 && !boardFxRef.current.reducedMotion) {
        boardFxRef.current.shake = Math.min(20, boardFxRef.current.shake + 14);
        boardFxRef.current.starBurst = 18;
      }
    }

    clearedThisLaunchRef.current = 0;
    blocksThisLaunchRef.current = 0;

    const targetsLeft = w.targets.length;
    const shotsLeft = shotsRef.current;
    const ch = challengeRef.current;
    const maxShots = maxShotsRef.current;
    const shotsUsed = maxShots - shotsLeft;
    const persistKey = ch.kind === "daily" ? dailyPersistKey(ch.seed, ch.levelId) : `lv:${ch.levelId}`;

    if (targetsLeft === 0) {
      if (practiceRef.current) {
        pushHudFloat("PRACTICE CLEAR", WORLD.width / 2, 110, "hero");
        shotsRef.current = maxShotsRef.current;
        setShots(maxShotsRef.current);
        w.resetProjectile();
        setPhase("aiming");
        setAimLine(null);
        setAimPullNorm(0);
        shotBusyRef.current = false;
        clearedThisLaunchRef.current = 0;
        blocksThisLaunchRef.current = 0;
        return;
      }
      const shotBonus = shotsLeft * BONUS_PER_REMAINING_SHOT;
      let finalTotal = scoreRef.current + shotBonus;
      if (shotsUsed <= w.level.parShots) {
        finalTotal += SCORE_UNDER_PAR;
      }
      scoreRef.current = finalTotal;
      setScore(finalTotal);

      const winBits: string[] = [];
      if (shotsUsed === 1 && targetsInitialRef.current >= 1) winBits.push("ONE-SHOT CLEAR");
      if (shotsUsed <= w.level.parShots) winBits.push("UNDER PAR");
      if (winBits.length) pushHudFloat(winBits.join(" · "), WORLD.width / 2, 110, "hero");

      const snap = finalizeScore(
        {
          targetPoints: 0,
          blockPoints: 0,
          comboBonus: 0,
          shotBonus,
          total: finalTotal,
        },
        targetsInitialRef.current,
        w.level.starThresholds
      );

      playLevelComplete(muted);
      Matter.Runner.stop(w.runner);
      boardFxRef.current.starBurst = boardFxRef.current.reducedMotion ? 0 : 56;

      const p = loadPersisted();
      p.bestByLevel[persistKey] = Math.max(p.bestByLevel[persistKey] ?? 0, snap.total);
      p.bestStarsByLevel[persistKey] = Math.max(p.bestStarsByLevel[persistKey] ?? 0, snap.stars);
      p.recentScore = {
        score: snap.total,
        kind: ch.kind,
        levelId: ch.levelId,
        seed: ch.seed,
        at: new Date().toISOString(),
        stars: snap.stars,
      };
      if (ch.kind === "handcrafted") {
        p.levelsBeaten[ch.levelId] = true;
      }
      if (ch.kind === "daily") {
        p.dailyCompletedDate = todaySeed();
        bumpDailyStreak(p, ch.seed);
        p.dailyBestScore = Math.max(p.dailyBestScore, snap.total);
      }
      mergeLifetimeWinStats(p, {
        maxTargetsOneLaunch: maxComboTargetsRef.current,
        maxBlocksOneLaunch: maxBlocksLaunchRef.current,
        skin: projectileSkinRef.current,
        underPar: shotsUsed <= w.level.parShots,
        oneShotWin: shotsUsed <= 1,
      });
      const levelsBeatenCount = Object.keys(p.levelsBeaten).filter((id) => p.levelsBeaten[id]).length;
      const newly = evaluateAchievements({
        owned: new Set(p.achievements),
        didLaunch: sessionLaunchedRef.current,
        didWinRun: true,
        shotsUsedThisWin: shotsUsed,
        bestStarsThisSession: snap.stars,
        completedDailyThisRun: ch.kind === "daily",
        maxTargetsOneLaunch: maxComboTargetsRef.current,
        maxBlocksOneLaunch: maxBlocksLaunchRef.current,
        levelsBeatenCount,
        dailyStreakAfterBump: p.dailyStreak,
        brokeVibeCoreThisWin: vibeCoreBrokenRef.current,
      });
      for (const a of newly) {
        if (!p.achievements.includes(a.slug)) p.achievements.push(a.slug);
      }
      const newAchievementSlugs = newly.map((a) => a.slug);
      savePersisted(p);
      setPersisted(p);
      setResult({
        won: true,
        score: snap.total,
        stars: snap.stars,
        shotsUsed,
        newAchievementSlugs,
        serverRank: null,
        submitId: typeof crypto !== "undefined" ? crypto.randomUUID() : `s-${Date.now()}`,
      });
      showAchievementToasts(newly, "vibe-crashers");
      if (!userRef.current) {
        pushLocalLeaderRow({
          username: "YOU",
          score: snap.total,
          scope: ch.kind === "daily" ? "daily" : "alltime",
          mode: ch.kind === "daily" ? "daily" : "level",
          levelId: ch.levelId,
          seed: ch.seed,
          stars: snap.stars,
        });
      }

      setPhase("levelComplete");
      shotBusyRef.current = false;
      return;
    }

    if (shotsLeft <= 0) {
      if (practiceRef.current) {
        shotsRef.current = maxShotsRef.current;
        setShots(maxShotsRef.current);
        w.resetProjectile();
        setPhase("aiming");
        setAimLine(null);
        setAimPullNorm(0);
        shotBusyRef.current = false;
        return;
      }
      setResult({
        won: false,
        score: scoreRef.current,
        stars: 1,
        shotsUsed,
      });
      playGameOver(muted);
      Matter.Runner.stop(w.runner);
      setPhase("gameOver");
      shotBusyRef.current = false;
      return;
    }

    w.resetProjectile();
    setPhase("aiming");
    setAimLine(null);
    setAimPullNorm(0);
    shotBusyRef.current = false;
  }, [muted, pushHudFloat]);

  const startRun = useCallback(
    (next: ActiveChallenge) => {
      playUiClick(muted);
      void resumeAudio();
      if (next.kind === "daily") void bumpNightStreakLoggedIn(!!userRef.current);
      practiceRef.current = false;
      teardownWorld();
      setResult(null);
      scoreSubmitSigRef.current = "";
      setChallenge(next);
      challengeRef.current = next;
      setScore(0);
      scoreRef.current = 0;
      clearedThisLaunchRef.current = 0;
      blocksThisLaunchRef.current = 0;
      maxComboTargetsRef.current = 0;
      maxBlocksLaunchRef.current = 0;
      sessionLaunchedRef.current = false;
      vibeCoreBrokenRef.current = false;
      glassBrokenThisShotRef.current = 0;
      setHudFloats([]);

      const level = resolveChallenge(next);
      maxShotsRef.current = level.availableShots;
      shotsRef.current = level.availableShots;
      setShots(level.availableShots);
      targetsInitialRef.current = level.targets.length;

      const worldApi = createPhysicsWorld(level);
      worldRef.current = worldApi;

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const debug = params?.get("debug") === "1";
      setDebugMode(debug);
      boardFxRef.current.debugDraw = debug;
      validateLevelPhysics(Matter, worldApi.engine, worldApi.targets, { debug, label: level.id });

      const clearTargetBody = (targetBody: Matter.Body) => {
        if (!worldApi.targets.includes(targetBody)) return;
        const fx = boardFxRef.current;
        fx.flashes.push({ x: targetBody.position.x, y: targetBody.position.y, life: 1 });
        spawnParticles(fx.particles, targetBody.position.x, targetBody.position.y, 24, "#FFE048", fx.reducedMotion, 6);
        spawnParticles(fx.particles, targetBody.position.x, targetBody.position.y, 14, "#FF6B9D", fx.reducedMotion, 4);
        fx.shake = Math.min(16, fx.shake + 9);
        pushHudFloat(`+${SCORE_TARGET} BAD VIBE CLEARED`, targetBody.position.x, targetBody.position.y, "pop");
        Matter.Composite.remove(worldApi.engine.world, targetBody);
        const ix = worldApi.targets.indexOf(targetBody);
        if (ix >= 0) worldApi.targets.splice(ix, 1);
        clearedThisLaunchRef.current += 1;
        scoreRef.current += SCORE_TARGET;
        setScore(scoreRef.current);
        playTargetClear(muted);
      };

      /** Blunt impacts (blocks, landings) — accumulates until pop; huge hits clear immediately. */
      const applyTargetBluntImpact = (
        targetBody: Matter.Body,
        impulse: number,
        opts: { instantAt: number; scale: number; minImpulse: number }
      ) => {
        if (!worldApi.targets.includes(targetBody)) return;
        const meta = getTargetPhysics(targetBody);
        if (!meta) return;
        if (impulse >= opts.instantAt) {
          clearTargetBody(targetBody);
          return;
        }
        if (impulse < opts.minImpulse) return;
        const total = addTargetImpactDamage(targetBody, impulse * opts.scale);
        if (total >= TARGET_IMPACT_DAMAGE_POP) clearTargetBody(targetBody);
      };

      const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
        const proj = worldApi.projectile;
        for (const pair of event.pairs) {
          const { bodyA, bodyB, collision } = pair;
          const k1 = getVibeKind(bodyA);
          const k2 = getVibeKind(bodyB);

          if ((k1 === "projectile" && k2 === "target") || (k2 === "projectile" && k1 === "target")) {
            const targetBody = k1 === "target" ? bodyA : bodyB;
            const meta = getTargetPhysics(targetBody);
            if (!meta || !worldApi.targets.includes(targetBody)) continue;
            const impact = closingAlongNormal(Matter, bodyA, bodyB, collision);
            if (impact < meta.clearImpactSpeed) continue;
            clearTargetBody(targetBody);
            continue;
          }

          if ((k1 === "projectile" && k2 === "block") || (k2 === "projectile" && k1 === "block")) {
            const blockBody = k1 === "block" ? bodyA : bodyB;
            if (!worldApi.blocks.includes(blockBody)) continue;
            const th = blockBreakThreshold(blockBody);
            const speed = bodySpeed(proj);
            if (th == null) {
              playImpact(muted, Math.min(0.35, speed / 16));
              continue;
            }
            if (speed < th) {
              playImpact(muted, Math.min(0.45, speed / 14));
              continue;
            }
            const fx = boardFxRef.current;
            const mat = getBlockMaterial(blockBody);
            const fragileLike = mat === "fragile" || mat === "glass" || mat === "vibe_core";
            spawnParticles(
              fx.particles,
              blockBody.position.x,
              blockBody.position.y,
              fragileLike ? 18 : 9,
              "#FFE048",
              fx.reducedMotion,
              2 + speed * 0.25
            );
            if (fragileLike) {
              fx.flashes.push({ x: blockBody.position.x, y: blockBody.position.y, life: 0.85 });
            }
            if (mat === "vibe_core") vibeCoreBrokenRef.current = true;
            if (fragileLike) glassBrokenThisShotRef.current += 1;
            fx.shake = Math.min(18, fx.shake + 3 + speed * 0.32);
            Matter.Composite.remove(worldApi.engine.world, blockBody);
            const bi = worldApi.blocks.indexOf(blockBody);
            if (bi >= 0) worldApi.blocks.splice(bi, 1);
            // Support disappeared — sleeping bodies do not always wake when a collider is removed,
            // so bad-vibe targets (and the rest of the stack) can hang in mid-air until nudged.
            for (const t of worldApi.targets) Matter.Sleeping.set(t, false);
            for (const b of worldApi.blocks) {
              if (!b.isStatic) Matter.Sleeping.set(b, false);
            }
            blocksThisLaunchRef.current += 1;
            const pts = fragileLike ? SCORE_FRAGILE_BREAK : SCORE_BLOCK;
            scoreRef.current += pts;
            setScore(scoreRef.current);
            pushHudFloat(
              fragileLike ? `+${pts} GLASS BREAK` : `+${pts} BLOCK`,
              blockBody.position.x,
              blockBody.position.y,
              "pop"
            );
            playImpact(muted, Math.min(1, speed / 12));
            continue;
          }

          if ((k1 === "block" && k2 === "target") || (k2 === "block" && k1 === "target")) {
            const targetBody = k1 === "target" ? bodyA : bodyB;
            const meta = getTargetPhysics(targetBody);
            if (!meta || !worldApi.targets.includes(targetBody)) continue;
            const crush = closingAlongNormal(Matter, bodyA, bodyB, collision);
            if (crush >= meta.clearCrushSpeed) {
              clearTargetBody(targetBody);
              continue;
            }
            applyTargetBluntImpact(targetBody, crush, {
              instantAt: meta.clearCrushSpeed * 0.92,
              scale: 0.82,
              minImpulse: 0.08,
            });
            continue;
          }

          if (
            (k1 === "target" && (k2 === "ground" || k2 === "platform")) ||
            (k2 === "target" && (k1 === "ground" || k1 === "platform"))
          ) {
            const targetBody = k1 === "target" ? bodyA : bodyB;
            const meta = getTargetPhysics(targetBody);
            if (!meta || !worldApi.targets.includes(targetBody)) continue;
            const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
            applyTargetBluntImpact(targetBody, imp, {
              instantAt: meta.clearCrushSpeed * 1.05,
              scale: 0.48,
              minImpulse: 0.42,
            });
            continue;
          }

          if ((k1 === "target" && k2 === "wall") || (k2 === "target" && k1 === "wall")) {
            const targetBody = k1 === "target" ? bodyA : bodyB;
            const meta = getTargetPhysics(targetBody);
            if (!meta || !worldApi.targets.includes(targetBody)) continue;
            const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
            applyTargetBluntImpact(targetBody, imp, {
              instantAt: meta.clearCrushSpeed * 1.35,
              scale: 0.22,
              minImpulse: 1.15,
            });
            continue;
          }

          if (k1 === "target" && k2 === "target") {
            const imp = closingAlongNormal(Matter, bodyA, bodyB, collision);
            if (imp < 0.48) continue;
            const metaA = getTargetPhysics(bodyA);
            const metaB = getTargetPhysics(bodyB);
            const ref = Math.min(metaA?.clearCrushSpeed ?? 3, metaB?.clearCrushSpeed ?? 3);
            const opts = { instantAt: ref * 1.45, scale: 0.34, minImpulse: 0.52 };
            if (worldApi.targets.includes(bodyA)) applyTargetBluntImpact(bodyA, imp, opts);
            if (worldApi.targets.includes(bodyB)) applyTargetBluntImpact(bodyB, imp, opts);
            continue;
          }
        }
      };

      const onCollisionActive = (event: Matter.IEventCollision<Matter.Engine>) => {
        for (const pair of event.pairs) {
          const { bodyA, bodyB, collision } = pair;
          const k1 = getVibeKind(bodyA);
          const k2 = getVibeKind(bodyB);
          if ((k1 === "block" && k2 === "target") || (k2 === "block" && k1 === "target")) {
            const targetBody = k1 === "target" ? bodyA : bodyB;
            const meta = getTargetPhysics(targetBody);
            if (!meta || !worldApi.targets.includes(targetBody)) continue;
            const crush = closingAlongNormal(Matter, bodyA, bodyB, collision);
            if (crush < meta.clearCrushSpeed * 1.08) continue;
            clearTargetBody(targetBody);
          }
        }
      };

      const worldTick = () => {
        const w0 = worldRef.current;
        if (!w0) return;
        const gy = worldGroundY();
        for (const t of [...w0.targets]) {
          const meta = getTargetPhysics(t);
          if (!meta) continue;
          if (t.position.y > meta.clearIfFallsBelowY) {
            clearTargetBody(t);
          } else if (
            Math.abs(t.angularVelocity) >= (meta.clearJoltAngular ?? 22) &&
            bodySpeed(t) > 5.5 &&
            t.position.y < gy - 70
          ) {
            clearTargetBody(t);
          }
        }

        if (w0.targets.length === 0 && phaseRef.current === "aiming") {
          const gbShot = glassBrokenThisShotRef.current;
          glassBrokenThisShotRef.current = 0;
          if (gbShot > 0) addLifetimeGlassBreaks(gbShot);

          const shotsLeft = shotsRef.current;
          const shotBonus = shotsLeft * BONUS_PER_REMAINING_SHOT;
          const ch = challengeRef.current;
          const maxSh = maxShotsRef.current;
          const shotsUsed = maxSh - shotsLeft;
          let finalTotal = scoreRef.current + shotBonus;
          if (shotsUsed <= w0.level.parShots) finalTotal += SCORE_UNDER_PAR;
          scoreRef.current = finalTotal;
          setScore(finalTotal);

          const winBits: string[] = [];
          if (shotsUsed === 1 && targetsInitialRef.current >= 1) winBits.push("ONE-SHOT CLEAR");
          if (shotsUsed <= w0.level.parShots) winBits.push("UNDER PAR");
          if (winBits.length) pushHudFloat(winBits.join(" · "), WORLD.width / 2, 110, "hero");

          const snap = finalizeScore(
            {
              targetPoints: 0,
              blockPoints: 0,
              comboBonus: 0,
              shotBonus,
              total: finalTotal,
            },
            targetsInitialRef.current,
            w0.level.starThresholds
          );
          playLevelComplete(muted);
          Matter.Runner.stop(w0.runner);
          boardFxRef.current.starBurst = boardFxRef.current.reducedMotion ? 0 : 56;
          const p = loadPersisted();
          const persistKey = ch.kind === "daily" ? dailyPersistKey(ch.seed, ch.levelId) : `lv:${ch.levelId}`;
          p.bestByLevel[persistKey] = Math.max(p.bestByLevel[persistKey] ?? 0, snap.total);
          p.bestStarsByLevel[persistKey] = Math.max(p.bestStarsByLevel[persistKey] ?? 0, snap.stars);
          p.recentScore = {
            score: snap.total,
            kind: ch.kind,
            levelId: ch.levelId,
            seed: ch.seed,
            at: new Date().toISOString(),
            stars: snap.stars,
          };
          if (ch.kind === "handcrafted") {
            p.levelsBeaten[ch.levelId] = true;
          }
          if (ch.kind === "daily") {
            p.dailyCompletedDate = todaySeed();
            bumpDailyStreak(p, ch.seed);
            p.dailyBestScore = Math.max(p.dailyBestScore, snap.total);
          }
          mergeLifetimeWinStats(p, {
            maxTargetsOneLaunch: maxComboTargetsRef.current,
            maxBlocksOneLaunch: maxBlocksLaunchRef.current,
            skin: projectileSkinRef.current,
            underPar: shotsUsed <= w0.level.parShots,
            oneShotWin: shotsUsed <= 1,
          });
          const levelsBeatenCount = Object.keys(p.levelsBeaten).filter((id) => p.levelsBeaten[id]).length;
          const newly = evaluateAchievements({
            owned: new Set(p.achievements),
            didLaunch: sessionLaunchedRef.current,
            didWinRun: true,
            shotsUsedThisWin: shotsUsed,
            bestStarsThisSession: snap.stars,
            completedDailyThisRun: ch.kind === "daily",
            maxTargetsOneLaunch: maxComboTargetsRef.current,
            maxBlocksOneLaunch: maxBlocksLaunchRef.current,
            levelsBeatenCount,
            dailyStreakAfterBump: p.dailyStreak,
            brokeVibeCoreThisWin: vibeCoreBrokenRef.current,
          });
          for (const a of newly) {
            if (!p.achievements.includes(a.slug)) p.achievements.push(a.slug);
          }
          const newAchievementSlugs = newly.map((a) => a.slug);
          savePersisted(p);
          setPersisted(p);
          setResult({
            won: true,
            score: snap.total,
            stars: snap.stars,
            shotsUsed,
            newAchievementSlugs,
            serverRank: null,
            submitId: typeof crypto !== "undefined" ? crypto.randomUUID() : `s-${Date.now()}`,
          });
          showAchievementToasts(newly, "vibe-crashers");
          if (!userRef.current) {
            pushLocalLeaderRow({
              username: "YOU",
              score: snap.total,
              scope: ch.kind === "daily" ? "daily" : "alltime",
              mode: ch.kind === "daily" ? "daily" : "level",
              levelId: ch.levelId,
              seed: ch.seed,
              stars: snap.stars,
            });
          }
          setPhase("levelComplete");
          return;
        }

        if (phaseRef.current !== "launched") return;
        const p = w0.projectile;
        if (!p.isStatic) {
          Matter.Body.setAngularVelocity(p, Matter.Common.clamp(p.velocity.x * 0.0032, -0.55, 0.55));
        }
        const now = performance.now();
        if (now < launchGraceUntilRef.current) return;
        if (now < minFlightBeforeSettleUntilRef.current) return;

        // Bad-vibe targets can wobble slowly; don’t let them gate “world settled”.
        // Only the projectile + dynamic blocks must go quiet before we end the shot.
        const sp = bodySpeed(p);
        const projectileSettled = sp < 0.06;
        let blocksSettled = true;
        for (const b of w0.blocks) {
          if (b.isStatic) continue;
          if (bodySpeed(b) > 0.09) {
            blocksSettled = false;
            break;
          }
        }
        const settled = projectileSettled && blocksSettled;
        const oob = p.position.y > gy + 220;
        const timedOut = now > resolveDeadlineRef.current;
        if (settled || oob || timedOut) {
          finishShot();
        }
      };

      const host = document.getElementById("vibe-sling-render-host");
      if (!host) {
        worldApi.dispose();
        worldRef.current = null;
        return;
      }
      host.innerHTML = "";
      // Do not pass `engine` into Render.create — Matter deep-merges options via Common.extend,
      // which walks the engine.world graph and blows the stack on composite parent cycles.
      const render = Matter.Render.create({
        element: host,
        options: {
          width: WORLD.width,
          height: WORLD.height,
          wireframes: false,
          background: "transparent",
          pixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2),
        },
      } as Parameters<typeof Matter.Render.create>[0]) as Matter.Render & { engine: Matter.Engine };
      render.engine = worldApi.engine;
      renderRef.current = render;
      /** Matter defaults to fixed 800×520px CSS — scale to the responsive host so the full world fits. */
      render.canvas.style.width = "100%";
      render.canvas.style.height = "100%";
      render.canvas.style.display = "block";
      Matter.Render.run(render);

      setSlingUiNorm({
        x: worldApi.slingRest.x / WORLD.width,
        y: worldApi.slingRest.y / WORLD.height,
      });
      boardFxRef.current.trail.length = 0;
      boardFxRef.current.flashes.length = 0;
      boardFxRef.current.particles.length = 0;
      boardFxRef.current.starBurst = 0;
      boardFxRef.current.shake = 0;
      preloadProjectileUrl(boardFxRef.current.projectileTextureUrl);
      preloadProjectileUrl(boardFxRef.current.badVibeTextureUrl);
      detachBoardPaintRef.current?.();
      detachBoardPaintRef.current = attachMatterBoardPaint(
        Matter,
        render,
        worldApi.engine,
        () => boardFxRef.current,
        worldApi.slingRest
      );

      collisionHandlerRef.current = onCollision;
      Matter.Events.on(worldApi.engine, "collisionStart", onCollision);
      collisionActiveRef.current = onCollisionActive;
      Matter.Events.on(worldApi.engine, "collisionActive", onCollisionActive);
      worldTickRef.current = worldTick;
      Matter.Events.on(worldApi.engine, "afterUpdate", worldTick);

      worldApi.resetProjectile();
      setPhase("aiming");
      setCoachOpen(!hasCompletedOnboarding("vibe-crashers"));
      setAimLine(null);
      setAimPullNorm(0);
    },
    [muted, teardownWorld, finishShot, pushHudFloat]
  );

  const startPractice = useCallback(
    (levelId: string) => {
      practiceRef.current = true;
      startRun({ kind: "handcrafted", levelId, seed: `practice-${levelId}` });
    },
    [startRun]
  );

  useEffect(() => () => teardownWorld(), [teardownWorld]);

  const bindPointer = useCallback(() => {
    const canvas = renderRef.current?.canvas;
    if (!canvas || !worldRef.current) return;

    canvas.style.touchAction = "none";
    const getRest = () => worldRef.current!.slingRest;

    const onDown = (ev: PointerEvent) => {
      if (phaseRef.current === "paused") return;
      if (phaseRef.current !== "aiming") return;
      const rect = canvas.getBoundingClientRect();
      const c = clampClientToCanvas(ev.clientX, ev.clientY, rect);
      const { x, y } = worldFromClient(c.x, c.y, rect);
      const proj = worldRef.current!.projectile;
      const dx = x - proj.position.x;
      const dy = y - proj.position.y;
      if (dx * dx + dy * dy > 45 * 45) return;
      dragRef.current = {
        active: true,
        id: ev.pointerId,
        startRest: { ...getRest() },
        lastPointerWorld: { x, y },
      };
      canvas.setPointerCapture(ev.pointerId);
      playAimStart(muted);
      boardFxRef.current.dragging = true;
    };

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current.active || dragRef.current.id !== ev.pointerId) return;
      if (!worldRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const c = clampClientToCanvas(ev.clientX, ev.clientY, rect);
      const { x, y } = worldFromClient(c.x, c.y, rect);
      dragRef.current.lastPointerWorld = { x, y };
      const rest = dragRef.current.startRest;
      const vx = x - rest.x;
      const vy = y - rest.y;
      const len = Math.hypot(vx, vy) || 1;
      const clamped = Math.min(len, MAX_PULL);
      const rawX = rest.x + (vx / len) * clamped;
      const rawY = rest.y + (vy / len) * clamped;
      const { x: nx, y: ny } = clampProjectilePosition(rawX, rawY);
      Matter.Body.setPosition(worldRef.current.projectile, { x: nx, y: ny });
      setAimLine({ x1: rest.x, y1: rest.y, x2: nx, y2: ny });
      const pullN = Math.min(1, Math.min(len, MAX_PULL) / MAX_PULL);
      boardFxRef.current.aimPullNorm = pullN;
      setAimPullNorm(pullN);
    };

    const onUp = (ev: PointerEvent) => {
      if (!dragRef.current.active || dragRef.current.id !== ev.pointerId) return;
      const savedRest = { ...dragRef.current.startRest };
      dragRef.current.active = false;
      dragRef.current.id = null;
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      if (!worldRef.current) return;
      if (phaseRef.current !== "aiming") return;
      const rest = savedRest;
      const proj = worldRef.current.projectile;
      const rect = canvas.getBoundingClientRect();
      const c = clampClientToCanvas(ev.clientX, ev.clientY, rect);
      const pw = worldFromClient(c.x, c.y, rect);
      dragRef.current.lastPointerWorld = { x: pw.x, y: pw.y };
      const sx = pw.x - rest.x;
      const sy = pw.y - rest.y;
      const ptrLen = Math.hypot(sx, sy);
      const stretchMag = ptrLen < 1e-4 ? 0 : Math.min(MAX_PULL, ptrLen);
      const pull =
        ptrLen < 1e-4
          ? { x: rest.x - proj.position.x, y: rest.y - proj.position.y }
          : { x: -(sx / ptrLen) * stretchMag, y: -(sy / ptrLen) * stretchMag };
      const mag = Math.hypot(pull.x, pull.y);
      if (mag < MIN_PULL) {
        worldRef.current.resetProjectile();
        setAimLine(null);
        setAimPullNorm(0);
        boardFxRef.current.dragging = false;
        boardFxRef.current.aimPullNorm = 0;
        return;
      }
      sessionLaunchedRef.current = true;
      if (!practiceRef.current) {
        setShots((s) => {
          const next = s - 1;
          shotsRef.current = next;
          return next;
        });
      }
      const vel = { x: pull.x * LAUNCH_SCALE, y: pull.y * LAUNCH_SCALE };
      const body = worldRef.current.projectile;
      Matter.Body.setStatic(body, false);
      Matter.Sleeping.set(body, false);
      Matter.Body.setVelocity(body, vel);
      Matter.Body.setAngularVelocity(body, Matter.Common.clamp(pull.x * 0.0018, -0.52, 0.52));
      const fxb = boardFxRef.current;
      fxb.dragging = false;
      fxb.aimPullNorm = 0;
      setAimPullNorm(0);
      spawnParticles(fxb.particles, body.position.x, body.position.y, 14, "#FFE048", fxb.reducedMotion, 5);
      playLaunch(muted);
      phaseRef.current = "launched";
      const t0 = performance.now();
      launchGraceUntilRef.current = t0 + LAUNCH_GRACE_MS;
      minFlightBeforeSettleUntilRef.current = t0 + MIN_FLIGHT_BEFORE_SETTLE_MS;
      setPhase("launched");
      resolveDeadlineRef.current = t0 + SHOT_RESOLVE_DEADLINE_MS;
      clearedThisLaunchRef.current = 0;
      blocksThisLaunchRef.current = 0;
      setAimLine(null);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [muted]);

  useEffect(() => {
    if (phase !== "aiming" && phase !== "launched" && phase !== "paused") {
      return;
    }
    const off = bindPointer();
    return () => off?.();
  }, [phase, bindPointer]);

  useEffect(() => {
    const w = worldRef.current;
    if (!w) return;
    const simulating = phase === "aiming" || phase === "launched";
    if (phase === "paused" || !simulating) {
      Matter.Runner.stop(w.runner);
    }
    if (simulating) {
      Matter.Runner.stop(w.runner);
      Matter.Runner.run(w.runner, w.engine);
    }
  }, [phase]);

  const runLevel = useMemo(() => resolveChallenge(challenge), [challenge]);
  const levelLabel =
    challenge.kind === "daily"
      ? `DAILY CHALLENGE — ${runLevel.name}`
      : `${runLevel.name} · SHOTS ${runLevel.availableShots}`;

  const handlePause = () => {
    playUiClick(muted);
    setPhase((p) => {
      if (p === "paused") return phaseBeforePauseRef.current;
      phaseBeforePauseRef.current = p;
      playModalOpen(muted);
      return "paused";
    });
  };

  const handleRestart = () => {
    playUiClick(muted);
    startRun(challenge);
  };

  const dailySeedPreview = typeof window !== "undefined" ? todaySeed() : challenge.seed;

  useEffect(() => {
    if (!result?.won || !user || !result.submitId) return;
    const sig = result.submitId;
    if (scoreSubmitSigRef.current === sig) return;
    scoreSubmitSigRef.current = sig;
    let cancelled = false;
    const mode = challenge.kind === "daily" ? "daily" : "level";
    const payload = {
      mode,
      levelId: runLevel.id,
      seed: challenge.kind === "daily" ? challenge.seed : null,
      score: result.score,
      stars: result.stars,
      shotsUsed: result.shotsUsed,
      shotsTotal: runLevel.availableShots,
      won: true,
      run_hash: result.submitId,
      client_version: "vibe-sling@0.1.0",
    };
    void (async () => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string; rank?: number };
        if (!res.ok) throw new Error(data.error ?? "Submit failed");
        if (cancelled) return;
        if (data.rank != null) {
          setResult((r) => (r ? { ...r, serverRank: data.rank ?? null } : r));
          toast.success(`Leaderboard rank #${data.rank}`);
        }
      } catch (e) {
        scoreSubmitSigRef.current = "";
        if (!cancelled) toast.error((e as Error).message || "Could not submit to leaderboard.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    result?.won,
    result?.submitId,
    result?.score,
    result?.stars,
    result?.shotsUsed,
    user,
    challenge.kind,
    challenge.levelId,
    challenge.seed,
    runLevel.id,
    runLevel.availableShots,
  ]);

  const boardHidden = phase === "menu";

  const tokenMapForHud = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of tokenOptions) m[r.id] = r.imageUrl;
    return m;
  }, [tokenOptions]);

  const projectileHud = useMemo(() => {
    if (projectileSkin === "gold") return { src: null as string | null, gold: true, badge: false };
    if (projectileSkin === "badge") return { src: null as string | null, gold: false, badge: true };
    return {
      src: projectileTextureUrlForSkin(projectileSkin, tokenMapForHud),
      gold: false,
      badge: false,
    };
  }, [projectileSkin, tokenMapForHud]);

  const resultPersistKey =
    challenge.kind === "daily" ? dailyPersistKey(challenge.seed, challenge.levelId) : `lv:${challenge.levelId}`;
  const bestScoreForLevel = Math.max(persisted?.bestByLevel[resultPersistKey] ?? 0, result?.score ?? 0);

  return (
    <div
      className={`relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-3 pb-arcade-player pt-arcade-player sm:max-w-xl md:max-w-2xl ${boardHidden ? "justify-center" : ""}`}
    >
      {!boardHidden ? (
        <div className="pointer-events-none fixed inset-0 z-[1] bg-black/58 sm:bg-black/45" aria-hidden />
      ) : null}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="rising-particle"
            style={{
              left: `${(i * 9.5) % 100}%`,
              animationDuration: `${9 + (i % 5)}s`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      {phase === "menu" && (
        <GameMenu
          muted={muted}
          dailySeedPreview={dailySeedPreview}
          projectileSkin={projectileSkin}
          tokenOptions={tokenOptions}
          onProjectileSkinChange={setProjectileSkin}
          onBackToLibrary={onExitToLibrary}
          onSelectLevel={(levelId) =>
            startRun({ kind: "handcrafted", levelId, seed: `level-${levelId}` })
          }
          onPracticeLevel={startPractice}
          onPlayDaily={() => {
            const s =
              typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("seed") ?? todaySeed()
                : todaySeed();
            startRun({ kind: "daily", levelId: dailyHandcraftedLevelId(s), seed: s });
          }}
        />
      )}

      <div
        className={
          boardHidden
            ? "hidden"
            : "relative z-[15] flex min-h-0 flex-1 flex-col touch-none overscroll-none"
        }
      >
        <GameHud
          score={score}
          shotsLeft={shots}
          levelLabel={levelLabel}
          muted={muted}
          projectilePreviewSrc={projectileHud.src}
          projectileIsProceduralGold={projectileHud.gold}
          projectileIsProceduralBadge={projectileHud.badge}
          onOpenLeaderboard={() => {
            playUiClick(muted);
            setLeaderboardOpen(true);
          }}
        />

        <div className="flex min-h-0 flex-1 flex-col justify-start pt-0.5">
          {/*
            Size from viewport height so the full 800×520 world fits: width ≤ (svh−chrome)×800/520.
            Canvas uses 100%×100% of this box (see Matter canvas style after Render.create).
          */}
          <div className="relative mx-auto w-full max-w-[min(100%,calc(max(0px,100dvh_-_188px)*800/520))] shrink-0 touch-none overscroll-none overflow-hidden rounded-2xl border border-gvc-gold/20 bg-[#030303] shadow-[0_0_80px_rgba(0,0,0,0.92)] aspect-[800/520]">
            <GameBackground
              variant="gameplay"
              slingNormX={slingUiNorm.x}
              slingNormY={slingUiNorm.y}
              backgroundUrl={levelBackgroundUrl(runLevel.id, challenge.seed, challenge.kind)}
            />
            <div id="vibe-sling-render-host" className="relative z-[2] h-full min-h-0 w-full" />
            <GameplayFloatingFeedback items={hudFloats} reducedMotion={prefersReducedMotion} />
            {aimLine && (
              <svg
                className="pointer-events-none absolute inset-0 z-[3] h-full w-full"
                viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="vibeCrashersGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(5,5,5,0.9)" />
                    <stop offset="45%" stopColor="#FFE048" />
                    <stop offset="100%" stopColor="#FF6B9D" />
                  </linearGradient>
                </defs>
                <line
                  x1={aimLine.x1}
                  y1={aimLine.y1}
                  x2={aimLine.x2}
                  y2={aimLine.y2}
                  stroke="url(#vibeCrashersGrad)"
                  strokeWidth={2.5 + aimPullNorm * 7}
                  strokeLinecap="round"
                  opacity={0.55 + aimPullNorm * 0.4}
                />
                <line
                  x1={aimLine.x1}
                  y1={aimLine.y1}
                  x2={aimLine.x2}
                  y2={aimLine.y2}
                  stroke="rgba(255,224,72,0.25)"
                  strokeWidth={12 + aimPullNorm * 18}
                  strokeLinecap="round"
                />
                {Array.from({ length: 5 }).map((_, i) => {
                  const t = (i + 1) / 6;
                  const px = aimLine.x1 + (aimLine.x2 - aimLine.x1) * t;
                  const py = aimLine.y1 + (aimLine.y2 - aimLine.y1) * t;
                  return (
                    <circle key={i} cx={px} cy={py} r={1.2 + aimPullNorm * 1.5} fill="rgba(255,224,72,0.35)" />
                  );
                })}
              </svg>
            )}
            <FirstRunCoachOverlay
              gameId="vibe-crashers"
              open={coachOpen}
              muted={muted}
              onComplete={() => setCoachOpen(false)}
            />
          </div>
        </div>

        <GamePlayActionBar
          muted={muted}
          paused={phase === "paused"}
          onBack={() => {
            playUiClick(muted);
            setPhase("menu");
            setResult(null);
            teardownWorld();
          }}
          onRestart={handleRestart}
          onPause={handlePause}
          onToggleMute={() => persistMute(!muted)}
          onBadges={() => {
            playModalOpen(muted);
            setBadgesOpen(true);
          }}
          onOpenLeaderboard={() => {
            playModalOpen(muted);
            setLeaderboardOpen(true);
          }}
        />

        {debugMode ? (
          <p className="mt-2 text-center font-mono text-[10px] text-gvc-gold/70">
            Debug: outlines on · check console for level physics warnings.
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {result && (
          <ResultScreen
            won={result.won}
            score={result.score}
            stars={result.stars}
            shotsUsed={result.shotsUsed}
            maxShots={runLevel.availableShots}
            levelName={runLevel.name}
            bestScore={bestScoreForLevel}
            modeLabel={levelLabel}
            muted={muted}
            newAchievementSlugs={result.newAchievementSlugs}
            isLoggedIn={Boolean(user)}
            serverRank={result.serverRank ?? undefined}
            onOpenAuth={() => setAuthModalOpen(true)}
            onRetry={() => {
              playUiClick(muted);
              setResult(null);
              startRun(challenge);
            }}
            showNext={result.won && challenge.kind === "handcrafted" && Number(challenge.levelId) < 20}
            onNext={
              result.won && challenge.kind === "handcrafted" && Number(challenge.levelId) < 20
                ? () => {
                    playUiClick(muted);
                    setResult(null);
                    const next = String(Number(challenge.levelId) + 1);
                    startRun({ kind: "handcrafted", levelId: next, seed: `level-${next}` });
                  }
                : undefined
            }
            onOpenLeaderboard={() => {
              playUiClick(muted);
              setLeaderboardOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <LeaderboardPanel
        open={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        rows={persisted?.localLeaderboard ?? []}
        muted={muted}
        defaultDailySeed={dailySeedPreview}
      />

      <GameModal
        open={phase === "paused"}
        onClose={() => setPhase(phaseBeforePauseRef.current)}
        title="Paused"
        subtitle={levelLabel}
        muted={muted}
      >
        <div className="flex flex-col gap-3 px-0.5 pb-1">
          <button
            type="button"
            onClick={() => {
              playUiClick(muted);
              setPhase(phaseBeforePauseRef.current);
            }}
            className="min-h-[48px] rounded-xl bg-gvc-gold px-4 py-3 font-display text-sm font-black uppercase tracking-wide text-gvc-black shadow-[0_0_24px_rgba(255,224,72,0.25)] transition hover:brightness-105 active:scale-[0.98]"
          >
            Resume crash
          </button>
          <button
            type="button"
            onClick={() => {
              playUiClick(muted);
              setPhase("menu");
              setResult(null);
              teardownWorld();
            }}
            className="min-h-[44px] rounded-xl border border-white/12 py-3 font-body text-sm text-white/70 transition hover:border-gvc-gold/35 hover:text-white"
          >
            Exit to menu
          </button>
        </div>
      </GameModal>

      <GameModal
        open={badgesOpen}
        onClose={() => setBadgesOpen(false)}
        title="Badges"
        subtitle="Unlock official GVC library badges."
        muted={muted}
        tall
      >
        <CrashersBadgesPanel />
      </GameModal>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} muted={muted} />
    </div>
  );
}
