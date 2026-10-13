"use client";
import { useEffect, useState } from "react";
import { content } from "@/adapters/content";
import type { PublicManifest, PublicSource } from "@/contract";

/** Re-render when on-device progress changes (this tab or another). */
export function useProgressVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((x) => x + 1);
    window.addEventListener("cusp-progress", bump);
    let ch: BroadcastChannel | undefined;
    try {
      ch = new BroadcastChannel("cusp-progress");
      ch.onmessage = bump;
    } catch {
      /* unsupported */
    }
    return () => {
      window.removeEventListener("cusp-progress", bump);
      ch?.close();
    };
  }, []);
  return v;
}

export interface AsyncState<T> {
  data?: T;
  error?: Error;
  loading: boolean;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fn().then(
      (data) => alive && setState({ data, loading: false }),
      (error: Error) => alive && setState({ error, loading: false }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useManifest() {
  return useAsync<PublicManifest | null>(() => content.getManifest(), []);
}

export function useSources() {
  return useAsync<Map<string, PublicSource>>(async () => {
    const m = await content.getManifest();
    if (!m) return new Map();
    return new Map((await content.getSources()).map((s) => [s.id, s]));
  }, []);
}
