"use client";
import { useState } from "react";
import { errorReportUrl, feedbackConfigured, feedbackEmail } from "@/adapters/feedback";
import { Button, inputClass } from "./ui";

/** "Report an error": opens a prefilled public GitHub Issue, with an email fallback (Part J6). */
export function ReportError({ itemId, version, where }: { itemId: string; version: number; where: string }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const id = `report-${itemId}`;
  if (!open) {
    return (
      <Button variant="ghost" className="text-xs" onClick={() => setOpen(true)}>
        ⚑ Report an error
      </Button>
    );
  }
  return (
    <div className="surface mt-3 rounded-lg p-4 text-sm">
      <label htmlFor={id} className="font-medium">
        What looks wrong?
      </label>
      <textarea id={id} className={`${inputClass} mt-2 w-full`} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describe the problem. Please don't include personal information." />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {feedbackConfigured ? (
          <a className="inline-flex min-h-10 items-center rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-[var(--brand-ink)] no-underline" href={errorReportUrl({ itemId, version, where }, comment)} target="_blank" rel="noopener noreferrer">
            Open a prefilled GitHub Issue ↗
          </a>
        ) : (
          <span className="muted">Public issue reporting is not configured yet.</span>
        )}
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="muted mt-3 text-xs">
        No GitHub account? Email <span className="font-mono">{feedbackEmail}</span> with the item id <span className="font-mono">{itemId} v{version}</span>.
      </p>
    </div>
  );
}
