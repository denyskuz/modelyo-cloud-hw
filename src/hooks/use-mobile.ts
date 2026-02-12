"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(query);
      const handler = () => onStoreChange();
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
