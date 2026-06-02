import { describe, it, expect } from 'vitest';
import { nightsBetween, validateRange } from '@/lib/availability';
import type { RangeResult } from '@/lib/availability';

const cfg = { minNights: 3, maxNights: 14, seasonStart: '2026-05-01', seasonEnd: '2026-10-31' };
const blocks = [{ start: '2026-06-10', end: '2026-06-12' }];

// Helper: assert result is a failure and return its reason (narrows the discriminated union).
function failReason(r: RangeResult): string {
  expect(r.ok).toBe(false);
  return (r as Extract<RangeResult, { ok: false }>).reason;
}

describe('nightsBetween', () => {
  it('counts nights between two ISO dates', () => {
    expect(nightsBetween('2026-06-01', '2026-06-05')).toBe(4);
  });
});

describe('validateRange', () => {
  it('accepts a valid in-season range with no conflicts', () => {
    expect(validateRange('2026-06-01', '2026-06-05', cfg, blocks)).toEqual({ ok: true });
  });
  it('rejects ranges shorter than minNights', () => {
    expect(failReason(validateRange('2026-06-01', '2026-06-02', cfg, blocks))).toBe('min_nights');
  });
  it('rejects ranges longer than maxNights', () => {
    expect(failReason(validateRange('2026-06-01', '2026-06-20', cfg, blocks))).toBe('max_nights');
  });
  it('rejects ranges outside the season window', () => {
    expect(failReason(validateRange('2026-11-01', '2026-11-05', cfg, blocks))).toBe('out_of_season');
  });
  it('rejects ranges overlapping a blocked period', () => {
    expect(failReason(validateRange('2026-06-09', '2026-06-13', cfg, blocks))).toBe('unavailable');
  });
  it('rejects when end is not after start', () => {
    expect(failReason(validateRange('2026-06-05', '2026-06-05', cfg, blocks))).toBe('invalid_range');
  });
});
