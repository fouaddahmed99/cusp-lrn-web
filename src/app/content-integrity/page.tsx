import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@config";
import { Card, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Content integrity" };

const STEPS: [string, string][] = [
  ["1. Public primary sources only", "We register each source with its public link, version and license: published guidelines and policies, government documents, and openly licensed peer-reviewed articles. Textbooks, paid manuals, recalled exam items and other companies' materials are never used."],
  ["2. Facts are extracted with an exact supporting passage", "Each fact is tied to one passage (document, section and page). A fact without a supporting passage is discarded. Numbers must appear exactly as written in the source."],
  ["3. Questions are written only from those facts", "The writing step receives only the verified facts. If the facts are not enough for a correct, unambiguous question, nothing is written. Every explanation sentence is linked to the facts it uses, and every wrong answer must be shown wrong by a cited fact."],
  ["4. Independent automated checks", "A separate check labels every claim against its cited passages; anything not fully supported blocks the item. An independent solver must reach the same single best answer. Copied wording, unsupported numbers and near-duplicates are rejected."],
  ["5. A person approves every item", "Nothing is published until the owner reviews the item next to its sources and approves it."],
  ["6. Kept current", "Sources are checked weekly for new versions. Items citing an outdated source, or not verified in the last 12 months, are pulled from new quizzes until they are re-verified. Conflicting sources are never resolved silently."],
];

export default function Integrity() {
  return (
    <div className="max-w-3xl">
      <PageTitle title="Content integrity" subtitle={`How ${brand.name} makes sure every question can be checked against a public source.`} />
      <div className="flex flex-col gap-4">
        {STEPS.map(([t, d]) => (
          <Card key={t}>
            <h2 className="font-semibold">{t}</h2>
            <p className="muted mt-2 leading-relaxed">{d}</p>
          </Card>
        ))}
      </div>
      <p className="muted mt-6 text-sm leading-relaxed">
        Coverage gaps are expected: when the sources do not support a topic, we leave it out rather than fill it in. See <Link href="/attribution/">Sources &amp; attribution</Link> for every source cited on the site, and use “Report an error” on any explanation if something looks wrong.
      </p>
    </div>
  );
}
