"use client";
import { content } from "@/adapters/content";
import { SentenceList } from "@/components/citations";
import { ContentGate } from "@/components/content-gate";
import { useAsync, useSources } from "@/components/hooks";
import { Button, Card, EmptyState, PageTitle, Spinner } from "@/components/ui";
import type { PublicManifest, PublicNotes } from "@/contract";

function Numbers({ m }: { m: PublicManifest }) {
  const sources = useSources();
  const notes = useAsync<PublicNotes[]>(() => Promise.all(m.noteSubtopics.map((s) => content.getNotes(s))), []);
  if (notes.loading || sources.loading || !sources.data) return <Spinner />;
  const name = new Map(m.subtopics.map((s) => [s.id, s.name]));
  const groups = (notes.data ?? []).map((n) => ({ id: n.subtopicId, items: n.sections.flatMap((s) => s.mustKnowNumbers ?? []) })).filter((g) => g.items.length);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Must-know numbers" subtitle="Every number appears exactly as written in its cited source." actions={<Button variant="secondary" className="no-print" onClick={() => window.print()}>Print / save PDF</Button>} />
      {groups.length === 0 && <EmptyState title="No numbers published yet" />}
      {groups.map((g) => (
        <Card key={g.id}>
          <h2 className="mb-3 font-semibold">{name.get(g.id) ?? g.id}</h2>
          <SentenceList sentences={g.items} sources={sources.data!} />
        </Card>
      ))}
    </div>
  );
}

export default function NumbersPage() {
  return <ContentGate>{(m) => <Numbers m={m} />}</ContentGate>;
}
