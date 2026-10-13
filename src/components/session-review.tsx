"use client";
import { useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { feedbackConfigured, feedbackUrl } from "@/adapters/feedback";
import type { PublicAnswer, PublicManifest, PublicQuestion, PublicSource } from "@/contract";
import { summarize } from "@/lib/analytics";
import { downloadBlob } from "@/lib/csv";
import type { Attempt, Session } from "@/lib/types";
import { formatDuration, pct } from "@/lib/util";
import { useAsync, useSources } from "./hooks";
import { QuestionView, isMcqQuestion } from "./question";
import { Badge, Button, Card, EmptyState, LinkButton, Notice, PageTitle, Spinner, Stat } from "./ui";

type McqAnswer = Extract<PublicAnswer, { type: "mcq" | "vignette_mcq" | "image_mcq" }>;

/** Opt-in score card image: totals and domain scores only, no question content. */
async function scoreCard(title: string, total: number, correct: number, byDomain: { name: string; pct: number }[]) {
  const c = document.createElement("canvas");
  c.width = 1000;
  c.height = 260 + byDomain.length * 44;
  const g = c.getContext("2d");
  if (!g) return;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#1f5f8b";
  g.font = "bold 40px system-ui, sans-serif";
  g.fillText("CUSP LRN", 50, 80);
  g.fillStyle = "#17202a";
  g.font = "28px system-ui, sans-serif";
  g.fillText(title, 50, 130);
  g.font = "bold 56px system-ui, sans-serif";
  g.fillText(`${pct(correct, total)}%  (${correct}/${total})`, 50, 205);
  g.font = "24px system-ui, sans-serif";
  byDomain.forEach((d, i) => {
    const y = 260 + i * 44;
    g.fillStyle = "#5b6573";
    g.fillText(d.name.slice(0, 48), 50, y);
    g.fillStyle = "#e6ebf0";
    g.fillRect(640, y - 22, 300, 24);
    g.fillStyle = "#2f8f6b";
    g.fillRect(640, y - 22, 3 * d.pct, 24);
  });
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (blob) downloadBlob(blob, "cusp-lrn-score.png");
}

function ItemReview({ id, i, attempt, sources }: { id: string; i: number; attempt?: Attempt; sources: Map<string, PublicSource> }) {
  const [open, setOpen] = useState(false);
  const data = useAsync<{ q: PublicQuestion; a: McqAnswer | null } | null>(async () => {
    if (!open) return null;
    const [q, a] = await Promise.all([content.getQuestion(id), content.getAnswer(id)]);
    return { q, a: "key" in a ? a : null };
  }, [open]);
  return (
    <li className="surface rounded-lg">
      <button type="button" className="flex w-full items-center justify-between gap-3 p-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="text-sm font-medium">Question {i + 1}</span>
        <span className="flex items-center gap-2 text-xs">
          {attempt ? attempt.correct ? <Badge tone="ok">Correct</Badge> : attempt.selected ? <Badge tone="bad">Incorrect</Badge> : <Badge>Unanswered</Badge> : <Badge>Not scored</Badge>}
          {attempt && <span className="muted">{formatDuration(attempt.timeMs / 1000)}</span>}
        </span>
      </button>
      {open && (
        <div className="border-t line p-4">
          {!data.data ? <Spinner /> : isMcqQuestion(data.data.q) ? <QuestionView q={data.data.q} selected={attempt?.selected ?? null} onSelect={() => undefined} answer={data.data.a} sources={sources} locked /> : null}
        </div>
      )}
    </li>
  );
}

export function SessionReview({ sessionId, manifest }: { sessionId: string; manifest: PublicManifest }) {
  const sources = useSources();
  const data = useAsync(async () => {
    const s = await progress.session(sessionId);
    const attempts = await progress.attemptsForSession(sessionId);
    return { s, attempts };
  }, [sessionId]);
  if (data.loading || sources.loading) return <Spinner />;
  const s: Session | undefined = data.data?.s;
  if (!s) return <EmptyState title="Session not found" />;
  const attempts = data.data?.attempts ?? [];
  const byItem = new Map(attempts.map((a) => [a.itemId, a]));
  const sum = summarize(attempts);
  const domainName = new Map(manifest.domains.map((d) => [d.id, d.name]));
  const isSim = s.kind === "sim";
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={isSim ? "Exam results" : "Session review"} subtitle={s.title} actions={<LinkButton href={isSim ? "/app/simulator/" : "/app/qbank/"} variant="secondary">New {isSim ? "exam" : "session"}</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Score" value={`${sum.pct}%`} hint={`${sum.correct} of ${s.itemIds.length}`} />
        <Stat label="Answered" value={`${sum.answered ? attempts.filter((a) => a.selected).length : 0}/${s.itemIds.length}`} />
        <Stat label="Avg time / item" value={formatDuration(sum.avgTimeSec)} />
        <Stat label="Total time" value={formatDuration(s.elapsedSec)} />
      </div>
      {sum.byDomain.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">By domain</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="muted text-left">
                <th className="py-1 font-medium">Domain</th>
                <th className="py-1 font-medium">Score</th>
                <th className="py-1 font-medium">Avg time</th>
              </tr>
            </thead>
            <tbody>
              {sum.byDomain.map((b) => (
                <tr key={b.key} className="border-t line">
                  <td className="py-2">{domainName.get(b.key) ?? b.key}</td>
                  <td className="py-2">
                    {b.pct}% <span className="muted">({b.correct}/{b.answered})</span>
                  </td>
                  <td className="py-2">{formatDuration(b.avgTimeSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted mt-3 text-xs">Percentiles are not available in the free edition: they need aggregated data from a server, and your answers never leave your device.</p>
        </Card>
      )}
      {isSim && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => scoreCard(s.title, s.itemIds.length, sum.correct, sum.byDomain.map((b) => ({ name: domainName.get(b.key) ?? b.key, pct: b.pct })))}>
            Download shareable score card
          </Button>
          {feedbackConfigured && (
            <a className="inline-flex min-h-10 items-center rounded-lg px-4 py-2 text-sm" href={feedbackUrl("survey")} target="_blank" rel="noopener noreferrer">
              After your real exam: tell us if you passed ↗
            </a>
          )}
        </div>
      )}
      {isSim && <Notice>The score card shows only your totals and domain scores, never question content. Sharing it is up to you.</Notice>}
      <section>
        <h2 className="mb-3 font-semibold">Review every question</h2>
        <ol className="flex flex-col gap-2">
          {s.itemIds.map((id, i) => (
            <ItemReview key={id} id={id} i={i} attempt={byItem.get(id)} sources={sources.data ?? new Map()} />
          ))}
        </ol>
      </section>
    </div>
  );
}
