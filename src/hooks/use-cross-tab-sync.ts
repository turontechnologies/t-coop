"use client";

import { useEffect } from "react";

/**
 * Genuine real-time sync across browser tabs for a zustand `persist` store —
 * no backend involved. The native `storage` event fires in every OTHER tab
 * (never the tab that made the change) whenever a given localStorage key is
 * written, so calling the store's `persist.rehydrate()` there pulls in
 * whatever the other tab just saved, live. This is the actual mechanism, not
 * a simulated one — it just only reaches tabs on the same browser/device,
 * since there is no server to fan a change out across devices.
 */
export function useCrossTabSync(storageKey: string, rehydrate: () => void) {
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === storageKey) rehydrate();
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey, rehydrate]);
}
