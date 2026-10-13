import type { PublicItemStub } from "@/contract";
import type { Attempt, Mark } from "./types";
import { shuffle } from "./util";

export const MCQ_TYPES = ["mcq", "vignette_mcq", "image_mcq"] as const;

export interface QbankFilters {
  domainIds: string[];
  subtopicIds: string[];
  taskStatementIds: string[];
  cognitiveLevels: string[];
  types: string[];
  status: "all" | "unused" | "incorrect" | "marked";
}

export const emptyFilters = (): QbankFilters => ({ domainIds: [], subtopicIds: [], taskStatementIds: [], cognitiveLevels: [], types: [], status: "all" });

/** Latest attempt per item. */
export function latestByItem(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of [...attempts].sort((x, y) => x.at.localeCompare(y.at))) m.set(a.itemId, a);
  return m;
}

export function filterStubs(stubs: PublicItemStub[], f: QbankFilters, attempts: Attempt[], marks: Mark[]): PublicItemStub[] {
  const latest = latestByItem(attempts);
  const marked = new Set(marks.filter((m) => m.flagged).map((m) => m.itemId));
  const inSet = (list: string[], v: string) => list.length === 0 || list.includes(v);
  return stubs.filter((s) => {
    if (!(MCQ_TYPES as readonly string[]).includes(s.type)) return false;
    if (!inSet(f.types, s.type) || !inSet(f.domainIds, s.tags.domainId) || !inSet(f.subtopicIds, s.tags.subtopicId)) return false;
    if (!inSet(f.taskStatementIds, s.tags.taskStatementId) || !inSet(f.cognitiveLevels, s.tags.cognitiveLevel)) return false;
    if (f.status === "unused") return !latest.has(s.id);
    if (f.status === "incorrect") return latest.get(s.id)?.correct === false;
    if (f.status === "marked") return marked.has(s.id);
    return true;
  });
}

export function pickItems(stubs: PublicItemStub[], count: number, rand?: () => number): string[] {
  return shuffle(stubs, rand).slice(0, count).map((s) => s.id);
}
