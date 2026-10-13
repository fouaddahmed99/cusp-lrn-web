"use client";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useProgressVersion } from "@/components/hooks";
import { useStudyData } from "@/components/study-data";
import { Card, EmptyState, LinkButton, Notice, PageTitle, Spinner } from "@/components/ui";
import { progress } from "@/adapters/progress";
import type { PublicManifest } from "@/contract";
import { formatDuration } from "@/lib/util";

function Oce({ m }: { m: PublicManifest }) {
  const data = useStudyData();
  const v = useProgressVersion();
  const attempts = useAsync(() => progress.oceAttempts(), [v]);
  if (data.loading || !data.data) return <Spinner />;
  const cases = data.data.stubs.filter((s) => s.type === "oce_vignette");
  const name = new Map(m.domains.map((d) => [d.id, d.name]));
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="OCE practice" subtitle={`The OCE is ${m.exam.oce.sessions} consecutive ${m.exam.oce.sessionMinutes}-minute sessions with ${m.exam.oce.examinersPerSession} examiners. Practice cases one question at a time.`} />
      <Notice>Answer out loud (recorded privately on this device) or by typing, then compare with the model answer and score yourself 3 / 2 / 1. Share the examiner link with a study partner to practice together.</Notice>
      {cases.length === 0 && <EmptyState title="No OCE cases published yet" />}
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((c, i) => {
          const mine = (attempts.data ?? []).filter((a) => a.vignetteId === c.id && a.finishedAt);
          const last = mine.at(-1);
          const score = last ? last.answers.reduce((s, a) => s + (a.selfScore ?? 0), 0) : null;
          return (
            <Card key={c.id}>
              <h2 className="font-semibold">Case {i + 1}</h2>
              <p className="muted text-sm">{name.get(c.tags.domainId) ?? c.tags.domainId}</p>
              {score !== null && last && <p className="mt-1 text-sm">Last self-score: {score} / {last.answers.length * 3}</p>}
              <div className="mt-3 flex gap-2">
                <LinkButton href={`/app/oce/run/?id=${c.id}`}>Practice</LinkButton>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="muted text-xs">Suggested pace: about {formatDuration((m.exam.oce.sessionMinutes * 60) / 6)} per case. The AI examiner is not available in the free edition.</p>
    </div>
  );
}

export default function OcePage() {
  return <ContentGate>{(m) => <Oce m={m} />}</ContentGate>;
}
