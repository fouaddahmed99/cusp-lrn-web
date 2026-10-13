"use client";
import { useState } from "react";
import type { PublicAnswer, PublicQuestion, PublicSource } from "@/contract";
import { asset } from "@/lib/base";
import type { OptionId } from "@/lib/util";
import { LastVerified, SentenceList } from "./citations";
import { ReportError } from "./report";
import { Badge } from "./ui";

type McqQuestion = Extract<PublicQuestion, { type: "mcq" | "vignette_mcq" | "image_mcq" }>;
type McqAnswer = Extract<PublicAnswer, { type: "mcq" | "vignette_mcq" | "image_mcq" }>;

export function isMcqQuestion(q: PublicQuestion): q is McqQuestion {
  return q.type === "mcq" || q.type === "vignette_mcq" || q.type === "image_mcq";
}

function ZoomImage({ src, alt, caption, attribution }: { src: string; alt: string; caption?: string; attribution?: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <figure className="my-3">
      <button type="button" onClick={() => setZoom(true)} className="block rounded-lg" aria-label={`Zoom image: ${alt}`}>
        <img src={asset(`/content/${src}`)} alt={alt} className="max-h-80 rounded-lg border line" />
      </button>
      {(caption || attribution) && <figcaption className="muted mt-1 text-xs">{[caption, attribution].filter(Boolean).join(" — ")}</figcaption>}
      {zoom && (
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(false)} onKeyDown={(e) => e.key === "Escape" && setZoom(false)}>
          <img src={asset(`/content/${src}`)} alt={alt} className="max-h-full max-w-full rounded-lg bg-white" />
          <button type="button" autoFocus className="absolute right-4 top-4 rounded-md bg-white px-3 py-2 text-black" onClick={() => setZoom(false)}>
            Close
          </button>
        </div>
      )}
    </figure>
  );
}

export function QuestionView({
  q,
  selected,
  onSelect,
  answer,
  sources,
  locked,
}: {
  q: McqQuestion;
  selected: OptionId | null;
  onSelect: (o: OptionId) => void;
  /** Present only after submission. */
  answer: McqAnswer | null;
  sources: Map<string, PublicSource>;
  locked: boolean;
}) {
  const name = `q-${q.id}`;
  return (
    <div>
      {q.vignette && <p className="surface mb-4 rounded-lg p-4 leading-relaxed">{q.vignette}</p>}
      {q.media?.map((m, i) => <ZoomImage key={i} {...m} />)}
      <fieldset>
        <legend className="mb-4 text-lg font-medium leading-relaxed">{q.stem}</legend>
        <div className="flex flex-col gap-2">
          {q.options.map((o) => {
            const isSel = selected === o.id;
            const isKey = answer?.key === o.id;
            const state = answer ? (isKey ? "border-[var(--color-ok)] bg-[color-mix(in_srgb,var(--color-ok)_10%,transparent)]" : isSel ? "border-[var(--color-bad)] bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)]" : "") : isSel ? "border-[var(--brand)] bg-[var(--surface-2)]" : "";
            return (
              <label key={o.id} className={`surface flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 ${state} ${locked ? "cursor-default" : "hover:bg-[var(--surface-2)]"}`}>
                <input type="radio" name={name} value={o.id} checked={isSel} disabled={locked} onChange={() => onSelect(o.id)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
                <span className="font-semibold">{o.id}.</span>
                <span className="flex-1">{o.text}</span>
                {answer && isKey && <Badge tone="ok">Correct answer</Badge>}
                {answer && isSel && !isKey && <Badge tone="bad">Your answer</Badge>}
              </label>
            );
          })}
        </div>
      </fieldset>
      {answer && (
        <div className="mt-6 flex flex-col gap-5" aria-live="polite">
          <p className="text-base font-semibold">{selected === answer.key ? "✓ Correct" : selected ? `✗ Incorrect — the answer is ${answer.key}` : `Not answered — the answer is ${answer.key}`}</p>
          <section>
            <h3 className="mb-2 font-semibold">Explanation</h3>
            <SentenceList sentences={answer.explanation} sources={sources} />
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Why each option is right or wrong</h3>
            <div className="flex flex-col gap-3">
              {q.options.map((o) => (
                <div key={o.id} className="surface rounded-lg p-3">
                  <p className="mb-1 text-sm font-semibold">
                    {o.id}. {o.text} {o.id === answer.key && <Badge tone="ok">Correct</Badge>}
                  </p>
                  <SentenceList sentences={answer.rationales[o.id] ?? []} sources={sources} />
                </div>
              ))}
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <LastVerified at={q.lastVerifiedAt} />
            <ReportError itemId={q.id} version={q.version} where="question bank" />
          </div>
        </div>
      )}
    </div>
  );
}
