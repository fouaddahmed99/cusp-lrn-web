/** Browser text-to-speech (Web Speech API). No paid TTS (Part J6). */
export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function speakQueue(texts: string[], opts: { rate: number; onIndex?: (i: number) => void; onEnd?: () => void }) {
  if (!speechSupported()) return () => undefined;
  window.speechSynthesis.cancel();
  let cancelled = false;
  const next = (i: number) => {
    if (cancelled) return;
    if (i >= texts.length) {
      opts.onEnd?.();
      return;
    }
    opts.onIndex?.(i);
    const u = new SpeechSynthesisUtterance(texts[i]);
    u.rate = opts.rate;
    u.onend = () => next(i + 1);
    u.onerror = () => next(i + 1);
    window.speechSynthesis.speak(u);
  };
  next(0);
  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
  };
}
