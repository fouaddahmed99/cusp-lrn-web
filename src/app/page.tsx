import Link from "next/link";
import { activeProductLine, brand } from "@config";
import { Card, LinkButton } from "@/components/ui";

const FEATURES = [
  ["Question bank", "Single-best-answer and clinical-vignette questions, filtered by domain, subtopic, ABPD task statement and cognitive level. Tutor or timed."],
  ["QE simulator", "Full blueprint-weighted exam with a 4-hour timer, navigator, flags and end review, plus 50- and 100-item mini-mocks."],
  ["OCE practice", "Timed sequential vignettes with model answers and a 3/2/1 rubric. Practice with a partner using a shareable examiner link."],
  ["Flashcards", "FSRS spaced repetition. Turn any missed question into a card with one click. Every card links to its source."],
  ["High-yield library", "Notes built only from verified facts, each with its citation. Must-know-number sheets and printable pages."],
  ["Analytics & planner", "Scores by domain and task statement, trends, time per item, a weak-areas quiz, and an adaptive study plan."],
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-14">
      <section className="pt-6 text-center">
        <p className="mb-3 inline-block rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-wide">Free during launch · no account needed</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Board prep you can check, line by line.</h1>
        <p className="muted mx-auto mt-4 max-w-2xl text-lg">
          {activeProductLine.name} helps residents prepare for the ABPD Qualifying Exam and Oral Clinical Exam. Every fact behind every question is cited to a free, public primary source, so you can open the guideline and see it for yourself.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/app/">Start studying</LinkButton>
          <LinkButton href="/content-integrity/" variant="secondary">
            How content is verified
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="features-h">
        <h2 id="features-h" className="mb-5 text-2xl font-semibold">
          Everything you need, in one free tool
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d]) => (
            <Card key={t}>
              <h3 className="font-semibold">{t}</h3>
              <p className="muted mt-2 text-sm leading-relaxed">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Grounded, not generated from memory</h2>
          <p className="muted mt-3 leading-relaxed">
            Content is written only from facts found in public primary sources such as published guidelines and government documents. If a fact is not in the sources, it is not in {brand.name}. Each item is checked automatically against its cited passages, then approved by a person before it is published.
          </p>
          <Link href="/content-integrity/" className="mt-3 inline-block text-sm font-medium">
            Read about content integrity →
          </Link>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Private by design</h2>
          <p className="muted mt-3 leading-relaxed">
            There is no sign-up and no tracking. Your answers, flashcards and study plan are stored in your browser on this device. Use <strong>Settings → Export progress</strong> to back them up or move them to another device. It works offline too.
          </p>
        </Card>
      </section>
    </div>
  );
}
