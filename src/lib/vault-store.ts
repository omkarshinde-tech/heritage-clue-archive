// Haunted heritage archive (PhantomVault AI)
import { useSyncExternalStore } from "react";

export type Clue = { kind: string; title: string; detail: string; quote: string; time: string; solved?: boolean };
export type CaseFile = {
  id: string;
  createdAt: number;
  fileName: string;
  durationSec: number;
  title: string;
  summary: string;
  era: string;
  location: string;
  language: string;
  keywords: string[];
  people: string[];
  timeline: { time: string; event: string }[];
  clues: Clue[];
  transcript: string;
  notes: string;
};

const KEY = "phantomvault.cases.v1";
const listeners = new Set<() => void>();
let cache: CaseFile[] | null = null;
const EMPTY: CaseFile[] = [];

function read(): CaseFile[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
function write(next: CaseFile[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export const vault = {
  add(c: CaseFile) {
    write([c, ...read()]);
  },
  update(id: string, patch: Partial<CaseFile>) {
    write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  },
  remove(id: string) {
    write(read().filter((c) => c.id !== id));
  },
};

export function useCases() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => EMPTY,
  );
}

export function timeToSec(t: string) {
  const parts = t.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  return parts.reduce((a, b) => a * 60 + b, 0);
}

/** Session-only media blobs so evidence timestamps can be played back. */
export const mediaUrls = new Map<string, { url: string; isVideo: boolean }>();
