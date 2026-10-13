"use client";
import type { PublicCitation, PublicSentence, PublicSource } from "@/contract";

/** Every fact shows its citation: source title, organization, year/version, section or page, and a link (Part A5). */
export function CitationChip({ c, sources }: { c: PublicCitation; sources: Map<string, PublicSource> }) {
  const s = sources.get(c.sourceId);
  if (!s) return <span className="muted text-xs">[{c.sourceId}]</span>;
  const where = [c.section, c.page ? `p. ${c.page}` : ""].filter(Boolean).join(" · ");
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="surface inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-md px-2 py-0.5 text-xs no-underline hover:bg-[var(--surface-2)]" title={`${s.title} — opens the public source`}>
      <span className="font-medium text-[var(--ink)]">{s.organization}</span>
      <span className="text-[var(--ink)]">· {s.title}</span>
      <span className="muted">({s.versionLabel || s.year})</span>
      {where && <span className="muted">· {where}</span>}
      <span aria-hidden>↗</span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function SentenceList({ sentences, sources, ordered = false }: { sentences: PublicSentence[]; sources: Map<string, PublicSource>; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className={`flex flex-col gap-3 ${ordered ? "list-decimal pl-5" : ""}`}>
      {sentences.map((s, i) => (
        <li key={i} className="leading-relaxed">
          <span>{s.text}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {s.cites.map((c, j) => (
              <CitationChip key={j} c={c} sources={sources} />
            ))}
          </span>
        </li>
      ))}
    </List>
  );
}

export function LastVerified({ at }: { at: string }) {
  return <p className="muted text-xs">Last verified against its sources: {new Date(at).toLocaleDateString()}</p>;
}
