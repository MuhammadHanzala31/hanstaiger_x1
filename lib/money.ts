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
