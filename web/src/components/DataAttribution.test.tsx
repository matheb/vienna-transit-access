// @vitest-environment jsdom
import "@/test/setupDom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataAttribution from "@/components/DataAttribution";

describe("DataAttribution", () => {
  it("credits the data source", () => {
    render(<DataAttribution />);
    expect(screen.getByText(/Datenquelle: Stadt Wien/)).toBeVisible();
  });

  it("links to data.wien.gv.at in a new tab, safely", () => {
    render(<DataAttribution />);
    const link = screen.getByRole("link", { name: "data.wien.gv.at" });
    expect(link).toHaveAttribute("href", "https://data.wien.gv.at");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
