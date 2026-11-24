// Locale-aware numbers for the UI. The locale is always passed in, never taken from the browser.
const numberFormatters = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(intlLocale: string, fractionDigits: number): Intl.NumberFormat {
  const cacheKey = `${intlLocale}|${fractionDigits}`;
  let formatter = numberFormatters.get(cacheKey);
  if (!formatter) {
    // "min2": no thousands separator below 10 000, so a count such as 4321 looks the same as before.
    formatter = new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
      useGrouping: "min2",
    });
    numberFormatters.set(cacheKey, formatter);
  }
  return formatter;
}

export function getFormattedNumber(intlLocale: string, value: number, fractionDigits: number): string {
  return getNumberFormatter(intlLocale, fractionDigits).format(value);
}
