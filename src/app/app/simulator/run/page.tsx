"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ContentGate } from "@/components/content-gate";
import { SessionPlayer } from "@/components/session-player";
import { EmptyState, Spinner } from "@/components/ui";

function Inner() {
  const id = useSearchParams().get("id");
  if (!id) return <EmptyState title="No session selected" />;
  return <SessionPlayer sessionId={id} reviewHref={`/app/simulator/results/?id=${id}`} />;
}

export default function SessionPage() {
  return <ContentGate>{() => <Suspense fallback={<Spinner />}><Inner /></Suspense>}</ContentGate>;
}
