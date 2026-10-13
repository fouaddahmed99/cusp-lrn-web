"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import type { PublicAnswer, PublicQuestion } from "@/contract";
import { newCard } from "@/lib/srs";
import type { Mark, Session } from "@/lib/types";
import { formatDuration, type OptionId } from "@/lib/util";
import { useSources } from "./hooks";
import { QuestionView, isMcqQuestion } from "./question";
import { Badge, Button, Card, EmptyState, ProgressBar, Spinner, inputClass } from "./ui";

type McqAnswer = Extract<PublicAnswer, { type: "mcq" | "vignette_mcq" | "image_mcq" }>;

/** Record attempts for every answered item in a finished timed session / exam. Answers are fetched only now. */
async function scoreSession(s: Session) {
  for (const id of s.itemIds) {
    const [q, a] = await Promise.all([content.getQuestion(id), content.getAnswer(id)]);
    if (!("key" in a)) continue;
    const selected = s.answers[id] ?? null;
    await progress.addAttempt({ itemId: id, version: q.version, sessionId: s.id, kind: s.kind, selected, correct: selected === a.key, timeMs: s.timeMs[id] ?? 0, at: new Date().toISOString(), domainId: q.tags.domainId, subtopicId: q.tags.subtopicId, taskStatementId: q.tags.taskStatementId, cognitiveLevel: q.tags.cognitiveLevel });
  }
}

export function SessionPlayer({ sessionId, reviewHref }: { sessionId: string; reviewHref: string }) {
  const router = useRouter();
  const sources = useSources();
  const [s, setS] = useState<Session | null | undefined>(undefined);
  const [q, setQ] = useState<PublicQuestion | null>(null);
  const [answer, setAnswer] = useState<McqAnswer | null>(null);
  const [mark, setMark] = useState<Mark | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [carded, setCarded] = useState(false);
  const shownAt = useRef(Date.now());
  const sRef = useRef<Session | null>(null);
  sRef.current = s ?? null;

  useEffect(() => {
    progress.session(sessionId).then((x) => setS(x ?? null));
  }, [sessionId]);

  const currentId = s ? s.itemIds[s.index] : undefined;
  const tutor = s?.mode === "tutor";

  // Load the current question; in tutor mode, reveal the answer if already submitted.
  useEffect(() => {
    if (!currentId || !s) return;
    let alive = true;
    setQ(null);
    setAnswer(null);
    setCarded(false);
    shownAt.current = Date.now();
    content.getQuestion(currentId).then((x) => alive && setQ(x));
    progress.mark(currentId).then((m) => alive && setMark(m ?? { itemId: currentId, flagged: false, note: "", updatedAt: "" }));
    if (tutor && s.submitted[currentId]) content.getAnswer(currentId).then((a) => alive && "key" in a && setAnswer(a));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const persist = useCallback(async (next: Session) => {
    setS(next);
    await progress.saveSession(next);
  }, []);

  /** Add the time spent on the current item to the session. */
  const withTime = useCallback((cur: Session): Session => {
    const id = cur.itemIds[cur.index];
    if (!id) return cur;
    const spent = Date.now() - shownAt.current;
    shownAt.current = Date.now();
    return { ...cur, timeMs: { ...cur.timeMs, [id]: (cur.timeMs[id] ?? 0) + spent } };
  }, []);

  const finish = useCallback(async () => {
    const cur = sRef.current;
    if (!cur || cur.finishedAt) return;
    const done = { ...withTime(cur), finishedAt: new Date().toISOString() };
    await persist(done);
    if (done.mode !== "tutor") await scoreSession(done);
    router.push(reviewHref);
  }, [persist, reviewHref, router, withTime]);

  // Session clock (timed modes and the simulator).
  useEffect(() => {
    if (!s || s.finishedAt) return;
    const t = setInterval(() => {
      const cur = sRef.current;
      if (!cur || cur.finishedAt) return;
      const next = { ...cur, elapsedSec: cur.elapsedSec + 1 };
      setS(next);
      if (next.elapsedSec % 5 === 0) void progress.saveSession(next);
      if (next.timeLimitSec && next.elapsedSec >= next.timeLimitSec) void finish();
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id, s?.finishedAt]);

  if (s === undefined || sources.loading) return <Spinner />;
  if (s === null) return <EmptyState title="Session not found">It may have been deleted, or it was created on another device.</EmptyState>;
  if (s.finishedAt) {
    return (
      <EmptyState title="This session is finished">
        <Button className="mt-3" onClick={() => router.push(reviewHref)}>
          See results
        </Button>
      </EmptyState>
    );
  }
  const total = s.itemIds.length;
  const id = currentId as string;
  const selected = s.answers[id] ?? null;
  const submitted = !!s.submitted[id];
  const flagged = s.flags.includes(id);
  const answeredCount = Object.values(s.answers).filter(Boolean).length;
  const remaining = s.timeLimitSec ? s.timeLimitSec - s.elapsedSec : undefined;

  const go = (index: number) => persist({ ...withTime(s), index: Math.max(0, Math.min(total - 1, index)) });
  const select = (o: OptionId) => !submitted && persist({ ...s, answers: { ...s.answers, [id]: o } });
  const toggleFlag = async () => {
    await persist({ ...s, flags: flagged ? s.flags.filter((f) => f !== id) : [...s.flags, id] });
    if (mark) {
      const m = { ...mark, flagged: !flagged, updatedAt: new Date().toISOString() };
      setMark(m);
      await progress.saveMark(m);
    }
  };
  const submitTutor = async () => {
    if (!q || !selected) return;
    const next = withTime({ ...s, submitted: { ...s.submitted, [id]: true } });
    await persist(next);
    const a = await content.getAnswer(id); // fetched only after the answer is submitted
    if (!("key" in a)) return;
    setAnswer(a);
    await progress.addAttempt({ itemId: id, version: q.version, sessionId: s.id, kind: s.kind, selected, correct: selected === a.key, timeMs: next.timeMs[id] ?? 0, at: new Date().toISOString(), domainId: q.tags.domainId, subtopicId: q.tags.subtopicId, taskStatementId: q.tags.taskStatementId, cognitiveLevel: q.tags.cognitiveLevel });
  };
  const addCard = async () => {
    const existing = await progress.card(`missed:${id}`);
    if (!existing) await progress.saveCard(newCard(id, "missed"));
    setCarded(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="surface sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">
            {s.index + 1} / {total}
          </span>
          <span className="muted">{answeredCount} answered</span>
          {flagged && <Badge tone="warn">Flagged</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {remaining !== undefined ? (
            <span aria-live="off" className={`font-mono ${remaining < 300 ? "text-[var(--color-bad)]" : ""}`} aria-label="Time remaining">
              ⏱ {formatDuration(remaining)}
            </span>
          ) : (
            <span className="muted font-mono">⏱ {formatDuration(s.elapsedSec)}</span>
          )}
          <Button variant="secondary" onClick={() => setConfirmEnd(true)}>
            {s.kind === "sim" ? "End exam" : "Finish"}
          </Button>
        </div>
        <div className="w-full">
          <ProgressBar value={(100 * (s.index + 1)) / total} label="Position in session" />
        </div>
      </div>

      {confirmEnd && (
        <Card className="border-2 border-[var(--color-warn)]">
          <p className="font-semibold">{s.kind === "sim" ? "End the exam now?" : "Finish this session?"}</p>
          <p className="muted mt-1 text-sm">
            {total - answeredCount} unanswered · {s.flags.length} flagged. {s.mode === "tutor" ? "" : "Answers are scored when you finish."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void finish()}>Yes, finish</Button>
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>
              Keep going
            </Button>
          </div>
        </Card>
      )}

      <Card>
        {!q || !sources.data ? (
          <Spinner label="Loading question…" />
        ) : !isMcqQuestion(q) ? (
          <p>Unsupported item type.</p>
        ) : (
          <QuestionView q={q} selected={selected} onSelect={select} answer={tutor ? answer : null} sources={sources.data} locked={submitted} />
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t line pt-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={toggleFlag} aria-pressed={flagged}>
              {flagged ? "⚑ Unflag" : "⚐ Flag"}
            </Button>
            <Button variant="ghost" onClick={() => setNoteOpen((x) => !x)} aria-expanded={noteOpen}>
              ✎ Note
            </Button>
            {tutor && answer && selected !== answer.key && (
              <Button variant="ghost" onClick={addCard} disabled={carded}>
                {carded ? "✓ Added to flashcards" : "+ Make a flashcard"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => go(s.index - 1)} disabled={s.index === 0}>
              ← Previous
            </Button>
            {tutor && !submitted ? (
              <Button onClick={submitTutor} disabled={!selected}>
                Submit answer
              </Button>
            ) : s.index < total - 1 ? (
              <Button onClick={() => go(s.index + 1)}>Next →</Button>
            ) : (
              <Button onClick={() => setConfirmEnd(true)}>Finish</Button>
            )}
          </div>
        </div>
        {noteOpen && mark && (
          <div className="mt-3">
            <label htmlFor="note" className="text-sm font-medium">
              Private note (saved on this device)
            </label>
            <textarea
              id="note"
              className={`${inputClass} mt-1 w-full`}
              rows={3}
              value={mark.note}
              onChange={(e) => setMark({ ...mark, note: e.target.value })}
              onBlur={() => progress.saveMark({ ...mark, updatedAt: new Date().toISOString() })}
            />
          </div>
        )}
      </Card>

      <details className="surface rounded-xl p-4" open={s.kind === "sim"}>
        <summary className="cursor-pointer text-sm font-semibold">Navigator</summary>
        <ol className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-12 md:grid-cols-16" aria-label="Question navigator">
          {s.itemIds.map((iid, i) => {
            const isCur = i === s.index;
            const ans = !!s.answers[iid];
            const fl = s.flags.includes(iid);
            return (
              <li key={iid}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={isCur ? "step" : undefined}
                  aria-label={`Question ${i + 1}${ans ? ", answered" : ", unanswered"}${fl ? ", flagged" : ""}`}
                  className={`h-9 w-full rounded-md border text-xs font-medium ${isCur ? "border-[var(--brand)] ring-2 ring-[var(--brand)]" : "line"} ${ans ? "bg-[var(--surface-2)]" : ""} ${fl ? "text-[var(--color-warn)]" : ""}`}
                >
                  {i + 1}
                  {fl ? "⚑" : ""}
                </button>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}
