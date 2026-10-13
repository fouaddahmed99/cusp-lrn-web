// Copies the published bundle (content/) into public/content/ for the static build.
// CUSP_CONTENT=sample uses content.sample/ (obviously fake SAMPLE data) for dev and tests.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const useSample = process.env.CUSP_CONTENT === "sample";
const from = path.join(root, useSample ? "content.sample" : "content");
const to = path.join(root, "public", "content");

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
if (existsSync(path.join(from, "manifest.json"))) {
  cpSync(from, to, { recursive: true, filter: (src) => !src.endsWith("README.md") });
  console.log(`✓ content from ${path.relative(root, from)}/ → public/content/`);
} else {
  console.log(`· no published content in ${path.relative(root, from)}/ yet — the site will show an empty state`);
}
