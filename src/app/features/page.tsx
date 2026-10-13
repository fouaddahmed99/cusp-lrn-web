import type { Metadata } from "next";
import { Card, LinkButton, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Features" };

const SECTIONS: [string, string[]][] = [
  ["Question bank", ["Filter by domain, subtopic, ABPD task statement, cognitive level, item type, and unused / incorrect / marked.", "Tutor mode (explanations right away) or timed mode (review at the end).", "Explanations show each citation: source, organization, version, section or page, and a link.", "Flag questions, write private notes, and report errors in one click."]],
  ["QE simulator", ["A full blueprint-weighted exam with a 4-hour timer, navigator and flags.", "50- and 100-item mini-mocks.", "Fixed exam forms, so repeat attempts are comparable.", "If a domain does not yet have enough approved items, the simulator shows the shortfall instead of padding it."]],
  ["OCE practice", ["Timed, sequential case player with typed or privately recorded spoken answers.", "Model answer and rubric for self-scoring (3 / 2 / 1).", "Partner mode: share a link and your study partner opens the examiner view on their own device."]],
  ["Flashcards", ["FSRS spaced repetition, entirely on your device.", "One click turns a missed question into a card.", "Every card links to its source. Export your cards as CSV."]],
  ["High-yield library & audio", ["Notes per subtopic built only from verified facts, each showing its citation.", "Must-know-number sheets and printable pages.", "Listen to notes with your browser's built-in text-to-speech."]],
  ["Analytics & study planner", ["Scores by domain, subtopic and task statement; trends; time per item.", "One-click weak-areas quiz.", "Exam date + weekly hours → a blueprint-weighted plan with daily tasks and streaks."]],
];

export default function Features() {
  return (
    <div>
      <PageTitle title="Features" subtitle="All features are free during launch. No account, no tracking." />
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map(([title, points]) => (
          <Card key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <ul className="muted mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
              {points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <LinkButton href="/app/">Start studying</LinkButton>
      </div>
    </div>
  );
}
