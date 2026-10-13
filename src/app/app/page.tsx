"use client";
import Link from "next/link";
import { ContentGate } from "@/components/content-gate";
import { useStudyData } from "@/components/study-data";
import { Card, LinkButton, Notice, PageTitle, Spinner, Stat } from "@/components/ui";
import { streak, summarize } from "@/lib/analytics";
import { buildPlan } from "@/lib/planner";
import { isDue } from "@/lib/srs";
import { daysBetween, todayIso } from "@/lib/util";

export default function Dashboard() {
  const data = useStudyData();
  return (
    <ContentGate>
      {(m) => {
        if (data.loading || !data.data) return <Spinner />;
        const { attempts, cards, profile, stubs } = data.data;
        const today = todayIso();
        const s = summarize(attempts);
        const due = cards.filter((c) => isDue(c)).length;
        const days = new Set(attempts.map((a) => a.at.slice(0, 10)));
        const plan = profile.examDate ? buildPlan({ examDate: profile.examDate, today, weeklyHours: profile.weeklyHours ?? 10, domains: m.domains, summary: s, dueCards: due, hasOce: m.counts.oce_vignette > 0 }) : null;
        const questions = stubs.filter((x) => x.type.endsWith("mcq")).length;
        return (
          <div className="flex flex-col gap-6">
            <PageTitle title="Dashboard" subtitle={profile.examDate ? `${Math.max(0, daysBetween(today, profile.examDate))} days until your exam` : "Set your exam date to get a study plan."} actions={<LinkButton href="/app/qbank/">Start questions</LinkButton>} />
            {!profile.onboarded && (
              <Notice title="Welcome! Set up your study plan">
                Tell us your exam date and weekly study hours to get a blueprint-weighted daily plan. <Link href="/app/onboarding/">Set up now →</Link>
              </Notice>
            )}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Questions answered" value={s.answered} hint={`${questions} available`} />
              <Stat label="Accuracy" value={`${s.pct}%`} />
              <Stat label="Cards due" value={due} />
              <Stat label="Study streak" value={`${streak(days, today)} d`} />
            </div>
            {plan && (
              <Card>
                <h2 className="mb-3 font-semibold">Today&apos;s plan</h2>
                <ul className="flex flex-col gap-2">
                  {plan.today.map((t) => (
                    <li key={t.id}>
                      <Link href={t.href}>{t.label}</Link>
                    </li>
                  ))}
                </ul>
                <Link href="/app/planner/" className="mt-3 inline-block text-sm">
                  Full plan →
                </Link>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <h2 className="font-semibold">QE simulator</h2>
                <p className="muted mt-1 text-sm">{m.exam.qe.totalItems}-item, blueprint-weighted, {Math.round(m.exam.qe.durationMinutes / 60)}-hour exam, plus mini-mocks.</p>
                <LinkButton href="/app/simulator/" variant="secondary" className="mt-3">
                  Open simulator
                </LinkButton>
              </Card>
              <Card>
                <h2 className="font-semibold">OCE practice</h2>
                <p className="muted mt-1 text-sm">{m.counts.oce_vignette} case(s) with model answers and rubric.</p>
                <LinkButton href="/app/oce/" variant="secondary" className="mt-3">
                  Practice a case
                </LinkButton>
              </Card>
              <Card>
                <h2 className="font-semibold">Flashcards</h2>
                <p className="muted mt-1 text-sm">{due} due now · {cards.length} in your deck.</p>
                <LinkButton href="/app/flashcards/" variant="secondary" className="mt-3">
                  Review
                </LinkButton>
              </Card>
            </div>
            <Notice>
              Your progress is saved only in this browser on this device. Clearing browser data erases it. <Link href="/app/settings/">Export a backup</Link> regularly.
            </Notice>
          </div>
        );
      }}
    </ContentGate>
  );
}
