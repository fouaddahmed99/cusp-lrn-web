import type { OptionId } from "./util";

export type Mode = "tutor" | "timed";

export interface Attempt {
  id?: number;
  itemId: string;
  version: number;
  sessionId: string;
  kind: "qbank" | "sim";
  selected: OptionId | null;
  correct: boolean;
  timeMs: number;
  at: string;
  domainId: string;
  subtopicId: string;
  taskStatementId: string;
  cognitiveLevel: string;
}

export interface Session {
  id: string;
  kind: "qbank" | "sim";
  mode: Mode;
  itemIds: string[];
  answers: Record<string, OptionId | null>;
  submitted: Record<string, boolean>;
  timeMs: Record<string, number>;
  flags: string[];
  index: number;
  createdAt: string;
  startedAt: string;
  finishedAt?: string;
  /** Total time limit (timed modes and simulator). */
  timeLimitSec?: number;
  elapsedSec: number;
  formId?: string;
  title: string;
}

export interface Mark {
  itemId: string;
  flagged: boolean;
  note: string;
  updatedAt: string;
}

export interface StoredCard {
  id: string;
  itemId: string;
  origin: "deck" | "missed";
  /** ts-fsrs Card, with dates as ISO strings. */
  fsrs: Record<string, unknown>;
  createdAt: string;
  suspended?: boolean;
}

export interface ReviewEntry {
  id?: number;
  cardId: string;
  rating: number;
  at: string;
}

export interface OceAttempt {
  id: string;
  vignetteId: string;
  startedAt: string;
  finishedAt?: string;
  answers: { text: string; selfScore: 1 | 2 | 3 | null }[];
}

export interface Profile {
  examDate?: string;
  examKind?: "QE" | "OCE" | "both";
  pgyYear?: string;
  program?: string;
  weeklyHours?: number;
  onboarded?: boolean;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  speechRate: number;
}

export interface PlanTaskState {
  date: string;
  done: string[];
}
