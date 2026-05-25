"use client";

import { useCallback, useEffect, useState } from "react";
import { flushAccountCloudSync, hasPendingAccountSync } from "@/lib/persist/cloudSync";
import type { CollectionsSnapshot } from "@/lib/profile/types";

/** Load profile collections from the server — no blocking progress sync. */
export function useProfileCollections(open: boolean) {
  const [collections, setCollections] = useState<CollectionsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCollections = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch("/api/profile/me/collections", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load collections");
      const data = (await res.json()) as { collections: CollectionsSnapshot };
      setCollections(data.collections ?? null);
      return data.collections ?? null;
    } catch {
      if (!opts?.silent) setCollections(null);
      return null;
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCollections(null);
    void (async () => {
      await fetchCollections();
      if (hasPendingAccountSync()) {
        void flushAccountCloudSync()
          .then(() => fetchCollections({ silent: true }))
          .catch(() => undefined);
      }
    })();
  }, [open, fetchCollections]);

  return { collections, loading, reload: fetchCollections };
}
