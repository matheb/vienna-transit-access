// Imported by component tests only, so node-environment tests load no DOM code.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so React Testing Library cannot register this itself.
afterEach(cleanup);
