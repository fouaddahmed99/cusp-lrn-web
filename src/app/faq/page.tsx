import type { Metadata } from "next";
import { brand } from "@config";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "FAQ" };

const QA: [string, string][] = [
  ["Is it really free?", `Yes. Every feature and all published content is free during the launch period, with no trial limits and no credit card. If paid plans are ever introduced, users will get at least 30 days' notice in the app before anything changes, and access will never be removed silently.`],
  ["Do I need an account?", "No. Open the site and start. Your progress is stored in your browser on this device."],
  ["What happens to my progress if I clear my browser data?", "It is erased, because it only exists on your device. Use Settings → Export progress regularly to save a backup file, and Import progress to restore it or move it to another device."],
  ["Where does the content come from?", "Only from free, public primary sources such as published clinical guidelines, policy documents and government publications. Every fact is cited with a link so you can check it. See the Content Integrity page."],
  ["Are these real exam questions?", "No. All questions are original. No actual or recalled exam items are used, and the platform is not affiliated with or endorsed by the ABPD or any other organization."],
  ["Is this clinical advice?", "No. The content is educational and for exam preparation only. Always follow current guidelines and your clinical judgment."],
  ["Why do some topics have few or no questions?", `${brand.name} would rather show a gap than invent content. Items are added only when the primary sources support them and a person has approved them.`],
  ["How do I report a mistake?", "Use the “Report an error” button under any explanation. It opens a prefilled public issue; you can also email us. Reported items can be pulled from circulation immediately."],
  ["Does it work offline?", "Yes. Install it from your browser (Add to Home Screen / Install app). Pages you have opened, and everything after Settings → Make content available offline, work without a connection."],
];

export default function Faq() {
  return (
    <div className="max-w-3xl">
      <PageTitle title="Frequently asked questions" />
      <div className="flex flex-col gap-3">
        {QA.map(([q, a]) => (
          <details key={q} className="surface rounded-lg p-4">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="muted mt-2 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
