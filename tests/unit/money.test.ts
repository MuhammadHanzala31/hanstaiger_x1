import { describe, it, expect } from 'vitest';
import { formatEUR, formatTotal } from '@/lib/money';

// Node's Intl.NumberFormat uses a non-breaking space (U+00A0) between the number and the € sign.
describe('formatEUR', () => {
  it('formats whole-euro cents with thousands separators', () => {
    expect(formatEUR(2000000)).toBe('20.000 €');
  });
  it('formats zero', () => {
    expect(formatEUR(0)).toBe('0 €');
  });
  it('formats cents with decimals', () => {
    expect(formatEUR(123456)).toBe('1.234,56 €');
  });
});

describe('formatTotal', () => {
  it('groups thousands and trails the currency symbol', () => {
    expect(formatTotal(9000000, 'USD')).toBe('90,000$');
    expect(formatTotal(12000000, 'EUR')).toBe('120,000€');
    expect(formatTotal(0, 'EUR')).toBe('0€');
  });
});
