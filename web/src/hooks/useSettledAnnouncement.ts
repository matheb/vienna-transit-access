import { useEffect, useRef, useState } from "react";

interface LastTextRef {
  current: string | null;
}

// Decides what the status element says for the latest text. Returns the cleanup that cancels a pending announcement.
// - null (loading or error): clear the announcement, and treat the next text as a new baseline.
// - The first text after null is the baseline: shown on screen already, so it is not announced.
// - The same text as the last baseline or announcement: nothing to say.
// - A different text: announce it once it has not changed for delayMs.
function scheduleAnnouncement(
  text: string | null,
  delayMs: number,
  lastTextRef: LastTextRef,
  setAnnouncement: (announcement: string) => void,
): (() => void) | undefined {
  if (text === null) {
    lastTextRef.current = null;
    setAnnouncement("");
    return undefined;
  }
  if (lastTextRef.current === null) {
    lastTextRef.current = text;
    return undefined;
  }
  if (text === lastTextRef.current) return undefined;
  const timer = setTimeout(() => {
    lastTextRef.current = text;
    setAnnouncement(text);
  }, delayMs);
  return () => clearTimeout(timer);
}

// The text a live region should hold: empty until the text changes after the first one, then each changed text once it
// has settled for delayMs. Every new text and unmounting cancel the pending one. Under Strict Mode's double effects the
// second run sees the same text and baseline as the first, so it neither announces nor sets a second timer.
export function useSettledAnnouncement(text: string | null, delayMs: number): string {
  const [announcement, setAnnouncement] = useState("");
  const lastTextRef = useRef<string | null>(null);
  useEffect(() => scheduleAnnouncement(text, delayMs, lastTextRef, setAnnouncement), [text, delayMs]);
  return announcement;
}
