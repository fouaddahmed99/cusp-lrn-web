import type { Attempt } from "./types";
import { pct } from "./util";

export interface Bucket {
  key: string;
  answered: number;
  correct: number;
  pct: number;
  avgTimeSec: number;
}

function bucket(attempts: Attempt[], keyOf: (a: Attempt) => string): Bucket[] {
  const map = new Map<string, { answered: number; correct: number; time: number }>();
  for (const a of attempts) {
    const k = keyOf(a);
    const b = map.get(k) ?? { answered: 0, correct: 0, time: 0 };
    b.answered++;
    if (a.correct) b.correct++;
    b.time += a.timeMs;
    map.set(k, b);
  }
  return [...map.entries()]
    .map(([key, b]) => ({ key, answered: b.answered, correct: b.correct, pct: pct(b.correct, b.answered), avgTimeSec: Math.round(b.time / b.answered / 1000) }))
    .sort((x, y) => x.key.localeCompare(y.key));
}

export interface Summary {
  answered: number;
  correct: number;
  pct: number;
  avgTimeSec: number;
  byDomain: Bucket[];
  bySubtopic: Bucket[];
  byTask: Bucket[];
  byLevel: Bucket[];
  byDay: Bucket[];
}

/** On-device analytics (Part F3, J6). Percentiles are disabled: they need server data. */
export function summarize(attempts: Attempt[]): Summary {
  const answered = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const time = attempts.reduce((s, a) => s + a.timeMs, 0);
  return {
    answered,
    correct,
    pct: pct(correct, answered),
    avgTimeSec: answered ? Math.round(time / answered / 1000) : 0,
    byDomain: bucket(attempts, (a) => a.domainId),
    bySubtopic: bucket(attempts, (a) => a.subtopicId),
    byTask: bucket(attempts, (a) => a.taskStatementId),
    byLevel: bucket(attempts, (a) => a.cognitiveLevel),
    byDay: bucket(attempts, (a) => a.at.slice(0, 10)),
  };
}

/** Weakest domains first (min. answered to count), for the one-click "weak areas" quiz. */
export function weakDomains(s: Summary, minAnswered = 3): string[] {
  return s.byDomain.filter((b) => b.answered >= minAnswered).sort((a, b) => a.pct - b.pct).slice(0, 3).map((b) => b.key);
}

/** Consecutive days (ending today or yesterday) with at least one study action. */
export function streak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  const d = new Date(`${today}T00:00:00Z`);
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}
