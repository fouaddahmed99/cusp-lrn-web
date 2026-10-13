"use client";
import { useEffect, useRef, useState } from "react";
import { content } from "@/adapters/content";
import { progress } from "@/adapters/progress";
import { ContentGate } from "@/components/content-gate";
import { Button, Card, EmptyState, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import type { PublicManifest } from "@/contract";
import { speakQueue, speechSupported } from "@/lib/speech";

function Audio({ m }: { m: PublicManifest }) {
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState<string | null>(null);
  const [line, setLine] = useState("");
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => {
    progress.settings().then((s) => setRate(s.speechRate));
    return () => stop.current?.();
  }, []);
  const subs = m.subtopics.filter((s) => m.noteSubtopics.includes(s.id));
  if (!speechSupported()) return <EmptyState title="Audio review needs a browser with text-to-speech">Most current browsers support it.</EmptyState>;
  const play = async (id: string) => {
    stop.current?.();
    if (playing === id) {
      setPlaying(null);
      return;
    }
    const notes = await content.getNotes(id);
    const texts = notes.sections.flatMap((s) => [s.heading, ...s.bullets.map((b) => b.text), ...(s.mustKnowNumbers ?? []).map((b) => b.text)]);
    setPlaying(id);
    stop.current = speakQueue(texts, { rate, onIndex: (i) => setLine(texts[i] ?? ""), onEnd: () => setPlaying(null) });
  };
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Audio review" subtitle="Listen to approved high-yield notes using your browser's built-in voice." />
      <Card className="max-w-sm">
        <Field id="rate" label={`Speed: ${rate.toFixed(1)}×`}>
          <input
            id="rate"
            type="range"
            min={0.6}
            max={1.8}
            step={0.1}
            value={rate}
            className={inputClass}
            onChange={async (e) => {
              const r = Number(e.target.value);
              setRate(r);
              const s = await progress.settings();
              await progress.saveSettings({ ...s, speechRate: r });
            }}
          />
        </Field>
      </Card>
      {playing && (
        <Notice title="Now playing">
          <span aria-live="polite">{line}</span>
        </Notice>
      )}
      {subs.length === 0 && <EmptyState title="No notes published yet" />}
      <ul className="grid gap-3 md:grid-cols-2">
        {subs.map((s) => (
          <li key={s.id}>
            <Card className="flex items-center justify-between gap-3">
              <span>{s.name}</span>
              <Button variant={playing === s.id ? "danger" : "secondary"} onClick={() => play(s.id)}>
                {playing === s.id ? "■ Stop" : "▶ Play"}
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      <p className="muted text-xs">Citations are shown on the written notes in the library; audio reads the note text only.</p>
    </div>
  );
}

export default function AudioPage() {
  return <ContentGate>{(m) => <Audio m={m} />}</ContentGate>;
}
