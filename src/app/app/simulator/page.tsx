"use client";
import { useRouter } from "next/navigation";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useProgressVersion } from "@/components/hooks";
import { Badge, Button, Card, EmptyState, LinkButton, Notice, PageTitle, Spinner } from "@/components/ui";
import type { PublicExamForm, PublicManifest } from "@/contract";
import { formatDuration, uid } from "@/lib/util";

function Simulator({ m }: { m: PublicManifest }) {
  const router = useRouter();
  const v = useProgressVersion();
  const forms = useAsync<PublicExamForm[]>(() => Promise.all(m.forms.map((f) => content.getForm(f.id))), []);
  const past = useAsync(async () => (await progress.sessions()).filter((s) => s.kind === "sim").sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [v]);
  const domainName = new Map(m.domains.map((d) => [d.id, d.name]));

  const start = async (f: PublicExamForm) => {
    const target = f.kind === "full" ? m.exam.qe.totalItems : f.kind === "mini100" ? 100 : 50;
    // Full exam: the real time limit. Mini-mocks: the same pace per item.
    const timeLimitSec = Math.round(((m.exam.qe.durationMinutes * 60) / m.exam.qe.totalItems) * target);
    const now = new Date().toISOString();
    const id = uid("sim");
    await progress.saveSession({ id, kind: "sim", mode: "timed", itemIds: f.itemIds, answers: {}, submitted: {}, timeMs: {}, flags: [], index: 0, createdAt: now, startedAt: now, elapsedSec: 0, timeLimitSec, formId: f.id, title: f.name });
    router.push(`/app/simulator/run/?id=${id}`);
  };

  if (forms.loading) return <Spinner />;
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="QE simulator" subtitle={`Blueprint-weighted fixed exam forms. The full exam is ${m.exam.qe.totalItems} items in ${formatDuration(m.exam.qe.durationMinutes * 60)}.`} />
      <Notice>
        Forms are fixed so repeat attempts are comparable. If a domain does not yet have enough approved questions, the form is shorter and the shortfall is shown. It is never padded with unverified items.
      </Notice>
      {(forms.data ?? []).length === 0 && <EmptyState title="No exam forms published yet" />}
      <div className="grid gap-4 md:grid-cols-2">
        {(forms.data ?? []).map((f) => {
          const target = f.kind === "full" ? m.exam.qe.totalItems : f.kind === "mini100" ? 100 : 50;
          return (
            <Card key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{f.name}</h2>
                <Badge tone={f.itemIds.length >= target ? "ok" : "warn"}>
                  {f.itemIds.length} / {target} items
                </Badge>
              </div>
              {f.shortfall.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer">Shortfall in {f.shortfall.length} domain(s)</summary>
                  <ul className="muted mt-2 list-disc pl-5">
                    {f.shortfall.map((s) => (
                      <li key={s.domainId}>
                        {domainName.get(s.domainId) ?? s.domainId}: {s.available} of {s.target}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <Button className="mt-4" disabled={f.itemIds.length === 0} onClick={() => start(f)}>
                Start
              </Button>
            </Card>
          );
        })}
      </div>
      {(past.data ?? []).length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">Your attempts</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {(past.data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {s.title} · {new Date(s.createdAt).toLocaleString()}
                </span>
                {s.finishedAt ? (
                  <LinkButton variant="ghost" href={`/app/simulator/results/?id=${s.id}`}>
                    Results
                  </LinkButton>
                ) : (
                  <LinkButton variant="ghost" href={`/app/simulator/run/?id=${s.id}`}>
                    Resume
                  </LinkButton>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function SimulatorPage() {
  return <ContentGate>{(m) => <Simulator m={m} />}</ContentGate>;
}
