// @vitest-environment jsdom
import "@/test/setupDom";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResultsCard from "@/components/ResultsCard";
import { RESULTS_ANNOUNCEMENT_DELAY_MS } from "@/constants/home";
import { messages as englishMessages } from "@/i18n/en";
import { MessagesProvider } from "@/i18n/MessagesProvider";
import { StopsLoadStatus } from "@/services/stopsService";

const COVERAGE = { polygon: null, areaKm2: 12.34, viennaShare: 0.034 };
const EMPTY_COVERAGE = { polygon: null, areaKm2: 0, viennaShare: 0 };
const GERMAN_INTL_LOCALE = "de-AT";

function getResultsCard(loadStatus: StopsLoadStatus, qualifyingStopCount = 2, coverage = COVERAGE) {
  return <ResultsCard loadStatus={loadStatus} qualifyingStopCount={qualifyingStopCount} totalStopCount={5} coverage={coverage} />;
}

function renderResultsCard(loadStatus: StopsLoadStatus, qualifyingStopCount = 2, coverage = COVERAGE) {
  return render(getResultsCard(loadStatus, qualifyingStopCount, coverage));
}

afterEach(() => {
  vi.useRealTimers();
});

function getStopsSummary() {
  return screen.getByText(/stops qualify/);
}

function getAreaSummary() {
  return screen.getByText(/Covered area:/);
}

function getShareSummary() {
  return screen.getByText(/of Vienna, approx\./);
}

function queryStopsSummary() {
  return screen.queryByText(/stops qualify/);
}

function queryAreaFigure() {
  return screen.queryByText(/km²/);
}

function queryShareFigure() {
  return screen.queryByText(/of Vienna/);
}

function queryLoadingText() {
  return screen.queryByText(/^Loading stops…$/);
}

describe("when ready", () => {
  it("shows the stop count, the area to one decimal, the whole-number share and approx.", () => {
    renderResultsCard(StopsLoadStatus.ready);
    expect(getStopsSummary()).toBeVisible();
    expect(getStopsSummary()).toHaveTextContent("2 of 5 stops qualify");
    expect(getAreaSummary()).toBeVisible();
    expect(getAreaSummary()).toHaveTextContent(/^Covered area: 12\.3 km²$/);
    expect(getShareSummary()).toBeVisible();
    expect(getShareSummary()).toHaveTextContent(/^3% of Vienna, approx\.$/);
  });

  it("shows no loading text or alert", () => {
    renderResultsCard(StopsLoadStatus.ready);
    expect(queryLoadingText()).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has an empty status: the first results are not announced", () => {
    renderResultsCard(StopsLoadStatus.ready);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces the changed results in one sentence once they have settled", () => {
    vi.useFakeTimers();
    const { rerender } = renderResultsCard(StopsLoadStatus.ready, 2);
    rerender(getResultsCard(StopsLoadStatus.ready, 1));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    act(() => vi.advanceTimersByTime(RESULTS_ANNOUNCEMENT_DELAY_MS));
    expect(screen.getByRole("status")).toHaveTextContent(/^1 of 5 stops qualify\. Covered area: 12\.3 km²\. 3% of Vienna, approx\.$/);
  });

  it("renders zero results as 0 and 0.0", () => {
    renderResultsCard(StopsLoadStatus.ready, 0, EMPTY_COVERAGE);
    expect(getStopsSummary()).toHaveTextContent("0 of 5 stops qualify");
    expect(getAreaSummary()).toHaveTextContent(/^Covered area: 0\.0 km²$/);
    expect(getShareSummary()).toHaveTextContent(/^0% of Vienna, approx\.$/);
  });

  it("formats the numbers for the locale it is given", () => {
    render(
      <MessagesProvider messages={englishMessages} intlLocale={GERMAN_INTL_LOCALE} locale="en">
        <ResultsCard loadStatus={StopsLoadStatus.ready} qualifyingStopCount={2} totalStopCount={5} coverage={COVERAGE} />
      </MessagesProvider>,
    );
    expect(getAreaSummary()).toHaveTextContent(/^Covered area: 12,3 km²$/);
  });
});

describe("while loading", () => {
  it("shows the loading status in place of the summary", () => {
    renderResultsCard(StopsLoadStatus.loading);
    expect(screen.getByRole("status")).toHaveTextContent(/^Loading stops…$/);
    expect(queryStopsSummary()).not.toBeInTheDocument();
    expect(queryAreaFigure()).not.toBeInTheDocument();
    expect(queryShareFigure()).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the same status element when the stops have loaded", () => {
    const { rerender } = renderResultsCard(StopsLoadStatus.loading);
    const loadingStatus = screen.getByRole("status");
    rerender(getResultsCard(StopsLoadStatus.ready));
    expect(screen.getByRole("status")).toBe(loadingStatus);
  });
});

describe("after a failure", () => {
  it("shows the error alert in place of the summary", () => {
    renderResultsCard(StopsLoadStatus.error);
    expect(screen.getByRole("alert")).toHaveTextContent(/^Could not load stops\. Please reload the page\.$/);
    expect(queryStopsSummary()).not.toBeInTheDocument();
    expect(queryAreaFigure()).not.toBeInTheDocument();
    expect(queryShareFigure()).not.toBeInTheDocument();
    expect(queryLoadingText()).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
