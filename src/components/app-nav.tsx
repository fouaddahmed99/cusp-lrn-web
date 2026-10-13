"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BASE_PATH } from "@/lib/base";

const LINKS = [
  ["/app/", "Dashboard"],
  ["/app/qbank/", "Question bank"],
  ["/app/simulator/", "QE simulator"],
  ["/app/oce/", "OCE practice"],
  ["/app/flashcards/", "Flashcards"],
  ["/app/library/", "High-yield library"],
  ["/app/audio/", "Audio review"],
  ["/app/analytics/", "Analytics"],
  ["/app/planner/", "Study planner"],
  ["/app/settings/", "Settings & backup"],
] as const;

export function AppNav() {
  const path = (usePathname() ?? "").replace(BASE_PATH, "") || "/";
  const norm = path.endsWith("/") ? path : `${path}/`;
  return (
    <nav aria-label="Study tools" className="no-print">
      <ul className="flex gap-1 overflow-x-auto pb-2 text-sm lg:flex-col lg:overflow-visible">
        {LINKS.map(([href, label]) => {
          const active = href === "/app/" ? norm === "/app/" : norm.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={`block whitespace-nowrap rounded-md px-3 py-2 no-underline ${active ? "bg-[var(--surface-2)] font-semibold text-[var(--ink)]" : "muted hover:bg-[var(--surface-2)]"}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
