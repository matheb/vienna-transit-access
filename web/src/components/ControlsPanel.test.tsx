// @vitest-environment jsdom
import "@/test/setupDom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ControlsPanel from "@/components/ControlsPanel";
import { DEFAULT_FILTER_PARAMS } from "@/constants/home";
import type { FilterParams } from "@/lib/geo/coverage";

function renderControlsPanel(filterParamOverrides: Partial<FilterParams> = {}) {
  const handleFilterParamChange = vi.fn();
  render(
    <ControlsPanel
      filterParams={{ ...DEFAULT_FILTER_PARAMS, ...filterParamOverrides }}
      onFilterParamChange={handleFilterParamChange}
    />,
  );
  return handleFilterParamChange;
}

function getButton(name: string) {
  return screen.getByRole("button", { name });
}

// Sliders are found by label: Base UI keeps the thumb visibility:hidden in jsdom (no layout), which hides it from role queries.
async function pressArrowRightOn(slider: HTMLElement) {
  slider.focus();
  await userEvent.keyboard("{ArrowRight}");
}

describe("day toggles", () => {
  it("shows the three days with the current one pressed", () => {
    renderControlsPanel();
    expect(getButton("weekday")).toHaveAttribute("aria-pressed", "true");
    expect(getButton("saturday")).toHaveAttribute("aria-pressed", "false");
    expect(getButton("sunday")).toHaveAttribute("aria-pressed", "false");
  });

  it("reports another day when it is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await userEvent.click(getButton("saturday"));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("day", "saturday");
  });

  it("reports nothing when the active day is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await userEvent.click(getButton("weekday"));
    expect(handleFilterParamChange).not.toHaveBeenCalled();
  });
});

describe("time band toggles", () => {
  it("shows the four bands with the current one pressed", () => {
    renderControlsPanel();
    expect(getButton("am")).toHaveAttribute("aria-pressed", "true");
    expect(getButton("midday")).toHaveAttribute("aria-pressed", "false");
    expect(getButton("pm")).toHaveAttribute("aria-pressed", "false");
    expect(getButton("evening")).toHaveAttribute("aria-pressed", "false");
  });

  it("reports another band when it is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await userEvent.click(getButton("evening"));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("band", "evening");
  });

  it("reports nothing when the active band is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await userEvent.click(getButton("am"));
    expect(handleFilterParamChange).not.toHaveBeenCalled();
  });
});

describe("mode toggles", () => {
  it("shows the four selectable modes pressed and does not offer other", () => {
    renderControlsPanel();
    for (const mode of ["tram", "metro", "rail", "bus"]) {
      expect(getButton(mode)).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.queryByRole("button", { name: "other" })).not.toBeInTheDocument();
  });

  it("removes a pressed mode when it is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await userEvent.click(getButton("tram"));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("modes", ["metro", "rail", "bus"]);
  });

  it("adds an unpressed mode when it is clicked", async () => {
    const handleFilterParamChange = renderControlsPanel({ modes: ["bus"] });
    await userEvent.click(getButton("tram"));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("modes", ["bus", "tram"]);
  });
});

describe("minimum departures slider", () => {
  it("is labelled and shows its value and range", () => {
    renderControlsPanel();
    const slider = screen.getByLabelText(/min\. departures/i);
    expect(screen.getByText("Min. departures/hour: 4")).toBeInTheDocument();
    expect(slider).toHaveValue("4");
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "20");
  });

  it("reports the next value on Arrow Right", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await pressArrowRightOn(screen.getByLabelText(/min\. departures/i));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("minDeparturesPerHour", 5);
  });
});

describe("radius slider", () => {
  it("is labelled and shows its value, unit and range", () => {
    renderControlsPanel();
    const slider = screen.getByLabelText(/walking radius/i);
    expect(screen.getByText("Walking radius: 400 m")).toBeInTheDocument();
    expect(slider).toHaveValue("400");
    expect(slider).toHaveAttribute("min", "100");
    expect(slider).toHaveAttribute("max", "800");
  });

  it("reports the next step on Arrow Right", async () => {
    const handleFilterParamChange = renderControlsPanel();
    await pressArrowRightOn(screen.getByLabelText(/walking radius/i));
    expect(handleFilterParamChange).toHaveBeenCalledExactlyOnceWith("radiusMeters", 450);
  });

  it("reports nothing on Arrow Right at the maximum", async () => {
    const handleFilterParamChange = renderControlsPanel({ radiusMeters: 800 });
    await pressArrowRightOn(screen.getByLabelText(/walking radius/i));
    expect(handleFilterParamChange).not.toHaveBeenCalled();
  });
});
