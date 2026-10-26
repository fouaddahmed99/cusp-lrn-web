import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { activeProductLine, brand } from "@config";
import { SiteFooter, SiteHeader } from "@/components/site";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { UpdateBanner } from "@/components/update-banner";
import { themeScript } from "@/components/theme";
import { asset } from "@/lib/base";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${activeProductLine.shortName}`, template: `%s · ${brand.name}` },
  description: "Free, source-grounded board prep for pediatric dentistry residents. Every fact is cited to a free, public primary source you can check yourself.",
  applicationName: brand.name,
  manifest: asset("/manifest.webmanifest"),
  icons: { icon: asset("/brand/icon-temporary.svg") },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <SiteFooter />
        <ServiceWorkerRegister />
        <UpdateBanner />
      </body>
    </html>
  );
}
