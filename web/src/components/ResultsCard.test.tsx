// @vitest-environment jsdom
import "@/test/setupDom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResultsCard from "@/components/ResultsCard";
import { StopsLoadStatus } from "@/services/stopsService";

const COVERAGE = { polygon: null, areaKm2: 12.34, viennaShare: 0.034 };
const EMPTY_COVERAGE = { polygon: null, areaKm2: 0, viennaShare: 0 };

function renderResultsCard(loadStatus: StopsLoadStatus, qualifyingStopCount = 2, coverage = COVERAGE) {
  render(<ResultsCard loadStatus={loadStatus} qualifyingStopCount={qualifyingStopCount} totalStopCount={5} coverage={coverage} />);
}

function getStopsSummary() {
  return screen.getByText(/stops qualify/);
}

function getAreaSummary() {
  return screen.getByText(/Covered area:/);
}

describe("when ready", () => {
  it("shows the stop count, the area to one decimal, the whole-number share and approx.", () => {
    renderResultsCard(StopsLoadStatus.ready);
    expect(getStopsSummary()).toBeVisible();
    expect(getStopsSummary()).toHaveTextContent("2 of 5 stops qualify");
    expect(getAreaSummary()).toBeVisible();
    expect(getAreaSummary()).toHaveTextContent("Covered area: 12.3 km² (3% of Vienna, approx.)");
  });

  it("shows no status or alert", () => {
    renderResultsCard(StopsLoadStatus.ready);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders zero results as 0 and 0.0", () => {
    renderResultsCard(StopsLoadStatus.ready, 0, EMPTY_COVERAGE);
    expect(getStopsSummary()).toHaveTextContent("0 of 5 stops qualify");
    expect(getAreaSummary()).toHaveTextContent("Covered area: 0.0 km² (0% of Vienna, approx.)");
  });
});

describe("while loading", () => {
  it("shows the loading status in place of the summary", () => {
    renderResultsCard(StopsLoadStatus.loading);
    expect(screen.getByRole("status")).toHaveTextContent(/^Loading stops…$/);
    expect(getStopsSummary()).not.toBeVisible();
    expect(getAreaSummary()).not.toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("after a failure", () => {
  it("shows the error alert in place of the summary", () => {
    renderResultsCard(StopsLoadStatus.error);
    expect(screen.getByRole("alert")).toHaveTextContent(/^Could not load stops\. Please reload the page\.$/);
    expect(getStopsSummary()).not.toBeVisible();
    expect(getAreaSummary()).not.toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
