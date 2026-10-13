import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { z } from "zod";
import type { Attempt, Mark, OceAttempt, PlanTaskState, Profile, ReviewEntry, Session, Settings, StoredCard } from "@/lib/types";

/**
 * ProgressStore (Part J6/J8). GitHub mode keeps all progress ON THE USER'S DEVICE
 * in IndexedDB, with export/import backup files. A hosted edition can implement
 * the same interface with server sync.
 */

interface CuspDB extends DBSchema {
  attempts: { key: number; value: Attempt; indexes: { byItem: string; bySession: string } };
  sessions: { key: string; value: Session };
  marks: { key: string; value: Mark };
  cards: { key: string; value: StoredCard };
  reviews: { key: number; value: ReviewEntry };
  oce: { key: string; value: OceAttempt };
  kv: { key: string; value: { key: string; value: unknown } };
}

const DB_NAME = "cusp-lrn";
const STORES = ["attempts", "sessions", "marks", "cards", "reviews", "oce", "kv"] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBPDatabase<CuspDB>> | undefined;

function db(): Promise<IDBPDatabase<CuspDB>> {
  dbPromise ??= openDB<CuspDB>(DB_NAME, 1, {
    upgrade(d) {
      const a = d.createObjectStore("attempts", { keyPath: "id", autoIncrement: true });
      a.createIndex("byItem", "itemId");
      a.createIndex("bySession", "sessionId");
      d.createObjectStore("sessions", { keyPath: "id" });
      d.createObjectStore("marks", { keyPath: "itemId" });
      d.createObjectStore("cards", { keyPath: "id" });
      d.createObjectStore("reviews", { keyPath: "id", autoIncrement: true });
      d.createObjectStore("oce", { keyPath: "id" });
      d.createObjectStore("kv", { keyPath: "key" });
    },
  });
  return dbPromise;
}

/** Notify open pages that progress changed (same tab and other tabs). */
function changed() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("cusp-progress"));
  try {
    new BroadcastChannel("cusp-progress").postMessage("changed");
  } catch {
    /* not supported */
  }
}

export const progress = {
  // ---- attempts
  async addAttempt(a: Attempt) {
    await (await db()).add("attempts", a);
    changed();
  },
  async attempts(): Promise<Attempt[]> {
    return (await db()).getAll("attempts");
  },
  async attemptsForSession(sessionId: string): Promise<Attempt[]> {
    return (await db()).getAllFromIndex("attempts", "bySession", sessionId);
  },

  // ---- sessions
  async saveSession(s: Session) {
    await (await db()).put("sessions", s);
    changed();
  },
  async session(id: string) {
    return (await db()).get("sessions", id);
  },
  async sessions(): Promise<Session[]> {
    return (await db()).getAll("sessions");
  },
  async deleteSession(id: string) {
    await (await db()).delete("sessions", id);
    changed();
  },

  // ---- marks (flags + notes)
  async mark(itemId: string) {
    return (await db()).get("marks", itemId);
  },
  async marks(): Promise<Mark[]> {
    return (await db()).getAll("marks");
  },
  async saveMark(m: Mark) {
    await (await db()).put("marks", m);
    changed();
  },

  // ---- flashcards
  async cards(): Promise<StoredCard[]> {
    return (await db()).getAll("cards");
  },
  async card(id: string) {
    return (await db()).get("cards", id);
  },
  async saveCard(c: StoredCard) {
    await (await db()).put("cards", c);
    changed();
  },
  async deleteCard(id: string) {
    await (await db()).delete("cards", id);
    changed();
  },
  async addReview(r: ReviewEntry) {
    await (await db()).add("reviews", r);
  },
  async reviews(): Promise<ReviewEntry[]> {
    return (await db()).getAll("reviews");
  },

  // ---- OCE
  async saveOce(o: OceAttempt) {
    await (await db()).put("oce", o);
    changed();
  },
  async oceAttempts(): Promise<OceAttempt[]> {
    return (await db()).getAll("oce");
  },

  // ---- key/value
  async get<T>(key: string, fallback: T): Promise<T> {
    const row = await (await db()).get("kv", key);
    return row ? (row.value as T) : fallback;
  },
  async set(key: string, value: unknown) {
    await (await db()).put("kv", { key, value });
    changed();
  },
  profile: () => progress.get<Profile>("profile", {}),
  saveProfile: (p: Profile) => progress.set("profile", p),
  settings: () => progress.get<Settings>("settings", { theme: "system", speechRate: 1 }),
  saveSettings: (s: Settings) => progress.set("settings", s),
  planState: () => progress.get<PlanTaskState>("plan-state", { date: "", done: [] }),
  savePlanState: (p: PlanTaskState) => progress.set("plan-state", p),

  // ---- backup
  async exportBackup(): Promise<Blob> {
    const d = await db();
    const stores: Record<string, unknown[]> = {};
    for (const s of STORES) stores[s] = await d.getAll(s);
    const payload = { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), stores };
    return new Blob([JSON.stringify(payload)], { type: "application/json" });
  },

  async importBackup(text: string, mode: "merge" | "replace"): Promise<{ records: number }> {
    const parsed = Backup.parse(JSON.parse(text));
    const d = await db();
    let records = 0;
    const tx = d.transaction([...STORES], "readwrite");
    for (const s of STORES) {
      const store = tx.objectStore(s as StoreName);
      if (mode === "replace") await store.clear();
      for (const row of parsed.stores[s] ?? []) {
        // Auto-increment stores: drop ids on merge so imported rows never overwrite local ones.
        let value = row as Record<string, unknown>;
        if (mode === "merge" && (s === "attempts" || s === "reviews")) {
          const { id: _id, ...rest } = value;
          value = rest;
        }
        await store.put(value as never);
        records++;
      }
    }
    await tx.done;
    changed();
    return { records };
  },

  async clearAll() {
    const d = await db();
    for (const s of STORES) await d.clear(s);
    changed();
  },
};

export const BACKUP_FORMAT = "cusp-lrn-progress";
const Backup = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(1),
  exportedAt: z.string(),
  stores: z.record(z.string(), z.array(z.unknown())),
});

export type ProgressStore = typeof progress;
