export interface RangeConfig {
  minNights: number;
  maxNights: number;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}
export interface BlockedRange { start: string; end: string; }
export type RangeResult =
  | { ok: true }
  | { ok: false; reason:
      'invalid_range' | 'min_nights' | 'max_nights' | 'out_of_season' | 'unavailable' };

const MS_PER_DAY = 86_400_000;

export function nightsBetween(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY);
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return Date.parse(aStart) < Date.parse(bEnd) && Date.parse(bStart) < Date.parse(aEnd);
}

export function validateRange(
  start: string,
  end: string,
  cfg: RangeConfig,
  blocks: BlockedRange[],
): RangeResult {
  const nights = nightsBetween(start, end);
  if (nights <= 0) return { ok: false, reason: 'invalid_range' };
  if (nights < cfg.minNights) return { ok: false, reason: 'min_nights' };
  if (nights > cfg.maxNights) return { ok: false, reason: 'max_nights' };
  if (cfg.seasonStart && Date.parse(start) < Date.parse(cfg.seasonStart))
    return { ok: false, reason: 'out_of_season' };
  if (cfg.seasonEnd && Date.parse(end) > Date.parse(cfg.seasonEnd))
    return { ok: false, reason: 'out_of_season' };
  for (const b of blocks) {
    if (rangesOverlap(start, end, b.start, b.end))
      return { ok: false, reason: 'unavailable' };
  }
  return { ok: true };
}
