"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { PublicManifest } from "@/contract";
import { ContentGate } from "@/components/content-gate";
import { SessionReview } from "@/components/session-review";
import { EmptyState, Spinner } from "@/components/ui";

function Inner({ m }: { m: PublicManifest }) {
  const id = useSearchParams().get("id");
  if (!id) return <EmptyState title="No session selected" />;
  return <SessionReview sessionId={id} manifest={m} />;
}

export default function ReviewPage() {
  return <ContentGate>{(m) => <Suspense fallback={<Spinner />}><Inner m={m} /></Suspense>}</ContentGate>;
}
