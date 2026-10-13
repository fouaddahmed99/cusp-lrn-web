"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { progress } from "@/adapters/progress";
import { ContentGate } from "@/components/content-gate";
import { useStudyData } from "@/components/study-data";
import { Card, EmptyState, LinkButton, PageTitle, ProgressBar, Spinner, Stat } from "@/components/ui";
import type { PublicManifest } from "@/contract";
import { streak, summarize } from "@/lib/analytics";
import { buildPlan } from "@/lib/planner";
import { isDue } from "@/lib/srs";
import type { PlanTaskState } from "@/lib/types";
import { todayIso } from "@/lib/util";

function Planner({ m }: { m: PublicManifest }) {
  const data = useStudyData();
  const [state, setState] = useState<PlanTaskState>({ date: "", done: [] });
  const today = todayIso();
  useEffect(() => {
    progress.planState().then((s) => setState(s.date === today ? s : { date: today, done: [] }));
  }, [today]);
  if (data.loading || !data.data) return <Spinner />;
  const { profile, attempts, cards } = data.data;
  if (!profile.examDate) {
    return (
      <EmptyState title="Set your exam date first">
        <LinkButton href="/app/onboarding/" className="mt-3">
          Set up my plan
        </LinkButton>
      </EmptyState>
    );
  }
  const summary = summarize(attempts);
  const plan = buildPlan({ examDate: profile.examDate, today, weeklyHours: profile.weeklyHours ?? 10, domains: m.domains, summary, dueCards: cards.filter((c) => isDue(c)).length, hasOce: m.counts.oce_vignette > 0 });
  const studyDays = new Set([...attempts.map((a) => a.at.slice(0, 10)), ...(state.done.length ? [today] : [])]);
  const toggle = async (id: string) => {
    const next = { date: today, done: state.done.includes(id) ? state.done.filter((x) => x !== id) : [...state.done, id] };
    setState(next);
    await progress.savePlanState(next);
  };
  const phase = { learn: "Learn: broad coverage plus notes", consolidate: "Consolidate: more questions, weekly mini-mocks", final: "Final stretch: timed practice and weak areas" }[plan.phase];
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Study planner" subtitle={`${phase}. Weighted by the QE blueprint and shifted toward your weaker domains.`} actions={<LinkButton href="/app/onboarding/" variant="secondary">Edit exam date & hours</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Days left" value={plan.daysLeft} />
        <Stat label="Questions / day" value={plan.questionsPerDay} hint={`${profile.weeklyHours ?? 10} h per week`} />
        <Stat label="Streak" value={`${streak(studyDays, today)} d`} />
        <Stat label="Today" value={`${state.done.length}/${plan.today.length}`} hint="tasks done" />
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">Today</h2>
        <ul className="flex flex-col gap-2">
          {plan.today.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <input id={`t-${t.id}`} type="checkbox" className="h-4 w-4 accent-[var(--brand)]" checked={state.done.includes(t.id)} onChange={() => toggle(t.id)} />
              <label htmlFor={`t-${t.id}`} className={state.done.includes(t.id) ? "muted line-through" : ""}>
                {t.label}
              </label>
              <Link href={t.href} className="ml-auto text-sm">
                Go →
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">How your question time is split</h2>
        <ul className="flex flex-col gap-3">
          {plan.allocation.map((a) => (
            <li key={a.domainId}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{a.name}</span>
                <span className="muted">{Math.round(a.share * 100)}%</span>
              </div>
              <ProgressBar value={a.share * 100 * 3} label={`${a.name} share`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function PlannerPage() {
  return <ContentGate>{(m) => <Planner m={m} />}</ContentGate>;
}
