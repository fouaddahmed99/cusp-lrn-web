// GENERATED: copied from cusp-lrn-content/packages/contract/src/public/index.ts by the publish workflow. Do not edit here.
/**
 * CUSP LRN PUBLIC CONTENT CONTRACT
 *
 * This file is the single source of truth for every JSON file the public website
 * receives. It is copied verbatim into cusp-lrn-web/src/contract/ by the publish
 * workflow. It must stay self-contained (zod only) and every object is `.strict()`,
 * so an unexpected (possibly internal) field fails validation instead of shipping.
 */
import { z } from "zod";

export const PUBLIC_CONTRACT_VERSION = 1;

/** Keys that must never appear anywhere in the public bundle. Checked by the publish leak scan and web CI. */
export const FORBIDDEN_PUBLIC_KEYS = [
  "supportingQuote",
  "chunkId",
  "chunkText",
  "discoveredViaLead",
  "leadClaimIds",
  "leadDocId",
  "claimText",
  "provenance",
  "claims",
  "passages",
  "verificationRef",
  "solver",
  "attestation",
  "licenseEvidence",
] as const;

const Id = z.string().min(1);
const IsoDateTime = z.iso.datetime({ offset: true });
const Url = z.url({ protocol: /^https?$/ });
const CognitiveLevel = z.enum(["remember", "understand_apply", "analyze_evaluate"]);
const OptionId = z.enum(["A", "B", "C", "D", "E"]);
const ItemType = z.enum(["mcq", "vignette_mcq", "image_mcq", "flashcard", "note_section", "oce_vignette"]);

export const PublicSource = z
  .object({
    id: Id,
    title: z.string(),
    organization: z.string(),
    year: z.number().int(),
    versionLabel: z.string(),
    url: Url,
    licenseLabel: z.string(),
    attribution: z.string().optional(),
  })
  .strict();
export type PublicSource = z.infer<typeof PublicSource>;

export const PublicCitation = z
  .object({ sourceId: Id, page: z.number().int().positive().nullable(), section: z.string() })
  .strict();
export type PublicCitation = z.infer<typeof PublicCitation>;

/** A sentence with the citations of the facts it is built on. */
export const PublicSentence = z.object({ text: z.string(), cites: z.array(PublicCitation).min(1) }).strict();
export type PublicSentence = z.infer<typeof PublicSentence>;

const Tags = z
  .object({ domainId: Id, subtopicId: Id, taskStatementId: Id, cognitiveLevel: CognitiveLevel })
  .strict();
export type PublicTags = z.infer<typeof Tags>;

const PublicMedia = z.object({ src: z.string(), alt: z.string(), caption: z.string().optional(), attribution: z.string().optional() }).strict();

/** Listing entry: no question text, no key. */
export const PublicItemStub = z.object({ id: Id, version: z.number().int().positive(), type: ItemType, tags: Tags, hasMedia: z.boolean() }).strict();
export type PublicItemStub = z.infer<typeof PublicItemStub>;

const qBase = { id: Id, version: z.number().int().positive(), tags: Tags, lastVerifiedAt: IsoDateTime };

/** content/q/<id>.json: everything needed to SHOW an item. Never contains the key. */
export const PublicQuestion = z.discriminatedUnion("type", [
  z
    .object({
      ...qBase,
      type: z.enum(["mcq", "vignette_mcq", "image_mcq"]),
      vignette: z.string().optional(),
      stem: z.string(),
      options: z.array(z.object({ id: OptionId, text: z.string() }).strict()).min(4).max(5),
      media: z.array(PublicMedia).optional(),
    })
    .strict(),
  z.object({ ...qBase, type: z.literal("flashcard"), front: z.string() }).strict(),
  z.object({ ...qBase, type: z.literal("oce_vignette"), presentation: z.string(), timeLimitSec: z.number().int().positive(), questions: z.array(z.string()).min(5).max(8) }).strict(),
]);
export type PublicQuestion = z.infer<typeof PublicQuestion>;

/** content/a/<id>.json: fetched only AFTER the user submits (Part J7). */
export const PublicAnswer = z.discriminatedUnion("type", [
  z
    .object({
      id: Id,
      version: z.number().int().positive(),
      type: z.enum(["mcq", "vignette_mcq", "image_mcq"]),
      key: OptionId,
      rationales: z.partialRecord(OptionId, z.array(PublicSentence)),
      explanation: z.array(PublicSentence).min(1),
    })
    .strict(),
  z.object({ id: Id, version: z.number().int().positive(), type: z.literal("flashcard"), back: z.array(PublicSentence).min(1) }).strict(),
  z
    .object({
      id: Id,
      version: z.number().int().positive(),
      type: z.literal("oce_vignette"),
      prompts: z
        .array(
          z
            .object({
              modelAnswer: z.array(PublicSentence).min(1),
              score2Gaps: z.array(z.string()),
              rubric: z.object({ "3": z.string(), "2": z.string(), "1": z.string() }).strict(),
            })
            .strict(),
        )
        .min(5)
        .max(8),
    })
    .strict(),
]);
export type PublicAnswer = z.infer<typeof PublicAnswer>;

/** content/notes/<subtopicId>.json: high-yield library (only verified facts, each cited). */
export const PublicNotes = z
  .object({
    subtopicId: Id,
    sections: z.array(
      z
        .object({
          id: Id,
          version: z.number().int().positive(),
          heading: z.string(),
          tags: Tags,
          bullets: z.array(PublicSentence).min(1),
          mustKnowNumbers: z.array(PublicSentence).optional(),
          lastVerifiedAt: IsoDateTime,
        })
        .strict(),
    ),
  })
  .strict();
export type PublicNotes = z.infer<typeof PublicNotes>;

export const PublicExamForm = z
  .object({
    id: Id,
    name: z.string(),
    kind: z.enum(["full", "mini100", "mini50"]),
    itemIds: z.array(Id),
    shortfall: z.array(z.object({ domainId: Id, target: z.number().int(), available: z.number().int() }).strict()),
  })
  .strict();
export type PublicExamForm = z.infer<typeof PublicExamForm>;

export const PublicManifest = z
  .object({
    contractVersion: z.literal(PUBLIC_CONTRACT_VERSION),
    contentVersion: z.string(),
    builtAt: IsoDateTime,
    sample: z.boolean(),
    exam: z
      .object({
        qe: z
          .object({ totalItems: z.number().int(), unscoredPretestItems: z.number().int(), durationMinutes: z.number().int(), miniMockSizes: z.array(z.number().int()) })
          .strict(),
        oce: z.object({ sessions: z.number().int(), sessionMinutes: z.number().int(), examinersPerSession: z.number().int() }).strict(),
      })
      .strict(),
    domains: z.array(z.object({ id: Id, name: z.string(), qeWeightPct: z.number(), oceWeightPct: z.number() }).strict()),
    subtopics: z.array(z.object({ id: Id, domainId: Id, name: z.string() }).strict()),
    taskStatements: z.array(z.object({ id: Id, domainId: Id, text: z.string() }).strict()),
    counts: z.record(ItemType, z.number().int().nonnegative()),
    stubFiles: z.array(z.string()),
    noteSubtopics: z.array(Id),
    forms: z.array(z.object({ id: Id, name: z.string(), kind: z.enum(["full", "mini100", "mini50"]), size: z.number().int() }).strict()),
  })
  .strict();
export type PublicManifest = z.infer<typeof PublicManifest>;

/** Recursively collect every object key in a JSON value. */
export function collectKeys(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectKeys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      collectKeys(v, out);
    }
  }
  return out;
}

/** Returns the forbidden keys present in a JSON value. */
export function findForbiddenKeys(value: unknown): string[] {
  const keys = collectKeys(value);
  return FORBIDDEN_PUBLIC_KEYS.filter((k) => keys.has(k));
}
