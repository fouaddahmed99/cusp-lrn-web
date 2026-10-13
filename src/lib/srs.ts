import { Rating, createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";
import type { StoredCard } from "./types";

/** FSRS spaced repetition, entirely on-device (Part F4). */
const scheduler = fsrs({ enable_fuzz: true });

const DATE_KEYS = ["due", "last_review"] as const;

export function toStored(card: Card): Record<string, unknown> {
  const o: Record<string, unknown> = { ...card };
  for (const k of DATE_KEYS) if (card[k]) o[k] = (card[k] as Date).toISOString();
  return o;
}

export function fromStored(o: Record<string, unknown>): Card {
  const c = { ...o } as unknown as Card;
  for (const k of DATE_KEYS) if (o[k]) (c as unknown as Record<string, unknown>)[k] = new Date(o[k] as string);
  return c;
}

export function newCard(itemId: string, origin: StoredCard["origin"], now = new Date()): StoredCard {
  return { id: `${origin}:${itemId}`, itemId, origin, fsrs: toStored(createEmptyCard(now)), createdAt: now.toISOString() };
}

export function review(card: StoredCard, rating: Grade, now = new Date()): StoredCard {
  const next = scheduler.next(fromStored(card.fsrs), now, rating);
  return { ...card, fsrs: toStored(next.card) };
}

export function isDue(card: StoredCard, now = new Date()): boolean {
  return !card.suspended && new Date(card.fsrs.due as string).getTime() <= now.getTime();
}

export function nextIntervals(card: StoredCard, now = new Date()): Record<"again" | "hard" | "good" | "easy", Date> {
  const c = fromStored(card.fsrs);
  return {
    again: scheduler.next(c, now, Rating.Again).card.due,
    hard: scheduler.next(c, now, Rating.Hard).card.due,
    good: scheduler.next(c, now, Rating.Good).card.due,
    easy: scheduler.next(c, now, Rating.Easy).card.due,
  };
}

export function humanInterval(due: Date, now = new Date()): string {
  const min = Math.round((due.getTime() - now.getTime()) / 60000);
  if (min < 60) return `${Math.max(1, min)}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 31 ? `${d}d` : `${Math.round(d / 30)}mo`;
}

export { Rating };
