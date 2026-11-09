import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStops, STOPS_URL } from "@/services/stopsService";
import { getStopFixture } from "@/test/stopFixtures";

const STOPS = [getStopFixture()];

function stubFetchResponse(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchStops", () => {
  it("returns the features of an OK response", async () => {
    const fetchMock = stubFetchResponse({ ok: true, status: 200, json: async () => ({ features: STOPS }) });

    await expect(fetchStops()).resolves.toEqual(STOPS);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(STOPS_URL);
  });

  it("rejects with the HTTP status on a non-OK response", async () => {
    stubFetchResponse({ ok: false, status: 404 });

    await expect(fetchStops()).rejects.toThrow("HTTP 404");
  });
});
