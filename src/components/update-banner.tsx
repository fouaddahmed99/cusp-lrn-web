"use client";
import { useEffect, useRef, useState } from "react";
import { content } from "@/adapters/content";
import { asset } from "@/lib/base";
import { Button } from "@/components/ui";

const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * Tells the student when new content or a new app version has been published,
 * without forcing a reload. Progress and sessions live in IndexedDB, so a reload
 * keeps them; the student chooses when (e.g. between questions).
 */
export function UpdateBanner() {
  const [show, setShow] = useState(false);
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    content
      .getManifest()
      .then((m) => {
        loaded.current = m?.contentVersion ?? null;
      })
      .catch(() => undefined);

    const check = async () => {
      if (!alive || loaded.current === null || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(asset("/content/manifest.json"), { cache: "no-store" });
        if (!res.ok) return;
        const m = (await res.json()) as { contentVersion?: string };
        if (alive && m.contentVersion && m.contentVersion !== loaded.current) setShow(true);
      } catch {
        /* offline: nothing to do */
      }
    };
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);

    // A new app version: the service worker installs it in the background.
    let reg: ServiceWorkerRegistration | undefined;
    const onUpdateFound = () => {
      const w = reg?.installing;
      w?.addEventListener("statechange", () => {
        if (alive && w.state === "activated" && navigator.serviceWorker.controller) setShow(true);
      });
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((r) => {
        reg = r;
        r?.addEventListener("updatefound", onUpdateFound);
      }).catch(() => undefined);
    }

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      reg?.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  if (!show) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(36rem,calc(100%-2rem))] flex-wrap items-center gap-3 rounded-lg border surface p-4 text-sm shadow-lg">
      <p className="min-w-0 flex-1">
        <span className="font-semibold">An update is available.</span>{" "}
        <span className="muted">Reload when you are between questions. Your progress and sessions are saved.</span>
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
      <Button variant="ghost" onClick={() => setShow(false)}>Later</Button>
    </div>
  );
}
