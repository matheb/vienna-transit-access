// @vitest-environment jsdom
import "@/test/setupDom";
import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettledAnnouncement } from "@/hooks/useSettledAnnouncement";

const TEST_DELAY_MS = 100;

function renderAnnouncement(initialText: string | null, options: { strict?: boolean } = {}) {
  return renderHook(({ text }) => useSettledAnnouncement(text, TEST_DELAY_MS), {
    initialProps: { text: initialText },
    wrapper: options.strict ? StrictMode : undefined,
  });
}

function advanceTime(milliseconds: number) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSettledAnnouncement", () => {
  it("is empty while the text is null and does not announce the first text (the baseline)", () => {
    const { result, rerender } = renderAnnouncement(null);
    expect(result.current).toBe("");
    rerender({ text: "first" });
    advanceTime(TEST_DELAY_MS);
    expect(result.current).toBe("");
  });

  it("announces a changed text only after it has not changed for the delay", () => {
    const { result, rerender } = renderAnnouncement("first");
    rerender({ text: "second" });
    advanceTime(TEST_DELAY_MS - 1);
    expect(result.current).toBe("");
    advanceTime(1);
    expect(result.current).toBe("second");
  });

  it("announces only the last of quick successive changes", () => {
    const { result, rerender } = renderAnnouncement("first");
    rerender({ text: "second" });
    advanceTime(TEST_DELAY_MS / 2);
    rerender({ text: "third" });
    advanceTime(TEST_DELAY_MS / 2);
    expect(result.current).toBe("");
    advanceTime(TEST_DELAY_MS / 2);
    expect(result.current).toBe("third");
  });

  it("keeps a single pending timer: every new change cancels the previous one", () => {
    const { rerender } = renderAnnouncement("first");
    rerender({ text: "second" });
    rerender({ text: "third" });
    expect(vi.getTimerCount()).toBe(1);
  });

  it("clears the announcement when the text becomes null", () => {
    const { result, rerender } = renderAnnouncement("first");
    rerender({ text: "second" });
    advanceTime(TEST_DELAY_MS);
    expect(result.current).toBe("second");
    rerender({ text: null });
    expect(result.current).toBe("");
  });

  it("cancels the pending announcement on unmount", () => {
    const { rerender, unmount } = renderAnnouncement("first");
    rerender({ text: "second" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("behaves the same under Strict Mode's double effects", () => {
    const { result, rerender } = renderAnnouncement(null, { strict: true });
    rerender({ text: "first" });
    advanceTime(TEST_DELAY_MS);
    expect(result.current).toBe("");
    rerender({ text: "second" });
    expect(vi.getTimerCount()).toBe(1);
    advanceTime(TEST_DELAY_MS);
    expect(result.current).toBe("second");
  });
});
