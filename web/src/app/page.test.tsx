// @vitest-environment jsdom
import "@/test/setupDom";
import { StrictMode, type ComponentProps } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import type TransitMap from "@/components/TransitMap";
import type { Stop } from "@/lib/geo/coverage";
import { fetchStops } from "@/services/stopsService";
import { getStopFixture } from "@/test/stopFixtures";

type TransitMapProps = ComponentProps<typeof TransitMap>;

const { transitMapMock } = vi.hoisted(() => ({
  transitMapMock: vi.fn<(props: TransitMapProps) => null>(() => null),
}));

vi.mock("@/components/TransitMap", () => ({ default: transitMapMock }));
vi.mock("@/services/stopsService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/stopsService")>()),
  fetchStops: vi.fn(),
}));

const fetchStopsMock = vi.mocked(fetchStops);

// With the default filters (weekday, am, at least 4 departures, all modes) the tram and bus stops qualify.
const TRAM_STOP = getStopFixture({
  id: "tram-stop",
  modes: ["tram"],
  coordinates: [16.37, 48.21],
  departuresPerHour: 10,
  departuresOverrides: { sunday: { am: 0 } },
});
const BUS_STOP = getStopFixture({
  id: "bus-stop",
  modes: ["bus"],
  coordinates: [16.4, 48.22],
  departuresPerHour: 5,
  departuresOverrides: { weekday: { pm: 0 } },
});
const RARE_METRO_STOP = getStopFixture({
  id: "rare-metro-stop",
  modes: ["metro"],
  coordinates: [16.3, 48.2],
  departuresPerHour: 2,
});
const ALL_STOPS = [TRAM_STOP, BUS_STOP, RARE_METRO_STOP];
const FETCH_ERROR = new Error("Failed to load stops: HTTP 500");

function getLatestMapProps() {
  const latestCall = transitMapMock.mock.lastCall;
  if (!latestCall) throw new Error("TransitMap has not rendered yet");
  return latestCall[0];
}

function getMapStopIds() {
  return getLatestMapProps().stops.features.map((feature) => feature.properties?.id);
}

function getStopsSummary() {
  return screen.getByText(/stops qualify/);
}

function getButton(name: string) {
  return screen.getByRole("button", { name });
}

async function waitForMapToRender() {
  await waitFor(() => expect(transitMapMock).toHaveBeenCalled());
}

async function renderLoadedHome() {
  fetchStopsMock.mockResolvedValue(ALL_STOPS);
  render(<Home />);
  await waitForMapToRender();
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  await waitFor(() => expect(getMapStopIds()).toEqual(["tram-stop", "bus-stop"]));
}

async function expectQualifyingStops(summary: string, stopIds: string[]) {
  await waitFor(() => {
    expect(getStopsSummary()).toHaveTextContent(summary);
    expect(getMapStopIds()).toEqual(stopIds);
  });
}

async function pressArrowRightOn(slider: HTMLElement, pressCount = 1) {
  slider.focus();
  await userEvent.keyboard("{ArrowRight}".repeat(pressCount));
}

beforeEach(() => {
  transitMapMock.mockClear();
  fetchStopsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("while the stops are loading", () => {
  it("shows the loading text, keeps the controls usable and gives the map no stops", async () => {
    fetchStopsMock.mockReturnValue(new Promise<Stop[]>(() => {}));
    render(<Home />);
    await waitForMapToRender();

    expect(screen.getByRole("status")).toHaveTextContent(/^Loading stops…$/);
    expect(getMapStopIds()).toEqual([]);
    expect(screen.getByLabelText(/walking radius/i)).toBeEnabled();

    await userEvent.click(getButton("saturday"));
    expect(getButton("saturday")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("after the stops load", () => {
  it("removes the loading text, shows the counts and gives the map the qualifying stops and an area", async () => {
    await renderLoadedHome();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(getStopsSummary()).toBeVisible();
    expect(getStopsSummary()).toHaveTextContent("2 of 3 stops qualify");
    expect(getLatestMapProps().area).not.toBeNull();
  });

  it("updates the counts and map stops when the day changes", async () => {
    await renderLoadedHome();
    await userEvent.click(getButton("sunday"));
    await expectQualifyingStops("1 of 3 stops qualify", ["bus-stop"]);
  });

  it("updates the counts and map stops when the time band changes", async () => {
    await renderLoadedHome();
    await userEvent.click(getButton("pm"));
    await expectQualifyingStops("1 of 3 stops qualify", ["tram-stop"]);
  });

  it("updates the counts and map stops when a mode is turned off", async () => {
    await renderLoadedHome();
    await userEvent.click(getButton("tram"));
    await expectQualifyingStops("1 of 3 stops qualify", ["bus-stop"]);
  });

  it("updates the counts and map stops when the minimum departures rise", async () => {
    await renderLoadedHome();
    await pressArrowRightOn(screen.getByLabelText(/min\. departures/i), 2);
    await expectQualifyingStops("1 of 3 stops qualify", ["tram-stop"]);
  });

  it("changes the area given to the map when the radius changes", async () => {
    await renderLoadedHome();
    const initialArea = getLatestMapProps().area;

    await pressArrowRightOn(screen.getByLabelText(/walking radius/i));

    await waitFor(() => expect(getLatestMapProps().area).not.toEqual(initialArea));
    expect(getLatestMapProps().area).not.toBeNull();
  });

  it("gives no stops and a null area when all modes are off", async () => {
    await renderLoadedHome();
    for (const mode of ["tram", "metro", "rail", "bus"]) {
      await userEvent.click(getButton(mode));
    }

    await expectQualifyingStops("0 of 3 stops qualify", []);
    expect(getLatestMapProps().area).toBeNull();
  });
});

describe("after the fetch fails", () => {
  it("shows the alert, keeps the controls usable and handles the rejection", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchStopsMock.mockRejectedValue(FETCH_ERROR);
    render(<Home />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/^Could not load stops\. Please reload the page\.$/);
    expect(consoleErrorSpy).toHaveBeenCalledWith(FETCH_ERROR);

    await userEvent.click(getButton("sunday"));
    expect(getButton("sunday")).toHaveAttribute("aria-pressed", "true");
  });
});

describe("results that arrive late", () => {
  // A successful late result is invisible here (setState after unmount is a silent no-op); stopsLoader.test.ts covers it.
  it("ignores a failure that arrives after the page unmounts", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const pendingStops = Promise.withResolvers<Stop[]>();
    fetchStopsMock.mockReturnValue(pendingStops.promise);
    const { unmount } = render(<Home />);
    await waitForMapToRender();

    unmount();
    await act(async () => pendingStops.reject(FETCH_ERROR));

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(FETCH_ERROR);
  });

  it("does not let the ignored first Strict Mode fetch overwrite the second", async () => {
    const firstFetch = Promise.withResolvers<Stop[]>();
    const secondFetch = Promise.withResolvers<Stop[]>();
    fetchStopsMock.mockReturnValueOnce(firstFetch.promise).mockReturnValueOnce(secondFetch.promise);
    render(<StrictMode><Home /></StrictMode>);
    await waitForMapToRender();
    expect(fetchStopsMock).toHaveBeenCalledTimes(2);

    await act(async () => secondFetch.resolve([TRAM_STOP, BUS_STOP]));
    await expectQualifyingStops("2 of 2 stops qualify", ["tram-stop", "bus-stop"]);

    await act(async () => firstFetch.resolve(ALL_STOPS));
    expect(getStopsSummary()).toHaveTextContent("2 of 2 stops qualify");
    expect(getMapStopIds()).toEqual(["tram-stop", "bus-stop"]);
  });
});
