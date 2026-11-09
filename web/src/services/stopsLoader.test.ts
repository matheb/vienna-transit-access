import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Stop } from "@/lib/geo/coverage";
import { startStopsLoad } from "@/services/stopsLoader";
import { fetchStops, StopsLoadStatus } from "@/services/stopsService";
import { getStopFixture } from "@/test/stopFixtures";

vi.mock("@/services/stopsService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/stopsService")>()),
  fetchStops: vi.fn(),
}));

const fetchStopsMock = vi.mocked(fetchStops);
const STOPS = [getStopFixture()];
const FETCH_ERROR = new Error("Failed to load stops: HTTP 500");

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve));
}

function startLoadWithPendingFetch() {
  const pendingStops = Promise.withResolvers<Stop[]>();
  fetchStopsMock.mockReturnValue(pendingStops.promise);
  const handleStopsLoaded = vi.fn();
  const handleLoadStatusChange = vi.fn();
  const ignoreResult = startStopsLoad(handleStopsLoaded, handleLoadStatusChange);
  return { pendingStops, handleStopsLoaded, handleLoadStatusChange, ignoreResult };
}

beforeEach(() => {
  fetchStopsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("startStopsLoad", () => {
  it("reports the stops and the ready status on success", async () => {
    const { pendingStops, handleStopsLoaded, handleLoadStatusChange } = startLoadWithPendingFetch();
    pendingStops.resolve(STOPS);
    await flushPromises();

    expect(handleStopsLoaded).toHaveBeenCalledExactlyOnceWith(STOPS);
    expect(handleLoadStatusChange).toHaveBeenCalledExactlyOnceWith(StopsLoadStatus.ready);
  });

  it("reports the error status and logs the error on failure", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { pendingStops, handleStopsLoaded, handleLoadStatusChange } = startLoadWithPendingFetch();
    pendingStops.reject(FETCH_ERROR);
    await flushPromises();

    expect(handleStopsLoaded).not.toHaveBeenCalled();
    expect(handleLoadStatusChange).toHaveBeenCalledExactlyOnceWith(StopsLoadStatus.error);
    expect(consoleErrorSpy).toHaveBeenCalledWith(FETCH_ERROR);
  });

  it("ignores a successful result that arrives after cancelling", async () => {
    const { pendingStops, handleStopsLoaded, handleLoadStatusChange, ignoreResult } = startLoadWithPendingFetch();
    ignoreResult();
    pendingStops.resolve(STOPS);
    await flushPromises();

    expect(handleStopsLoaded).not.toHaveBeenCalled();
    expect(handleLoadStatusChange).not.toHaveBeenCalled();
  });

  it("ignores a failure that arrives after cancelling", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { pendingStops, handleLoadStatusChange, ignoreResult } = startLoadWithPendingFetch();
    ignoreResult();
    pendingStops.reject(FETCH_ERROR);
    await flushPromises();

    expect(handleLoadStatusChange).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
