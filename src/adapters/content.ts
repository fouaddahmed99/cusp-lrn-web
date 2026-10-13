import { PublicAnswer, PublicExamForm, PublicItemStub, PublicManifest, PublicNotes, PublicQuestion, PublicSource } from "@/contract";
import type { z } from "zod";
import { asset } from "@/lib/base";

/**
 * ContentStore (Part J8). GitHub mode reads the static JSON bundle; a hosted
 * edition can implement the same interface against an API without UI changes.
 */
export interface ContentStore {
  getManifest(): Promise<PublicManifest | null>;
  listStubs(): Promise<PublicItemStub[]>;
  getQuestion(id: string): Promise<PublicQuestion>;
  /** Only call AFTER the user has submitted an answer (Part J7). */
  getAnswer(id: string): Promise<PublicAnswer>;
  getNotes(subtopicId: string): Promise<PublicNotes>;
  getForm(formId: string): Promise<PublicExamForm>;
  getSources(): Promise<PublicSource[]>;
  /** Every content URL, for "make available offline". */
  allUrls(): Promise<string[]>;
}

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(asset(`/content/${path}`));
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return schema.parse(await res.json());
}

class StaticJsonContentStore implements ContentStore {
  private cache = new Map<string, Promise<unknown>>();

  private once<T>(key: string, load: () => Promise<T>): Promise<T> {
    let p = this.cache.get(key) as Promise<T> | undefined;
    if (!p) {
      p = load();
      this.cache.set(key, p);
      p.catch(() => this.cache.delete(key));
    }
    return p;
  }

  getManifest() {
    return this.once("manifest", async () => {
      const res = await fetch(asset("/content/manifest.json"));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Could not load the content manifest (${res.status})`);
      return PublicManifest.parse(await res.json());
    });
  }
  async listStubs() {
    const m = await this.getManifest();
    if (!m) return [];
    const lists = await Promise.all(m.stubFiles.map((f) => this.once(f, () => getJson(f, PublicItemStub.array()))));
    return lists.flat();
  }
  getQuestion(id: string) {
    return this.once(`q/${id}`, () => getJson(`q/${id}.json`, PublicQuestion));
  }
  getAnswer(id: string) {
    return this.once(`a/${id}`, () => getJson(`a/${id}.json`, PublicAnswer));
  }
  getNotes(subtopicId: string) {
    return this.once(`notes/${subtopicId}`, () => getJson(`notes/${subtopicId}.json`, PublicNotes));
  }
  getForm(formId: string) {
    return this.once(`forms/${formId}`, () => getJson(`forms/${formId}.json`, PublicExamForm));
  }
  getSources() {
    return this.once("sources", () => getJson("sources.json", PublicSource.array()));
  }
  async allUrls() {
    const m = await this.getManifest();
    if (!m) return [];
    const stubs = await this.listStubs();
    const paths = ["manifest.json", "sources.json", ...m.stubFiles, ...m.noteSubtopics.map((s) => `notes/${s}.json`), ...m.forms.map((f) => `forms/${f.id}.json`), ...stubs.flatMap((s) => [`q/${s.id}.json`, `a/${s.id}.json`])];
    return paths.map((p) => asset(`/content/${p}`));
  }
}

export const content: ContentStore = new StaticJsonContentStore();
