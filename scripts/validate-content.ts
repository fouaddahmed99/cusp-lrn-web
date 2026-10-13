// Validates content/ and content.sample/ against the public contract and scans for forbidden keys.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { PublicAnswer, PublicExamForm, PublicItemStub, PublicManifest, PublicNotes, PublicQuestion, PublicSource, findForbiddenKeys } from "../src/contract/index";

const root = path.resolve(import.meta.dirname, "..");
let problems = 0;
for (const dir of ["content", "content.sample"]) {
  const base = path.join(root, dir);
  if (!existsSync(path.join(base, "manifest.json"))) {
    console.log(`· ${dir}/: no bundle yet`);
    continue;
  }
  const files: string[] = [];
  (function walk(d: string) {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".json")) files.push(path.relative(base, p).split(path.sep).join("/"));
    }
  })(base);
  for (const f of files) {
    const data: unknown = JSON.parse(readFileSync(path.join(base, f), "utf8"));
    const schema = f === "manifest.json" ? PublicManifest : f === "sources.json" ? PublicSource.array() : f.startsWith("stubs/") ? PublicItemStub.array() : f.startsWith("q/") ? PublicQuestion : f.startsWith("a/") ? PublicAnswer : f.startsWith("notes/") ? PublicNotes : f.startsWith("forms/") ? PublicExamForm : undefined;
    const bad = findForbiddenKeys(data);
    if (bad.length) { console.error(`✗ ${dir}/${f}: forbidden keys ${bad.join(", ")}`); problems++; }
    if (!schema) { console.error(`✗ ${dir}/${f}: unexpected file`); problems++; continue; }
    const r = schema.safeParse(data);
    if (!r.success) { console.error(`✗ ${dir}/${f}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`); problems++; }
  }
  const m = PublicManifest.parse(JSON.parse(readFileSync(path.join(base, "manifest.json"), "utf8")));
  if (dir === "content.sample" && !m.sample) { console.error("✗ content.sample must be marked sample: true"); problems++; }
  if (dir === "content" && m.sample) { console.error("✗ content/ must never contain SAMPLE data"); problems++; }
  console.log(`✓ ${dir}/: ${files.length} files valid (content ${m.contentVersion})`);
}
if (problems) process.exit(1);
