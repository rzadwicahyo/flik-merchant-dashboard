// Stage 3: a health score from 0 to 100 for each order, higher is safer, from history only. No LLM.
import { createHash } from 'node:crypto';
import { normPhone } from './normalise.js';
import type { AddressBook } from './address.js';
import type { HistoryLookup, Payment, RefData, Tally } from './types.js';

/** How strongly a short history is pulled toward the area rate */
export const PRIOR_WEIGHT = 3;
export const SHOPPER_SHARE = 0.6;
export const DEFAULT_AREA_RATE = 0.85;
export type Band = 'safe' | 'watch' | 'risky';

/** (delivered + weight x prior) / (finished + weight) */
export const smoothed = (t: Tally | undefined, prior: number, weight = PRIOR_WEIGHT) =>
  ((t?.delivered ?? 0) + weight * prior) / ((t?.finished ?? 0) + weight);

export const band = (score: number): Band => (score >= 80 ? 'safe' : score >= 60 ? 'watch' : 'risky');

export const hashKey = (salt: string, value: string) => createHash('sha256').update(salt + '|' + value).digest('hex');

export interface ScoreInput {
  ref: string;
  phone: string;
  street: string;
  kelurahan: string;
  kecamatan: string;
  payment: Payment;
}
export interface ScoreResult {
  ref: string;
  score: number;
  band: Band;
  /** COD orders below Safe go to the Risky COD dialog; Non-COD orders are only flagged */
  flagForDialog: boolean;
  factors: { name: 'shopper' | 'address' | 'area'; rate: number; n: number }[];
}

export function areaRate(ref: RefData, book: AddressBook, kecamatan: string): number {
  const t = ref.areaCod[book.key(kecamatan)];
  return t && t.finished ? t.delivered / t.finished : DEFAULT_AREA_RATE;
}

export function scoreOrders(orders: ScoreInput[], ctx: { ref: RefData; book: AddressBook; history: HistoryLookup; salt: string }): ScoreResult[] {
  return orders.map((o) => {
    const prior = areaRate(ctx.ref, ctx.book, o.kecamatan);
    const phone = normPhone(o.phone) ?? '';
    const addrKey = ctx.book.key(o.street) + '|' + ctx.book.key(o.kelurahan);
    const ph = phone ? ctx.history.phone(hashKey(ctx.salt, phone)) : undefined;
    const ad = ctx.history.address(hashKey(ctx.salt, addrKey));
    const shopper = smoothed(ph, prior);
    const address = smoothed(ad, prior);
    const score = Math.round(1000 * (SHOPPER_SHARE * shopper + (1 - SHOPPER_SHARE) * address)) / 10;
    const b = band(score);
    return {
      ref: o.ref,
      score,
      band: b,
      // Raam's guide (28 Oct): only Risky COD orders go to the dialog; Watch is shown, not held
      flagForDialog: o.payment === 'COD' && b === 'risky',
      factors: [
        { name: 'shopper', rate: Math.round(shopper * 1000) / 10, n: ph?.finished ?? 0 },
        { name: 'address', rate: Math.round(address * 1000) / 10, n: ad?.finished ?? 0 },
        { name: 'area', rate: Math.round(prior * 1000) / 10, n: ctx.ref.areaCod[ctx.book.key(o.kecamatan)]?.finished ?? 0 },
      ],
    };
  });
}
