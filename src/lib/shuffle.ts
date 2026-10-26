import type { OptionId } from "@/lib/util";

const LETTERS = ["A", "B", "C", "D", "E"] as const;

/**
 * Display order for a question's options: a deterministic shuffle seeded by the item id,
 * so the same question always shows the same order (sessions, review, reloads) while the
 * correct answer is not clustered on one letter across the bank. Answers and progress keep
 * using the stored option ids; only the displayed letters change.
 */
export function displayOrder(q: { id: string; options: { id: string; text: string }[] }): { id: OptionId; text: string; label: string }[] {
  let h = 2166136261;
  for (const ch of q.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [opts[i], opts[j]] = [opts[j]!, opts[i]!];
  }
  return opts.map((o, i) => ({ id: o.id as OptionId, text: o.text, label: LETTERS[i]! }));
}

