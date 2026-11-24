import { LOCALE_PATHS, PAGE_LANGUAGES, TEXT } from "./constants";
import { expect, test } from "./fixtures";

const CONTEXT_CHARS = 60;

// Each place the text occurs, with some characters around it, so a failure shows where it is without printing the whole page.
function findWithContext(html: string, text: string) {
  const matches: string[] = [];
  for (let index = html.indexOf(text); index !== -1; index = html.indexOf(text, index + text.length)) {
    matches.push(html.slice(Math.max(index - CONTEXT_CHARS, 0), index + text.length + CONTEXT_CHARS));
  }
  return matches;
}

// Crawlers and link previews read the server HTML without running JavaScript, so it must hold no made-up results.
for (const language of PAGE_LANGUAGES) {
  const texts = TEXT[language];
  const path = LOCALE_PATHS[language];

  test(`server HTML of ${path} shows the loading state and no result numbers`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok(), `status ${response.status()} of ${path}`).toBe(true);
    const html = await response.text();
    expect(findWithContext(html, texts.loadingText), "loading text in server HTML").toHaveLength(1);
    expect(findWithContext(html, texts.stopsSummaryText), "stops summary in server HTML").toEqual([]);
    expect(findWithContext(html, texts.areaUnitText), "covered area in server HTML").toEqual([]);
  });
}
