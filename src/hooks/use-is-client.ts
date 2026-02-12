"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns true only after hydration on the client, while keeping the server snapshot false.
 * This helps avoid hydration mismatches without using a "mounted" state + effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {
      // No-op subscription: we only need the server vs client snapshot behavior.
    },
    () => true,
    () => false
  );
}
