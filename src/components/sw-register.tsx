"use client";
import { useEffect } from "react";
import { asset } from "@/lib/base";

/** Registers the offline service worker in production builds (PWA, Part J5). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/") }).catch(() => undefined);
  }, []);
  return null;
}
