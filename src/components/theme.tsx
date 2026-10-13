"use client";
import { useEffect, useState } from "react";
import { progress } from "@/adapters/progress";
import type { Settings } from "@/lib/types";

const KEY = "cusp-theme";

/** Inline, runs before paint to avoid a flash of the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function applyTheme(theme: Settings["theme"]) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode */
  }
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = async () => {
    const next: Settings["theme"] = dark ? "light" : "dark";
    applyTheme(next);
    setDark(!dark);
    const s = await progress.settings();
    await progress.saveSettings({ ...s, theme: next });
  };
  return (
    <button type="button" onClick={toggle} className="rounded-md px-3 py-2 hover:bg-[var(--surface-2)]" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <span aria-hidden>{dark ? "☀" : "☾"}</span>
    </button>
  );
}
