import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@/i18n/locales";
import { getLocaleMessages } from "@/i18n/messages";

// A dictionary as nested objects with texts at the leaves, like en.ts.
interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

// The language every other dictionary is compared with.
const REFERENCE_LOCALE: Locale = "en";

// Every text with its dotted key path, e.g. ["ControlsPanel.dayToggle.label", "Day type"].
function getTextEntries(tree: MessageTree, pathPrefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : getTextEntries(value, path);
  });
}

// Key paths that the candidate lacks (missing) or has in addition (extra), compared with the reference.
function getKeyPathDifferences(reference: MessageTree, candidate: MessageTree) {
  const referencePaths = new Set(getTextEntries(reference).map(([path]) => path));
  const candidatePaths = new Set(getTextEntries(candidate).map(([path]) => path));
  return {
    missing: [...referencePaths].filter((path) => !candidatePaths.has(path)),
    extra: [...candidatePaths].filter((path) => !referencePaths.has(path)),
  };
}

// Key paths whose text is empty or only whitespace (including no-break spaces).
function getEmptyTextPaths(tree: MessageTree) {
  return getTextEntries(tree).filter(([, text]) => text.trim() === "").map(([path]) => path);
}

// The placeholder names in a text, sorted: "{count} of {total}" and "{count, plural, …}" give their names.
function getPlaceholderNames(text: string) {
  return [...new Set([...text.matchAll(/\{\s*(\w+)/g)].map((match) => match[1]))].sort();
}

// Key paths present in both dictionaries whose texts use different placeholder names.
function getPlaceholderMismatchPaths(reference: MessageTree, candidate: MessageTree) {
  const candidateTexts = new Map(getTextEntries(candidate));
  return getTextEntries(reference)
    .filter(([path, text]) => {
      const candidateText = candidateTexts.get(path);
      return candidateText !== undefined
        && getPlaceholderNames(candidateText).join() !== getPlaceholderNames(text).join();
    })
    .map(([path]) => path);
}

function getMessageTree(locale: Locale): MessageTree {
  return getLocaleMessages(locale).messages;
}

describe("the dictionary checks catch broken dictionaries", () => {
  // Tiny fake dictionaries, not real texts.
  const reference: MessageTree = { Card: { title: "Title", summary: "{count} of {total}" }, Footer: { link: "Link" } };

  it("reports a missing key path and an extra key path by name", () => {
    const broken: MessageTree = { Card: { title: "Title", summary: "{count} of {total}", subtitle: "Extra" }, Footer: {} };
    expect(getKeyPathDifferences(reference, broken)).toEqual({ missing: ["Footer.link"], extra: ["Card.subtitle"] });
  });

  it("reports no differences for a dictionary with the same key paths", () => {
    const sameShape: MessageTree = { Card: { title: "Other", summary: "{count} / {total}" }, Footer: { link: "Other" } };
    expect(getKeyPathDifferences(reference, sameShape)).toEqual({ missing: [], extra: [] });
  });

  it("reports empty and whitespace-only texts by key path", () => {
    const broken: MessageTree = { Card: { title: "", summary: "   " }, Footer: { link: "Link" } };
    expect(getEmptyTextPaths(broken)).toEqual(["Card.title", "Card.summary"]);
  });

  it("reports a text whose placeholder names differ, and accepts the same names in another order", () => {
    const broken: MessageTree = { Card: { title: "Title", summary: "{count} of {all}" }, Footer: { link: "Link" } };
    const reordered: MessageTree = { Card: { title: "Title", summary: "{total}: {count}" }, Footer: { link: "Link" } };
    expect(getPlaceholderMismatchPaths(reference, broken)).toEqual(["Card.summary"]);
    expect(getPlaceholderMismatchPaths(reference, reordered)).toEqual([]);
  });

  it("finds placeholder names, including ICU-style ones", () => {
    expect(getPlaceholderNames("{total} and {count, plural, one {# stop} other {# stops}}")).toEqual(["count", "total"]);
    expect(getPlaceholderNames("no placeholders")).toEqual([]);
  });
});

describe("every dictionary is complete", () => {
  const referenceTree = getMessageTree(REFERENCE_LOCALE);

  for (const locale of LOCALES) {
    describe(`locale "${locale}"`, () => {
      it("has no empty or whitespace-only texts", () => {
        expect(getEmptyTextPaths(getMessageTree(locale)), `empty texts in "${locale}"`).toEqual([]);
      });

      if (locale === REFERENCE_LOCALE) return;

      it(`has exactly the key paths of "${REFERENCE_LOCALE}"`, () => {
        expect(getKeyPathDifferences(referenceTree, getMessageTree(locale)), `key paths of "${locale}" compared with "${REFERENCE_LOCALE}"`)
          .toEqual({ missing: [], extra: [] });
      });

      it(`uses the same placeholder names as "${REFERENCE_LOCALE}" in each text`, () => {
        expect(getPlaceholderMismatchPaths(referenceTree, getMessageTree(locale)), `texts in "${locale}" with other placeholders than "${REFERENCE_LOCALE}"`)
          .toEqual([]);
      });
    });
  }
});
