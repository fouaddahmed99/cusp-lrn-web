import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { brand } from "@config";

/** Build-time markdown (legal templates, blog). Placeholders are filled from cusp.config.ts. */
export function renderMarkdownFile(file: string): { html: string; title: string; date?: string } {
  const raw = readFileSync(file, "utf8");
  const fm = /^---\n([\s\S]*?)\n---\n/u.exec(raw);
  const meta = Object.fromEntries((fm?.[1] ?? "").split("\n").map((l) => l.split(/:\s*/u, 2)).filter((p) => p.length === 2)) as Record<string, string>;
  const body = (fm ? raw.slice(fm[0].length) : raw)
    .replaceAll("{{BRAND}}", brand.name)
    .replaceAll("{{YEAR}}", String(new Date().getFullYear()))
    .replaceAll("{{LEGAL_ENTITY}}", brand.legalEntityName)
    .replaceAll("{{ADDRESS}}", brand.address)
    .replaceAll("{{CONTACT_EMAIL}}", brand.contactEmail);
  const title = meta.title ?? /^#\s+(.*)$/mu.exec(body)?.[1] ?? path.basename(file, ".md");
  return { html: marked.parse(body, { async: false }) as string, title, ...(meta.date ? { date: meta.date } : {}) };
}

export function listMarkdown(dir: string): string[] {
  const abs = path.join(process.cwd(), dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/u, "")).sort();
}

export const mdPath = (dir: string, slug: string) => path.join(process.cwd(), dir, `${slug}.md`);
