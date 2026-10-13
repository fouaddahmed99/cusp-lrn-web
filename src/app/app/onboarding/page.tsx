"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { progress } from "@/adapters/progress";
import { Button, Card, Field, PageTitle, inputClass } from "@/components/ui";
import type { Profile } from "@/lib/types";

export default function Onboarding() {
  const router = useRouter();
  const [p, setP] = useState<Profile>({ weeklyHours: 10, examKind: "QE" });
  useEffect(() => {
    progress.profile().then((x) => setP((cur) => ({ ...cur, ...x })));
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await progress.saveProfile({ ...p, onboarded: true });
    router.push("/app/planner/");
  };
  return (
    <div className="max-w-xl">
      <PageTitle title="Set up your study plan" subtitle="Stored only on this device. All fields are optional except the exam date for planning." />
      <Card>
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field id="examKind" label="Which exam are you preparing for?">
            <select id="examKind" className={inputClass} value={p.examKind} onChange={(e) => setP({ ...p, examKind: e.target.value as Profile["examKind"] })}>
              <option value="QE">Qualifying Exam (QE)</option>
              <option value="OCE">Oral Clinical Exam (OCE)</option>
              <option value="both">Both</option>
            </select>
          </Field>
          <Field id="examDate" label="Exam date">
            <input id="examDate" type="date" required className={inputClass} value={p.examDate ?? ""} onChange={(e) => setP({ ...p, examDate: e.target.value })} />
          </Field>
          <Field id="hours" label="Study hours per week" hint="We plan six study days a week.">
            <input id="hours" type="number" min={1} max={60} className={inputClass} value={p.weeklyHours ?? 10} onChange={(e) => setP({ ...p, weeklyHours: Number(e.target.value) })} />
          </Field>
          <Field id="pgy" label="Training year (optional)">
            <select id="pgy" className={inputClass} value={p.pgyYear ?? ""} onChange={(e) => setP({ ...p, pgyYear: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="PGY-1">PGY-1</option>
              <option value="PGY-2">PGY-2</option>
              <option value="PGY-3">PGY-3</option>
              <option value="graduate">Graduated</option>
            </select>
          </Field>
          <Field id="program" label="Residency program (optional)">
            <input id="program" className={inputClass} value={p.program ?? ""} onChange={(e) => setP({ ...p, program: e.target.value })} />
          </Field>
          <Button type="submit">Save and see my plan</Button>
        </form>
      </Card>
    </div>
  );
}
