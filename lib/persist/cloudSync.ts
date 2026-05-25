import { buildAllGamesSyncExtras } from "@/lib/profile/syncMerge";
import { buildProgressSyncPayload } from "@/lib/progressSync";
import { loadProjectileSkinFromStorage } from "@/lib/assets/projectileSkins";
import { getAccountCrashers } from "./accountCache";
import { getDefaultPersisted, loadPersisted, type PersistedState } from "@/lib/storage";
import { isAccountMode } from "./accountMode";
import { mapProgressApiResponse } from "./responseMapper";

let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;

export function scheduleAccountCloudSync(crashers?: PersistedState): void {
  if (!isAccountMode()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushAccountCloudSync(crashers);
  }, 600);
}

function crashersForSync(override?: PersistedState): PersistedState {
  return override ?? getAccountCrashers() ?? loadPersisted() ?? getDefaultPersisted();
}

export function hasPendingAccountSync(): boolean {
  return timer !== null || inflight !== null;
}

export async function flushAccountCloudSync(crashersOverride?: PersistedState): Promise<void> {
  if (!isAccountMode()) return;
  if (inflight) {
    await inflight;
    return;
  }
  inflight = (async () => {
    const crashers = crashersForSync(crashersOverride);
    const skin = loadProjectileSkinFromStorage();
    const body = {
      ...buildProgressSyncPayload(crashers, {
        selectedProjectile: skin,
        soundMuted: crashers.soundMuted,
        reducedMotion: null,
      }),
      ...buildAllGamesSyncExtras(),
    };
    const res = await fetch("/api/progress/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Cloud sync failed");
    const raw = (await res.json()) as Record<string, unknown>;
    const mapped = mapProgressApiResponse(raw);
    const { hydrateAllFromProgressResponse } = await import("./hydrateFromProgress");
    hydrateAllFromProgressResponse(mapped);
  })().finally(() => {
    inflight = null;
  });
  await inflight;
}
