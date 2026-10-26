import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PublicAnswer, PublicManifest, PublicQuestion, findForbiddenKeys } from "@/contract";
import { entitlements, FEATURES, PLANS } from "@/adapters/entitlements";
import { auth, payments } from "@/adapters/hosted";
import { errorReportUrl } from "@/adapters/feedback";
import { streak, summarize, weakDomains } from "@/lib/analytics";
import { buildPlan } from "@/lib/planner";
import { filterStubs, emptyFilters } from "@/lib/select";
import { isDue, newCard, review, Rating } from "@/lib/srs";
import { toCsv } from "@/lib/csv";
import { displayOrder } from "@/lib/shuffle";
import type { Attempt } from "@/lib/types";

const att = (o: Partial<Attempt>): Attempt => ({ itemId: "i1", version: 1, sessionId: "s", kind: "qbank", selected: "A", correct: true, timeMs: 30000, at: "2026-10-01T10:00:00Z", domainId: "d1", subtopicId: "s1", taskStatementId: "t1", cognitiveLevel: "remember", ...o });

describe("entitlements (FREE_LAUNCH)", () => {
  it("grants every feature at launch", async () => {
    for (const f of FEATURES) expect(await entitlements.canAccess(null, f)).toBe(true);
  });
  it("has exactly one active plan; future plans exist but are inactive", () => {
    expect(PLANS.filter((p) => p.active).map((p) => p.id)).toEqual(["FREE_LAUNCH"]);
    expect(PLANS.length).toBeGreaterThan(1);
  });
  it("hosted features are disabled", () => {
    expect(auth.enabled).toBe(false);
    expect(payments.enabled).toBe(false);
  });
});

describe("analytics", () => {
  it("summarizes by domain and finds weak areas", () => {
    const a = [att({}), att({ correct: false }), att({ domainId: "d2", correct: false }), att({ domainId: "d2", correct: false }), att({ domainId: "d2", correct: true })];
    const s = summarize(a);
    expect(s.answered).toBe(5);
    expect(s.byDomain.find((b) => b.key === "d2")?.pct).toBe(33);
    expect(weakDomains(s, 3)).toEqual(["d2"]);
  });
  it("counts streaks ending today or yesterday", () => {
    expect(streak(["2026-10-10", "2026-10-11", "2026-10-12"], "2026-10-12")).toBe(3);
    expect(streak(["2026-10-10", "2026-10-11"], "2026-10-12")).toBe(2);
    expect(streak(["2026-10-01"], "2026-10-12")).toBe(0);
  });
});

describe("planner", () => {
  it("weights by blueprint and shifts toward weak domains", () => {
    const domains = [{ id: "a", name: "A", qeWeightPct: 50 }, { id: "b", name: "B", qeWeightPct: 50 }];
    const summary = summarize([att({ domainId: "a" }), att({ domainId: "a" }), att({ domainId: "a" }), att({ domainId: "b", correct: false }), att({ domainId: "b", correct: false }), att({ domainId: "b", correct: false })]);
    const plan = buildPlan({ examDate: "2027-05-01", today: "2026-10-12", weeklyHours: 10, domains, summary, dueCards: 4, hasOce: true });
    const share = Object.fromEntries(plan.allocation.map((x) => [x.domainId, x.share]));
    expect(share.b).toBeGreaterThan(share.a ?? 0);
    expect(plan.today.some((t) => t.kind === "flashcards")).toBe(true);
    expect(plan.phase).toBe("learn");
  });
});

describe("question selection", () => {
  const stubs = [
    { id: "x", version: 1, type: "mcq" as const, tags: { domainId: "d1", subtopicId: "s1", taskStatementId: "t1", cognitiveLevel: "remember" as const }, hasMedia: false },
    { id: "y", version: 1, type: "flashcard" as const, tags: { domainId: "d1", subtopicId: "s1", taskStatementId: "t1", cognitiveLevel: "remember" as const }, hasMedia: false },
  ];
  it("only offers MCQ-type items and honours status filters", () => {
    expect(filterStubs(stubs, emptyFilters(), [], []).map((s) => s.id)).toEqual(["x"]);
    expect(filterStubs(stubs, { ...emptyFilters(), status: "unused" }, [att({ itemId: "x" })], [])).toEqual([]);
    expect(filterStubs(stubs, { ...emptyFilters(), status: "incorrect" }, [att({ itemId: "x", correct: false })], []).map((s) => s.id)).toEqual(["x"]);
  });
});

describe("FSRS flashcards", () => {
  it("new cards are due; a Good review schedules them later", () => {
    const now = new Date("2026-10-12T10:00:00Z");
    const c = newCard("itm", "missed", now);
    expect(isDue(c, now)).toBe(true);
    const next = review(c, Rating.Good, now);
    expect(new Date(String(next.fsrs.due)).getTime()).toBeGreaterThan(now.getTime());
  });
});

describe("misc", () => {
  it("CSV escapes quotes and commas", () => {
    expect(toCsv([["a,b", 'say "hi"']])).toBe('"a,b","say ""hi"""');
  });
  it("error reports prefill item id and version", () => {
    const u = new URL(errorReportUrl({ itemId: "itm_X", version: 2, where: "qbank" }, "typo"));
    expect(u.searchParams.get("item")).toBe("itm_X v2");
    expect(u.searchParams.get("template")).toBe("error-report.yml");
  });
});

describe("sample content bundle", () => {
  const dir = path.resolve(import.meta.dirname, "../../content.sample");
  it("matches the public contract, contains no internal fields, and is marked SAMPLE", () => {
    const m = PublicManifest.parse(JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")));
    expect(m.sample).toBe(true);
    for (const f of readdirSync(path.join(dir, "q"))) {
      const q = JSON.parse(readFileSync(path.join(dir, "q", f), "utf8"));
      expect(() => PublicQuestion.parse(q)).not.toThrow();
      expect(q).not.toHaveProperty("key");
      expect(findForbiddenKeys(q)).toEqual([]);
      const a = JSON.parse(readFileSync(path.join(dir, "a", f), "utf8"));
      expect(() => PublicAnswer.parse(a)).not.toThrow();
    }
  });
});

describe("displayOrder (option shuffle)", () => {
  const q = (id: string) => ({ id, options: ["A", "B", "C", "D"].map((o) => ({ id: o, text: `SAMPLE option ${o}` })) });
  it("is deterministic and keeps every option exactly once", () => {
    const a = displayOrder(q("itm_SAMPLE1"));
    expect(displayOrder(q("itm_SAMPLE1"))).toEqual(a);
    expect(a.map((o) => o.id).sort()).toEqual(["A", "B", "C", "D"]);
    expect(a.map((o) => o.label)).toEqual(["A", "B", "C", "D"]);
  });
  it("spreads a stored key of A across displayed positions", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 400; i++) {
      const label = displayOrder(q(`itm_SAMPLE${i}`)).find((o) => o.id === "A")!.label;
      counts[label] = (counts[label] ?? 0) + 1;
    }
    for (const l of ["A", "B", "C", "D"]) expect(counts[l]).toBeGreaterThan(60);
  });
});
