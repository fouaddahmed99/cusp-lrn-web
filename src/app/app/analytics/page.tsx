"use client";
import { ContentGate } from "@/components/content-gate";
import { useStudyData } from "@/components/study-data";
import { Card, EmptyState, LinkButton, Notice, PageTitle, Spinner, Stat } from "@/components/ui";
import type { PublicManifest } from "@/contract";
import { summarize, weakDomains, type Bucket } from "@/lib/analytics";
import { formatDuration } from "@/lib/util";

function Table({ title, rows, name }: { title: string; rows: Bucket[]; name: (k: string) => string }) {
  if (!rows.length) return null;
  return (
    <Card>
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="muted text-left">
              <th className="py-1 font-medium">Area</th>
              <th className="py-1 font-medium">Answered</th>
              <th className="py-1 font-medium">Accuracy</th>
              <th className="py-1 font-medium">Avg time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.key} className="border-t line">
                <td className="py-2 pr-2">{name(b.key)}</td>
                <td className="py-2">{b.answered}</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="inline-block h-2 w-20 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <span className="block h-full bg-[var(--brand)]" style={{ width: `${b.pct}%` }} />
                    </span>
                    {b.pct}%
                  </span>
                </td>
                <td className="py-2">{formatDuration(b.avgTimeSec)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Trend({ days }: { days: Bucket[] }) {
  const last = days.slice(-30);
  if (last.length < 2) return null;
  const w = 600;
  const h = 120;
  const pts = last.map((d, i) => `${(i / (last.length - 1)) * w},${h - (d.pct / 100) * h}`).join(" ");
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Accuracy trend (last {last.length} study days)</h2>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-label={`Daily accuracy from ${last[0]?.pct}% to ${last.at(-1)?.pct}%`}>
        <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="muted mt-1 text-xs">
        {last[0]?.key} → {last.at(-1)?.key}
      </p>
    </Card>
  );
}

function Analytics({ m }: { m: PublicManifest }) {
  const data = useStudyData();
  if (data.loading || !data.data) return <Spinner />;
  const s = summarize(data.data.attempts);
  const names = new Map<string, string>([...m.domains.map((d) => [d.id, d.name] as const), ...m.subtopics.map((x) => [x.id, x.name] as const), ...m.taskStatements.map((t) => [t.id, t.text] as const)]);
  const levelNames: Record<string, string> = { remember: "Remember", understand_apply: "Understand / Apply", analyze_evaluate: "Analyze / Evaluate" };
  const name = (k: string) => names.get(k) ?? levelNames[k] ?? k;
  const weak = weakDomains(s);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Analytics" subtitle="Computed on this device from your own answers." actions={weak.length ? <LinkButton href="/app/qbank/?weak=1">Weak-areas quiz</LinkButton> : undefined} />
      {s.answered === 0 ? (
        <EmptyState title="No answers yet">Answer some questions and your analytics will appear here.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Answered" value={s.answered} />
            <Stat label="Accuracy" value={`${s.pct}%`} />
            <Stat label="Avg time / item" value={formatDuration(s.avgTimeSec)} hint="QE pace is about 1:00" />
            <Stat label="Weakest domain" value={weak[0] ? name(weak[0]) : "—"} />
          </div>
          <Trend days={s.byDay} />
          <Table title="By domain" rows={s.byDomain} name={name} />
          <Table title="By subtopic" rows={s.bySubtopic} name={name} />
          <Table title="By ABPD task statement" rows={s.byTask} name={name} />
          <Table title="By cognitive level" rows={s.byLevel} name={name} />
        </>
      )}
      <Notice>Percentiles are disabled in the free edition. They need aggregated data from a server, and your answers never leave your device.</Notice>
    </div>
  );
}

export default function AnalyticsPage() {
  return <ContentGate>{(m) => <Analytics m={m} />}</ContentGate>;
}
