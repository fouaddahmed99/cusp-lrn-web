import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-[var(--brand)] text-[var(--brand-ink)] hover:opacity-90 border border-transparent",
  secondary: "surface hover:bg-[var(--surface-2)]",
  ghost: "border border-transparent hover:bg-[var(--surface-2)]",
  danger: "bg-[var(--color-bad)] text-white hover:opacity-90 border border-transparent",
};
const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed min-h-10";

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({ href, variant = "primary", className = "", children }: { href: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} no-underline ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`surface rounded-xl p-5 ${className}`}>{children}</As>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "bad" | "warn" | "brand" }) {
  const tones = {
    neutral: "bg-[var(--surface-2)] muted",
    ok: "bg-[color-mix(in_srgb,var(--color-ok)_15%,transparent)] text-[var(--color-ok)] dark:text-green-300",
    bad: "bg-[color-mix(in_srgb,var(--color-bad)_15%,transparent)] text-[var(--color-bad)] dark:text-red-300",
    warn: "bg-[color-mix(in_srgb,var(--color-warn)_15%,transparent)] text-[var(--color-warn)] dark:text-amber-300",
    brand: "bg-[color-mix(in_srgb,var(--brand)_15%,transparent)] text-[var(--brand)]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Notice({ children, tone = "info", title }: { children: ReactNode; tone?: "info" | "warn"; title?: string }) {
  const border = tone === "warn" ? "border-l-[var(--color-warn)]" : "border-l-[var(--brand)]";
  return (
    <div role={tone === "warn" ? "alert" : "note"} className={`surface rounded-lg border-l-4 ${border} p-4 text-sm`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="muted">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="surface rounded-xl p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="muted mt-2 text-sm">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="muted flex items-center gap-2 py-8 text-sm">
      <span aria-hidden className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand)]" />
      {label}
    </p>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface rounded-xl p-4">
      <p className="muted text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="muted mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, children, hint, id }: { label: string; children: ReactNode; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="muted text-xs">{hint}</p>}
    </div>
  );
}

export const inputClass = "surface rounded-lg px-3 py-2 text-sm min-h-10";
