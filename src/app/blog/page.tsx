import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { listMarkdown, mdPath, renderMarkdownFile } from "@/lib/markdown";

export const metadata: Metadata = { title: "Blog" };

export default function Blog() {
  const posts = listMarkdown("blog")
    .map((slug) => ({ slug, ...renderMarkdownFile(mdPath("blog", slug)) }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return (
    <div className="max-w-3xl">
      <PageTitle title="Blog" subtitle="Product updates. Testimonials appear here only when they are real." />
      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <li key={p.slug} className="surface rounded-lg p-4">
            <Link href={`/blog/${p.slug}/`} className="font-medium">
              {p.title}
            </Link>
            {p.date && <p className="muted text-sm">{p.date}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
