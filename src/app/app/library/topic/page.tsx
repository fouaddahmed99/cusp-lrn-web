"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { LastVerified, SentenceList } from "@/components/citations";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useSources } from "@/components/hooks";
import { ReportError } from "@/components/report";
import { Button, Card, EmptyState, PageTitle, Spinner } from "@/components/ui";
import type { PublicManifest } from "@/contract";
import { speakQueue, speechSupported } from "@/lib/speech";

function Topic({ m }: { m: PublicManifest }) {
  const id = useSearchParams().get("id") ?? "";
  const sources = useSources();
  const notes = useAsync(() => (m.noteSubtopics.includes(id) ? content.getNotes(id) : Promise.resolve(null)), [id]);
  const [speaking, setSpeaking] = useState<(() => void) | null>(null);
  const [rate, setRate] = useState(1);
  useEffect(() => {
    progress.settings().then((s) => setRate(s.speechRate));
  }, []);
  useEffect(() => () => speaking?.(), [speaking]);
  const sub = m.subtopics.find((s) => s.id === id);
  if (notes.loading || sources.loading) return <Spinner />;
  if (!notes.data || !sources.data) return <EmptyState title="No notes for this topic" />;
  const listen = () => {
    if (speaking) {
      speaking();
      setSpeaking(null);
      return;
    }
    const texts = notes.data!.sections.flatMap((s) => [s.heading, ...s.bullets.map((b) => b.text), ...(s.mustKnowNumbers ?? []).map((b) => b.text)]);
    const stop = speakQueue(texts, { rate, onEnd: () => setSpeaking(null) });
    setSpeaking(() => stop);
  };
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={sub?.name ?? id}
        subtitle="High-yield notes"
        actions={
          <div className="no-print flex gap-2">
            {speechSupported() && (
              <Button variant="secondary" onClick={listen} aria-pressed={!!speaking}>
                {speaking ? "■ Stop" : "▶ Listen"}
              </Button>
            )}
            <Button variant="secondary" onClick={() => window.print()}>
              Print / save PDF
            </Button>
          </div>
        }
      />
      {notes.data.sections.map((s) => (
        <Card key={s.id} as="article">
          <h2 className="mb-3 text-lg font-semibold">{s.heading}</h2>
          <SentenceList sentences={s.bullets} sources={sources.data!} />
          {s.mustKnowNumbers && s.mustKnowNumbers.length > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3">
              <h3 className="mb-2 text-sm font-semibold">Must-know numbers</h3>
              <SentenceList sentences={s.mustKnowNumbers} sources={sources.data!} />
            </div>
          )}
          <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-2">
            <LastVerified at={s.lastVerifiedAt} />
            <ReportError itemId={s.id} version={s.version} where="library" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function TopicPage() {
  return <ContentGate>{(m) => <Suspense fallback={<Spinner />}><Topic m={m} /></Suspense>}</ContentGate>;
}
