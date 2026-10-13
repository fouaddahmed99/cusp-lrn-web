import { describe, expect, it } from "vitest";
import { progress } from "@/adapters/progress";

describe("on-device progress (IndexedDB) backup", () => {
  it("exports and re-imports everything", async () => {
    await progress.clearAll();
    await progress.addAttempt({ itemId: "i", version: 1, sessionId: "s", kind: "qbank", selected: "A", correct: true, timeMs: 1, at: "2026-10-12T00:00:00Z", domainId: "d", subtopicId: "s", taskStatementId: "t", cognitiveLevel: "remember" });
    await progress.saveProfile({ examDate: "2027-05-01", onboarded: true });
    const text = await (await progress.exportBackup()).text();
    await progress.clearAll();
    expect(await progress.attempts()).toHaveLength(0);
    const r = await progress.importBackup(text, "replace");
    expect(r.records).toBeGreaterThan(0);
    expect(await progress.attempts()).toHaveLength(1);
    expect((await progress.profile()).examDate).toBe("2027-05-01");
    // Merge does not overwrite: attempts are appended.
    await progress.importBackup(text, "merge");
    expect(await progress.attempts()).toHaveLength(2);
  });
  it("rejects files that are not CUSP LRN backups", async () => {
    await expect(progress.importBackup(JSON.stringify({ hello: 1 }), "merge")).rejects.toThrow();
  });
});
