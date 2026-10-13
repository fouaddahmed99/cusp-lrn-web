import type { Metadata } from "next";
import { listMarkdown, mdPath, renderMarkdownFile } from "@/lib/markdown";

export const dynamicParams = false;
export function generateStaticParams() {
  return listMarkdown("legal").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: renderMarkdownFile(mdPath("legal", slug)).title };
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { html } = renderMarkdownFile(mdPath("legal", slug));
  return <article className="prose-cusp max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />;
}
