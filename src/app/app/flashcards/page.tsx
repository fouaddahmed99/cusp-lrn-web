"use client";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { ContentGate } from "@/components/content-gate";
import { useStudyData } from "@/components/study-data";
import { Badge, Button, Card, LinkButton, PageTitle, Spinner, Stat } from "@/components/ui";
import { downloadBlob, toCsv } from "@/lib/csv";
import { isDue, newCard } from "@/lib/srs";

function Flashcards() {
  const data = useStudyData();
  if (data.loading || !data.data) return <Spinner />;
  const { cards, stubs } = data.data;
  const deck = stubs.filter((s) => s.type === "flashcard");
  const inDeck = new Set(cards.map((c) => c.itemId));
  const notAdded = deck.filter((s) => !inDeck.has(s.id));
  const due = cards.filter((c) => isDue(c));

  const addAll = async () => {
    for (const s of notAdded) await progress.saveCard(newCard(s.id, "deck"));
  };
  const exportCsv = async () => {
    const rows: (string | number)[][] = [["card_id", "origin", "front_or_question", "due", "state", "reps", "lapses", "created"]];
    for (const c of cards) {
      const q = await content.getQuestion(c.itemId).catch(() => null);
      const front = !q ? c.itemId : q.type === "flashcard" ? q.front : "stem" in q ? q.stem : c.itemId;
      rows.push([c.id, c.origin, front, String(c.fsrs.due), String(c.fsrs.state), Number(c.fsrs.reps ?? 0), Number(c.fsrs.lapses ?? 0), c.createdAt]);
    }
    downloadBlob(new Blob([toCsv(rows)], { type: "text/csv" }), "cusp-lrn-flashcards.csv");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Flashcards" subtitle="FSRS spaced repetition on your device. Every card links to its source." actions={<LinkButton href="/app/flashcards/review/">{due.length ? `Review ${due.length} due` : "Review"}</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Due now" value={due.length} />
        <Stat label="In your deck" value={cards.length} />
        <Stat label="From missed questions" value={cards.filter((c) => c.origin === "missed").length} />
        <Stat label="Published cards" value={deck.length} />
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">{notAdded.length ? `${notAdded.length} published card(s) are not in your deck yet.` : "All published cards are in your deck."}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={addAll} disabled={!notAdded.length}>
            Add all to my deck
          </Button>
          <Button variant="ghost" onClick={exportCsv} disabled={!cards.length}>
            Export my cards (CSV)
          </Button>
        </div>
      </Card>
      {cards.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold">Your cards</h2>
          <ul className="flex flex-col divide-y divide-[var(--line)] text-sm">
            {cards.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-mono text-xs">{c.itemId}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={c.origin === "missed" ? "warn" : "neutral"}>{c.origin === "missed" ? "missed question" : "deck"}</Badge>
                  <span className="muted text-xs">due {new Date(String(c.fsrs.due)).toLocaleDateString()}</span>
                  <Button variant="ghost" className="text-xs" onClick={() => progress.deleteCard(c.id)} aria-label={`Remove card ${c.itemId}`}>
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function FlashcardsPage() {
  return <ContentGate>{() => <Flashcards />}</ContentGate>;
}
