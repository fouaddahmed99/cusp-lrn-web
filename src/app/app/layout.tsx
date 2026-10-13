import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";

export const metadata: Metadata = { title: "Study" };

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <AppNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
