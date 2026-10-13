"use client";
import { useEffect, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { LastVerified, SentenceList } from "@/components/citations";
import { ContentGate } from "@/components/content-gate";
import { useSources } from "@/components/hooks";
import { QuestionView, isMcqQuestion } from "@/components/question";
import { ReportError } from "@/components/report";
import { Button, Card, EmptyState, LinkButton, PageTitle, Spinner } from "@/components/ui";
import type { PublicAnswer, PublicQuestion } from "@/contract";
import { Rating, humanInterval, isDue, nextIntervals, review } from "@/lib/srs";
import type { StoredCard } from "@/lib/types";

function Review() {
  const sources = useSources();
  const [queue, setQueue] = useState<StoredCard[] | null>(null);
  const [q, setQ] = useState<PublicQuestion | null>(null);
  const [a, setA] = useState<PublicAnswer | null>(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    progress.cards().then((cs) => setQueue(cs.filter((c) => isDue(c)).sort((x, y) => String(x.fsrs.due).localeCompare(String(y.fsrs.due)))));
  }, []);
  const card = queue?.[0];
  useEffect(() => {
    if (!card) return;
    setQ(null);
    setA(null);
    setShown(false);
    content.getQuestion(card.itemId).then(setQ).catch(() => setQ(null));
  }, [card]);

  if (!queue || sources.loading) return <Spinner />;
  if (!card) {
    return (
      <EmptyState title={done ? `Done! ${done} card${done === 1 ? "" : "s"} reviewed.` : "No cards due"}>
        <LinkButton href="/app/flashcards/" variant="secondary" className="mt-3">
          Back to flashcards
        </LinkButton>
      </EmptyState>
    );
  }
  const reveal = async () => {
    setA(await content.getAnswer(card.itemId)); // only after the user chooses to reveal
    setShown(true);
  };
  const rate = async (r: Rating) => {
    await progress.saveCard(review(card, r as never));
    await progress.addReview({ cardId: card.id, rating: r, at: new Date().toISOString() });
    setDone((d) => d + 1);
    setQueue(queue.slice(1));
  };
  const iv = nextIntervals(card);
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageTitle title="Review flashcards" subtitle={`${queue.length} due`} />
      <Card>
        {!q || !sources.data ? (
          <Spinner />
        ) : q.type === "flashcard" ? (
          <p className="text-lg font-medium">{q.front}</p>
        ) : isMcqQuestion(q) ? (
          <QuestionView q={q} selected={null} onSelect={() => undefined} answer={shown && a && "key" in a ? a : null} sources={sources.data} locked />
        ) : null}
        {shown && a?.type === "flashcard" && sources.data && (
          <div className="mt-4 border-t line pt-4">
            <SentenceList sentences={a.back} sources={sources.data} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {q && <LastVerified at={q.lastVerifiedAt} />}
              {q && <ReportError itemId={q.id} version={q.version} where="flashcards" />}
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-wrap gap-2 border-t line pt-4">
          {!shown ? (
            <Button onClick={reveal}>Show answer</Button>
          ) : (
            <>
              <Button variant="danger" onClick={() => rate(Rating.Again)}>
                Again · {humanInterval(iv.again)}
              </Button>
              <Button variant="secondary" onClick={() => rate(Rating.Hard)}>
                Hard · {humanInterval(iv.hard)}
              </Button>
              <Button onClick={() => rate(Rating.Good)}>Good · {humanInterval(iv.good)}</Button>
              <Button variant="secondary" onClick={() => rate(Rating.Easy)}>
                Easy · {humanInterval(iv.easy)}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
  return <ContentGate>{() => <Review />}</ContentGate>;
}
