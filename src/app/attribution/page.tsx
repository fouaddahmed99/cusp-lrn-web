"use client";
import { ContentGate } from "@/components/content-gate";
import { useSources } from "@/components/hooks";
import { PageTitle, Spinner } from "@/components/ui";

export default function Attribution() {
  const sources = useSources();
  return (
    <div className="max-w-4xl">
      <PageTitle title="Sources & attribution" subtitle="Every source cited on this site, with a link to its public page. Openly licensed (e.g., CC BY) sources and images are credited here as their licenses require." />
      <ContentGate>
        {() =>
          sources.loading ? (
            <Spinner />
          ) : (
            <ul className="flex flex-col gap-3">
              {[...(sources.data?.values() ?? [])].map((s) => (
                <li key={s.id} className="surface rounded-lg p-4">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium">
                    {s.title} ↗
                  </a>
                  <p className="muted text-sm">
                    {s.organization} · {s.versionLabel || s.year} · {s.licenseLabel}
                  </p>
                  {s.attribution && <p className="mt-1 text-sm">{s.attribution}</p>}
                </li>
              ))}
            </ul>
          )
        }
      </ContentGate>
      <p className="muted mt-6 text-sm">Facts from sources that are free to read but not openly licensed are paraphrased and cited; no text, tables or figures are reproduced from them.</p>
    </div>
  );
}
