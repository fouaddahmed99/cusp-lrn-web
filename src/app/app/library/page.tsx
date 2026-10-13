"use client";
import Link from "next/link";
import { ContentGate } from "@/components/content-gate";
import { Card, EmptyState, LinkButton, PageTitle } from "@/components/ui";
import type { PublicManifest } from "@/contract";

function Library({ m }: { m: PublicManifest }) {
  const subs = m.subtopics.filter((s) => m.noteSubtopics.includes(s.id));
  const byDomain = m.domains.map((d) => ({ d, subs: subs.filter((s) => s.domainId === d.id) })).filter((x) => x.subs.length);
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="High-yield library" subtitle="Notes built only from verified facts. Every line shows its citation." actions={<LinkButton href="/app/library/numbers/" variant="secondary">Must-know numbers</LinkButton>} />
      {byDomain.length === 0 && <EmptyState title="No notes published yet" />}
      <div className="grid gap-4 md:grid-cols-2">
        {byDomain.map(({ d, subs: list }) => (
          <Card key={d.id}>
            <h2 className="font-semibold">{d.name}</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {list.map((s) => (
                <li key={s.id}>
                  <Link href={`/app/library/topic/?id=${s.id}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return <ContentGate>{(m) => <Library m={m} />}</ContentGate>;
}
