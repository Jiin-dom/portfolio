"use client";

import { useSyncExternalStore } from "react";

const KEY = "portfolio:reduced-effects";
const EVENT = "desk:effects-change";
let memoryValue: boolean | null = null;

function getSnapshot() {
  if (memoryValue !== null) return memoryValue;
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      memoryValue = null;
      notify();
    }
  };
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", onStorage);
  };
}

function setReducedEffects(value: boolean) {
  memoryValue = value;
  try {
    localStorage.setItem(KEY, String(value));
    memoryValue = null;
  } catch {
    // Keep the control working when persistent storage is unavailable.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useReducedEffects() {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return [reduced, setReducedEffects] as const;
}
