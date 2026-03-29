import type { ReflectionEntry, TrialEvent } from "@/lib/types";

const REFLECTIONS_KEY = "explore-vit:reflections";
const TRIALS_KEY = "explore-vit:trials";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getStoredReflections() {
  return readJson<ReflectionEntry[]>(REFLECTIONS_KEY, []);
}

export function addStoredReflection(entry: ReflectionEntry) {
  const nextEntry = {
    ...entry,
    id: entry.id || createLocalId("reflection"),
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  const updated = [nextEntry, ...getStoredReflections()];
  writeJson(REFLECTIONS_KEY, updated);
  return updated;
}

export function getStoredTrials() {
  return readJson<TrialEvent[]>(TRIALS_KEY, []);
}

export function addStoredTrial(event: TrialEvent) {
  const nextEvent = {
    ...event,
    id: event.id || createLocalId("trial"),
    createdAt: event.createdAt || new Date().toISOString(),
  };

  const updated = [nextEvent, ...getStoredTrials()];
  writeJson(TRIALS_KEY, updated);
  return updated;
}
