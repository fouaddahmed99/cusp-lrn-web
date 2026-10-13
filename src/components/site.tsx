import Link from "next/link";
import { activeProductLine, brand } from "@config";
import { asset } from "@/lib/base";
import { ThemeToggle } from "./theme";

export function SiteHeader() {
  return (
    <header className="surface sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 no-underline" aria-label={`${brand.name} home`}>
          <img src={asset(brand.logo.src)} alt="" width={132} height={28} className="h-7 w-auto dark:brightness-[1.8]" />
          <span className="muted hidden text-xs sm:inline">{activeProductLine.shortName}</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1 text-sm">
          <Link className="rounded-md px-3 py-2 no-underline hover:bg-[var(--surface-2)]" href="/features/">
            Features
          </Link>
          <Link className="rounded-md px-3 py-2 no-underline hover:bg-[var(--surface-2)]" href="/content-integrity/">
            Content integrity
          </Link>
          <Link className="rounded-md px-3 py-2 no-underline hover:bg-[var(--surface-2)]" href="/faq/">
            FAQ
          </Link>
          <Link className="rounded-md bg-[var(--brand)] px-3 py-2 font-medium text-[var(--brand-ink)] no-underline" href="/app/">
            Start studying
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t line">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-semibold">{brand.name}</p>
          <p className="muted mt-2">{activeProductLine.name}. Free during launch. No account needed; your progress stays on your device.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-1">
          <Link href="/content-integrity/">Content integrity</Link>
          <Link href="/attribution/">Sources &amp; attribution</Link>
          <Link href="/blog/">Blog</Link>
          <Link href="/legal/terms/">Terms</Link>
          <Link href="/legal/privacy/">Privacy</Link>
          <Link href="/legal/refunds/">Refunds</Link>
          <Link href="/legal/disclaimer/">Disclaimer</Link>
        </nav>
        <p className="muted text-xs leading-relaxed">
          Not affiliated with or endorsed by the ABPD, AAPD, ADA, AHA, or IADT. All questions are original; no actual exam items are used. Educational content only, not clinical advice.
          <br />
          <br />
          {brand.copyright(year)}
        </p>
      </div>
    </footer>
  );
}
