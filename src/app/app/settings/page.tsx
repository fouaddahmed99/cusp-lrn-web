"use client";
import { useEffect, useRef, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { feedbackConfigured, feedbackEmail, feedbackUrl } from "@/adapters/feedback";
import { applyTheme } from "@/components/theme";
import { Button, Card, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import { downloadBlob } from "@/lib/csv";
import type { Settings } from "@/lib/types";
import { flags } from "@config";

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({ theme: "system", speechRate: 1 });
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirmClear, setConfirmClear] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    progress.settings().then(setS);
  }, []);

  const save = async (next: Settings) => {
    setS(next);
    applyTheme(next.theme);
    await progress.saveSettings(next);
  };
  const exportProgress = async () => {
    downloadBlob(await progress.exportBackup(), `cusp-lrn-progress-${new Date().toISOString().slice(0, 10)}.json`);
    setMsg("Backup file saved to your device.");
  };
  const importProgress = async (f: File) => {
    try {
      const r = await progress.importBackup(await f.text(), mode);
      setMsg(`Imported ${r.records} records (${mode}).`);
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}. Is this a CUSP LRN progress file?`);
    }
  };
  const offline = async () => {
    const urls = await content.allUrls();
    const reg = await navigator.serviceWorker?.getRegistration();
    if (!reg?.active) {
      setMsg("Offline mode needs the installed site (production build). Open the live site and try again.");
      return;
    }
    reg.active.postMessage({ type: "cache-urls", urls });
    setMsg(`Saving ${urls.length} content files for offline use…`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageTitle title="Settings & backup" />
      <Notice title="Your progress lives only on this device" tone="warn">
        Answers, flags, notes, flashcards and your study plan are stored in this browser. Clearing browser data or using private browsing will erase them. Export a backup regularly; import it to restore or to move to another device.
      </Notice>
      {msg && (
        <p role="status" className="surface rounded-lg p-3 text-sm">
          {msg}
        </p>
      )}
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Backup</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportProgress}>Export progress</Button>
          <Button variant="secondary" onClick={() => file.current?.click()}>
            Import progress…
          </Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])} aria-label="Choose a progress backup file" />
        </div>
        <Field id="importMode" label="When importing">
          <select id="importMode" className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as "merge" | "replace")}>
            <option value="merge">Merge with what is on this device</option>
            <option value="replace">Replace everything on this device</option>
          </select>
        </Field>
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Appearance & audio</h2>
        <Field id="theme" label="Theme">
          <select id="theme" className={inputClass} value={s.theme} onChange={(e) => save({ ...s, theme: e.target.value as Settings["theme"] })}>
            <option value="system">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Offline</h2>
        <p className="muted text-sm">Install the site (your browser&apos;s “Install app” or “Add to Home Screen”), then save all published content for studying without a connection.</p>
        <div>
          <Button variant="secondary" onClick={offline}>
            Make all content available offline
          </Button>
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Feedback</h2>
        {feedbackConfigured ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={feedbackUrl("feedback")} target="_blank" rel="noopener noreferrer">
              Send feedback (GitHub) ↗
            </a>
            <a href={feedbackUrl("survey")} target="_blank" rel="noopener noreferrer">
              Exam outcome survey ↗
            </a>
          </div>
        ) : null}
        <p className="muted text-sm">
          Or email <span className="font-mono">{feedbackEmail}</span>.
        </p>
        {flags.DONATIONS_ENABLED && flags.DONATION_URL && (
          <a href={flags.DONATION_URL} target="_blank" rel="noopener noreferrer" className="text-sm">
            Support the project ↗
          </a>
        )}
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Erase all progress on this device</h2>
        {!confirmClear ? (
          <div>
            <Button variant="danger" onClick={() => setConfirmClear(true)}>
              Erase…
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">This cannot be undone. Export a backup first if you want to keep it.</span>
            <Button
              variant="danger"
              onClick={async () => {
                await progress.clearAll();
                setConfirmClear(false);
                setMsg("All progress on this device was erased.");
              }}
            >
              Yes, erase everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
