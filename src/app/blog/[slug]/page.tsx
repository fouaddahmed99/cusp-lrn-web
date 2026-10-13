import type { Metadata } from "next";
import { listMarkdown, mdPath, renderMarkdownFile } from "@/lib/markdown";

export const dynamicParams = false;
export function generateStaticParams() {
  return listMarkdown("blog").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: renderMarkdownFile(mdPath("blog", slug)).title };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { html, date } = renderMarkdownFile(mdPath("blog", slug));
  return (
    <article className="prose-cusp max-w-3xl">
      {date && <p className="muted text-sm">{date}</p>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
