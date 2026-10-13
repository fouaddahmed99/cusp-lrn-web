import type { Summary } from "./analytics";

export interface PlanDomain {
  id: string;
  name: string;
  qeWeightPct: number;
}

export interface DailyTask {
  id: string;
  kind: "questions" | "flashcards" | "notes" | "mock" | "oce";
  label: string;
  domainId?: string;
  count?: number;
  href: string;
}

export interface Plan {
  daysLeft: number;
  weeksLeft: number;
  questionsPerDay: number;
  /** Share of question time per domain (blueprint weight, boosted where accuracy is low). */
  allocation: { domainId: string; name: string; share: number }[];
  today: DailyTask[];
  phase: "learn" | "consolidate" | "final";
}

const MIN_PER_QUESTION = 2; // answer + review the explanation

/**
 * Blueprint-weighted adaptive plan (Part F7). Domain shares start at the QE
 * weights and shift toward domains where the user's accuracy is lowest.
 */
export function buildPlan(opts: { examDate: string; today: string; weeklyHours: number; domains: PlanDomain[]; summary: Summary; dueCards: number; hasOce: boolean }): Plan {
  const daysLeft = Math.max(0, Math.round((new Date(opts.examDate).getTime() - new Date(opts.today).getTime()) / 86_400_000));
  const dailyMinutes = Math.max(15, (opts.weeklyHours * 60) / 6); // one rest day a week
  const phase: Plan["phase"] = daysLeft <= 14 ? "final" : daysLeft <= 42 ? "consolidate" : "learn";
  const questionShare = phase === "learn" ? 0.55 : phase === "consolidate" ? 0.7 : 0.8;
  const questionsPerDay = Math.max(5, Math.round((dailyMinutes * questionShare) / MIN_PER_QUESTION));

  const acc = new Map(opts.summary.byDomain.map((b) => [b.key, b]));
  const raw = opts.domains.map((d) => {
    const b = acc.get(d.id);
    const weakness = b && b.answered >= 3 ? 1 + (100 - b.pct) / 100 : 1.2; // untested domains get a nudge
    return { domainId: d.id, name: d.name, w: d.qeWeightPct * weakness };
  });
  const total = raw.reduce((s, r) => s + r.w, 0) || 1;
  const allocation = raw.map((r) => ({ domainId: r.domainId, name: r.name, share: r.w / total })).sort((a, b) => b.share - a.share);

  // Rotate the day's focus domains through the allocation.
  const dayIndex = Math.floor(new Date(opts.today).getTime() / 86_400_000);
  const focus = [allocation[dayIndex % Math.max(1, Math.min(4, allocation.length))], allocation[(dayIndex + 1) % allocation.length]].filter(Boolean) as Plan["allocation"];
  const today: DailyTask[] = [];
  const split = [Math.ceil(questionsPerDay * 0.6), Math.floor(questionsPerDay * 0.4)];
  focus.forEach((f, i) => today.push({ id: `q-${f.domainId}`, kind: "questions", label: `${split[i]} questions: ${f.name}`, domainId: f.domainId, count: split[i], href: `/app/qbank/?domain=${f.domainId}&count=${split[i]}` }));
  if (opts.dueCards > 0) today.push({ id: "cards", kind: "flashcards", label: `Review ${opts.dueCards} due flashcard${opts.dueCards === 1 ? "" : "s"}`, href: "/app/flashcards/review/" });
  if (phase === "learn" && focus[0]) today.push({ id: `notes-${focus[0].domainId}`, kind: "notes", label: `Read high-yield notes: ${focus[0].name}`, href: "/app/library/" });
  if (phase !== "learn" && dayIndex % 7 === 0) today.push({ id: "mock", kind: "mock", label: "Take a 50-item mini-mock", href: "/app/simulator/" });
  if (opts.hasOce && dayIndex % 3 === 0) today.push({ id: "oce", kind: "oce", label: "Practice one OCE case", href: "/app/oce/" });
  return { daysLeft, weeksLeft: Math.ceil(daysLeft / 7), questionsPerDay, allocation, today, phase };
}
