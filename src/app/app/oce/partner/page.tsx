"use client";
import { useEffect, useState } from "react";
import { content } from "@/adapters/content";
import { SentenceList } from "@/components/citations";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useSources } from "@/components/hooks";
import { Button, Card, EmptyState, Notice, PageTitle, Spinner } from "@/components/ui";

/** Examiner view for a study partner (Part J6). The link's #fragment holds only the case id; no server is involved. */
function Examiner() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setId(new URLSearchParams(window.location.hash.slice(1)).get("v"));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const sources = useSources();
  const data = useAsync(async () => (id ? Promise.all([content.getQuestion(id), content.getAnswer(id)]) : null), [id]);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  if (id === null) return <EmptyState title="Open the examiner link your partner shared" />;
  if (data.loading || sources.loading) return <Spinner />;
  const [q, a] = data.data ?? [];
  if (!q || !a || q.type !== "oce_vignette" || a.type !== "oce_vignette" || !sources.data) return <EmptyState title="Case not found" />;
  const p = a.prompts[step];
  return (
    <div className="flex flex-col gap-4">
      <PageTitle title="Examiner view" subtitle={`Question ${step + 1} of ${q.questions.length}`} />
      <Notice>Read the case aloud, then ask each question in order. Keep the model answer to yourself until your partner has answered. Scores are kept only on this screen.</Notice>
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Case to read</h2>
        <p className="leading-relaxed">{q.presentation}</p>
      </Card>
      <Card>
        <p className="text-lg font-medium">Ask: {q.questions[step]}</p>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Model answer and rubric</summary>
          <div className="mt-3 flex flex-col gap-3">
            <SentenceList sentences={p?.modelAnswer ?? []} sources={sources.data} />
            <ul className="muted list-disc pl-5 text-sm">
              {(p?.score2Gaps ?? []).map((g, i) => (
                <li key={i}>Score-2 gap: {g}</li>
              ))}
            </ul>
          </div>
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["3", "2", "1"] as const).map((k) => (
            <Button key={k} variant={scores[step] === Number(k) ? "primary" : "secondary"} onClick={() => setScores({ ...scores, [step]: Number(k) })} title={p?.rubric[k]}>
              Score {k}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t line pt-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Previous
          </Button>
          {step < q.questions.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Next question →</Button>
          ) : (
            <p className="text-sm font-semibold">
              Total: {Object.values(scores).reduce((s, x) => s + x, 0)} / {q.questions.length * 3}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function PartnerPage() {
  return <ContentGate>{() => <Examiner />}</ContentGate>;
}
