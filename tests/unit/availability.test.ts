import { describe, it, expect } from 'vitest';
import { nightsBetween, validateRange } from '@/lib/availability';

const cfg = { minNights: 3, maxNights: 14, seasonStart: '2026-05-01', seasonEnd: '2026-10-31' };
const blocks = [{ start: '2026-06-10', end: '2026-06-12' }];

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
    const r = validateRange('2026-06-01', '2026-06-02', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('min_nights');
  });
  it('rejects ranges longer than maxNights', () => {
    const r = validateRange('2026-06-01', '2026-06-20', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('max_nights');
  });
  it('rejects ranges outside the season window', () => {
    const r = validateRange('2026-11-01', '2026-11-05', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('out_of_season');
  });
  it('rejects ranges overlapping a blocked period', () => {
    const r = validateRange('2026-06-09', '2026-06-13', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('unavailable');
  });
  it('rejects when end is not after start', () => {
    const r = validateRange('2026-06-05', '2026-06-05', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_range');
  });
});
