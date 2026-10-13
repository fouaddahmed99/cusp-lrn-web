"use client";
import type { ReactNode } from "react";
import type { PublicManifest } from "@/contract";
import { useManifest } from "./hooks";
import { EmptyState, Spinner } from "./ui";

/** Renders children only when a content bundle exists; otherwise an honest empty state. */
export function ContentGate({ children }: { children: (m: PublicManifest) => ReactNode }) {
  const { data, error, loading } = useManifest();
  if (loading) return <Spinner />;
  if (error) return <EmptyState title="Content could not be loaded">{error.message}. If you are offline, open this page once while online so it can be saved for offline use.</EmptyState>;
  if (!data) {
    return (
      <EmptyState title="No published content yet">
        Every item on this site is generated only from cited, public primary sources and approved before it is published. The first items are on their way. You can still set up your study plan.
      </EmptyState>
    );
  }
  return (
    <>
      {data.sample && (
        <div role="note" className="mb-4 rounded-lg border-2 border-dashed border-[var(--color-warn)] p-3 text-sm">
          <strong>SAMPLE data.</strong> This build shows fake, non-clinical test content for development. It is not study material.
        </div>
      )}
      {children(data)}
    </>
  );
}
