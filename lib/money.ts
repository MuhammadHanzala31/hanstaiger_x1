// All monetary amounts in this app are integer cents.
export function formatEUR(cents: number): string {
  const hasDecimals = cents % 100 !== 0;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Booking UI style: grouped amount with a trailing symbol, e.g. "90,000€". */
export function formatTotal(cents: number, currency: string): string {
  const symbol =
    new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency;
  return `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}${symbol}`;
}
