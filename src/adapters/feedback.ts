import { feedback } from "@config";

/** Error reports go to public GitHub Issues (prefilled form) with an email fallback. No tracking. */
export function errorReportUrl(ref: { itemId: string; version: number; where: string }, comment = ""): string {
  const params = new URLSearchParams({
    template: "error-report.yml",
    title: `Error report: ${ref.itemId} v${ref.version}`,
    item: `${ref.itemId} v${ref.version}`,
    where: ref.where,
    details: comment,
  });
  return `https://github.com/${feedback.githubOwner}/${feedback.feedbackRepo}/issues/new?${params.toString()}`;
}

export function feedbackUrl(kind: "feedback" | "survey"): string {
  const params = new URLSearchParams({ template: kind === "survey" ? "exam-survey.yml" : "feedback.yml" });
  return `https://github.com/${feedback.githubOwner}/${feedback.feedbackRepo}/issues/new?${params.toString()}`;
}

export const feedbackEmail = feedback.email;
export const feedbackConfigured = !feedback.githubOwner.startsWith("[");
