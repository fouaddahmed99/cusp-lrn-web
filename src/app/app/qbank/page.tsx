"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { progress } from "@/adapters/progress";
import { ContentGate } from "@/components/content-gate";
import { useStudyData } from "@/components/study-data";
import { Button, Card, EmptyState, Field, PageTitle, Spinner, inputClass } from "@/components/ui";
import type { PublicManifest } from "@/contract";
import { summarize, weakDomains } from "@/lib/analytics";
import { emptyFilters, filterStubs, pickItems, type QbankFilters } from "@/lib/select";
import type { Mode } from "@/lib/types";
import { uid } from "@/lib/util";

const LEVELS = [
  ["remember", "Remember"],
  ["understand_apply", "Understand / Apply"],
  ["analyze_evaluate", "Analyze / Evaluate"],
] as const;
const TYPES = [
  ["mcq", "Single best answer"],
  ["vignette_mcq", "Clinical vignette"],
  ["image_mcq", "Image-based"],
] as const;

function Checks({ legend, options, value, onChange }: { legend: string; options: readonly (readonly [string, string])[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => {
          const on = value.includes(id);
          return (
            <label key={id} className={`surface flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ${on ? "border-[var(--brand)] bg-[var(--surface-2)]" : ""}`}>
              <input type="checkbox" className="accent-[var(--brand)]" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== id) : [...value, id])} />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Builder({ m }: { m: PublicManifest }) {
  const router = useRouter();
  const params = useSearchParams();
  const data = useStudyData();
  const [f, setF] = useState<QbankFilters>(emptyFilters);
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<Mode>("tutor");

  useEffect(() => {
    const d = params.get("domain");
    const c = params.get("count");
    if (d) setF((x) => ({ ...x, domainIds: d.split(",") }));
    if (c) setCount(Number(c));
  }, [params]);
  useEffect(() => {
    if (params.get("weak") === "1" && data.data) {
      const weak = weakDomains(summarize(data.data.attempts));
      if (weak.length) setF((x) => ({ ...x, domainIds: weak, status: "all" }));
    }
  }, [params, data.data]);

  const matches = useMemo(() => (data.data ? filterStubs(data.data.stubs, f, data.data.attempts, data.data.marks) : []), [data.data, f]);
  if (data.loading || !data.data) return <Spinner />;
  const subtopics = m.subtopics.filter((s) => f.domainIds.length === 0 || f.domainIds.includes(s.domainId));
  const tasks = m.taskStatements.filter((t) => f.domainIds.length === 0 || f.domainIds.includes(t.domainId));

  const start = async () => {
    const itemIds = pickItems(matches, count);
    const now = new Date().toISOString();
    const id = uid("qb");
    await progress.saveSession({ id, kind: "qbank", mode, itemIds, answers: {}, submitted: {}, timeMs: {}, flags: [], index: 0, createdAt: now, startedAt: now, elapsedSec: 0, title: `${itemIds.length} questions · ${mode === "tutor" ? "Tutor" : "Timed"}`, ...(mode === "timed" ? { timeLimitSec: itemIds.length * 60 } : {}) });
    router.push(`/app/qbank/session/?id=${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Question bank" subtitle="Build a session. Explanations show every citation with a link to the public source." />
      {data.data.stubs.length === 0 ? (
        <EmptyState title="No questions published yet" />
      ) : (
        <Card className="flex flex-col gap-5">
          <Checks legend="Domains" options={m.domains.map((d) => [d.id, d.name] as const)} value={f.domainIds} onChange={(domainIds) => setF({ ...f, domainIds, subtopicIds: [], taskStatementIds: [] })} />
          {subtopics.length > 0 && <Checks legend="Subtopics" options={subtopics.map((s) => [s.id, s.name] as const)} value={f.subtopicIds} onChange={(subtopicIds) => setF({ ...f, subtopicIds })} />}
          {tasks.length > 0 && <Checks legend="ABPD task statements" options={tasks.map((t) => [t.id, t.text] as const)} value={f.taskStatementIds} onChange={(taskStatementIds) => setF({ ...f, taskStatementIds })} />}
          <Checks legend="Cognitive level" options={LEVELS} value={f.cognitiveLevels} onChange={(cognitiveLevels) => setF({ ...f, cognitiveLevels })} />
          <Checks legend="Item type" options={TYPES} value={f.types} onChange={(types) => setF({ ...f, types })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="status" label="Questions">
              <select id="status" className={inputClass} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as QbankFilters["status"] })}>
                <option value="all">All</option>
                <option value="unused">Unused</option>
                <option value="incorrect">Incorrect</option>
                <option value="marked">Flagged</option>
              </select>
            </Field>
            <Field id="mode" label="Mode" hint={mode === "timed" ? "1 minute per question, review at the end" : "See the explanation after each question"}>
              <select id="mode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                <option value="tutor">Tutor</option>
                <option value="timed">Timed</option>
              </select>
            </Field>
            <Field id="count" label="Number of questions">
              <input id="count" type="number" min={1} max={200} className={inputClass} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t line pt-4">
            <p className="text-sm" aria-live="polite">
              <strong>{matches.length}</strong> matching question{matches.length === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setF(emptyFilters())}>
                Clear filters
              </Button>
              <Button onClick={start} disabled={matches.length === 0}>
                Start {Math.min(count, matches.length)} question{Math.min(count, matches.length) === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function QbankPage() {
  return (
    <ContentGate>
      {(m) => (
        <Suspense fallback={<Spinner />}>
          <Builder m={m} />
        </Suspense>
      )}
    </ContentGate>
  );
}
