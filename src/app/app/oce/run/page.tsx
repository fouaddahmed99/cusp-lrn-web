"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { SentenceList } from "@/components/citations";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useSources } from "@/components/hooks";
import { ReportError } from "@/components/report";
import { Badge, Button, Card, EmptyState, LinkButton, PageTitle, Spinner, inputClass } from "@/components/ui";
import type { PublicAnswer, PublicQuestion } from "@/contract";
import { BASE_PATH } from "@/lib/base";
import type { OceAttempt } from "@/lib/types";
import { formatDuration, uid } from "@/lib/util";

type OceQ = Extract<PublicQuestion, { type: "oce_vignette" }>;
type OceA = Extract<PublicAnswer, { type: "oce_vignette" }>;

function Recorder({ onClip }: { onClip: (url: string) => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [err, setErr] = useState("");
  const chunks = useRef<Blob[]>([]);
  if (typeof window !== "undefined" && !("MediaRecorder" in window)) return null;
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onClip(URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType })));
      };
      r.start();
      setRec(r);
    } catch {
      setErr("Microphone not available. You can type your answer instead.");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {rec ? (
        <Button variant="danger" onClick={() => { rec.stop(); setRec(null); }}>
          ■ Stop recording
        </Button>
      ) : (
        <Button variant="secondary" onClick={start}>
          ● Record spoken answer
        </Button>
      )}
      <span className="muted text-xs">{err || "Recordings stay on this device."}</span>
    </div>
  );
}

function Player() {
  const id = useSearchParams().get("id") ?? "";
  const sources = useSources();
  const q = useAsync(() => content.getQuestion(id), [id]);
  const [a, setA] = useState<OceA | null>(null);
  const [attempt, setAttempt] = useState<OceAttempt | null>(null);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clips, setClips] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);

  const oq = q.data?.type === "oce_vignette" ? (q.data as OceQ) : null;
  useEffect(() => {
    if (!oq) return;
    const now = new Date().toISOString();
    setAttempt({ id: uid("oce"), vignetteId: oq.id, startedAt: now, answers: oq.questions.map(() => ({ text: "", selfScore: null })) });
  }, [oq]);
  useEffect(() => {
    if (attempt?.finishedAt) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [attempt?.finishedAt]);

  if (q.loading || sources.loading) return <Spinner />;
  if (!oq || !attempt || !sources.data) return <EmptyState title="Case not found" />;
  const total = oq.questions.length;
  const ans = attempt.answers[step] ?? { text: "", selfScore: null };
  const setAns = (patch: Partial<typeof ans>) => setAttempt({ ...attempt, answers: attempt.answers.map((x, i) => (i === step ? { ...x, ...patch } : x)) });
  const reveal = async () => {
    if (!a) {
      const res = await content.getAnswer(oq.id); // only after the user has answered
      if (res.type === "oce_vignette") setA(res);
    }
    setRevealed(true);
  };
  const next = async () => {
    if (step < total - 1) {
      setStep(step + 1);
      setRevealed(false);
    } else {
      const done = { ...attempt, finishedAt: new Date().toISOString() };
      setAttempt(done);
      await progress.saveOce(done);
    }
  };
  const partnerLink = typeof window !== "undefined" ? `${window.location.origin}${BASE_PATH}/app/oce/partner/#v=${oq.id}` : "";
  const remaining = oq.timeLimitSec - elapsed;

  if (attempt.finishedAt) {
    const score = attempt.answers.reduce((s, x) => s + (x.selfScore ?? 0), 0);
    return (
      <div className="flex flex-col gap-4">
        <PageTitle title="Case complete" subtitle={`Self-score ${score} / ${total * 3} · ${formatDuration(elapsed)}`} actions={<LinkButton href="/app/oce/" variant="secondary">All cases</LinkButton>} />
        <Card>
          <ol className="flex flex-col gap-2 text-sm">
            {oq.questions.map((qq, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {i + 1}. {qq}
                </span>
                <span className="flex items-center gap-2">
                  {clips[i] && (
                    <a href={clips[i]} download={`oce-answer-${i + 1}.webm`} className="text-xs">
                      Download recording
                    </a>
                  )}
                  <Badge tone={attempt.answers[i]?.selfScore === 3 ? "ok" : attempt.answers[i]?.selfScore === 1 ? "bad" : "neutral"}>{attempt.answers[i]?.selfScore ?? "–"}</Badge>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        title={`OCE case · question ${step + 1} of ${total}`}
        subtitle={<span className={remaining < 60 ? "text-[var(--color-bad)]" : ""}>⏱ {remaining >= 0 ? `${formatDuration(remaining)} left` : `${formatDuration(-remaining)} over`}</span>}
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(partnerLink);
              setCopied(true);
            }}
          >
            {copied ? "✓ Examiner link copied" : "Copy examiner link for a partner"}
          </Button>
        }
      />
      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Case</h2>
        <p className="leading-relaxed">{oq.presentation}</p>
      </Card>
      <Card>
        <p className="text-lg font-medium">{oq.questions[step]}</p>
        <label htmlFor="ans" className="mt-4 block text-sm font-medium">
          Your answer
        </label>
        <textarea id="ans" className={`${inputClass} mt-1 w-full`} rows={4} value={ans.text} onChange={(e) => setAns({ text: e.target.value })} disabled={revealed} />
        <div className="mt-3">
          <Recorder onClip={(url) => setClips({ ...clips, [step]: url })} />
          {clips[step] && <audio controls src={clips[step]} className="mt-2 w-full" />}
        </div>
        {!revealed ? (
          <Button className="mt-4" onClick={reveal}>
            Show model answer
          </Button>
        ) : (
          a && (
            <div className="mt-5 flex flex-col gap-4 border-t line pt-4">
              <section>
                <h3 className="mb-2 font-semibold">Model answer (score 3)</h3>
                <SentenceList sentences={a.prompts[step]?.modelAnswer ?? []} sources={sources.data} />
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Typical gaps in a score-2 answer</h3>
                <ul className="muted list-disc pl-5 text-sm">
                  {(a.prompts[step]?.score2Gaps ?? []).map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </section>
              <fieldset>
                <legend className="mb-2 font-semibold">Score yourself</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["3", "2", "1"] as const).map((k) => (
                    <label key={k} className={`surface cursor-pointer rounded-lg border-2 p-3 text-sm ${ans.selfScore === Number(k) ? "border-[var(--brand)]" : ""}`}>
                      <input type="radio" name="score" className="mr-2 accent-[var(--brand)]" checked={ans.selfScore === Number(k)} onChange={() => setAns({ selfScore: Number(k) as 1 | 2 | 3 })} />
                      <strong>{k}</strong> — {a.prompts[step]?.rubric[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ReportError itemId={oq.id} version={oq.version} where="OCE" />
                <Button onClick={next} disabled={ans.selfScore === null}>
                  {step < total - 1 ? "Next question →" : "Finish case"}
                </Button>
              </div>
            </div>
          )
        )}
      </Card>
    </div>
  );
}

export default function OceRunPage() {
  return <ContentGate>{() => <Suspense fallback={<Spinner />}><Player /></Suspense>}</ContentGate>;
}
