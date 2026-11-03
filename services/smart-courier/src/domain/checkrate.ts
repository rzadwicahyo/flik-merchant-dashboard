// Check rate: every switched-on service for one route, with its price, speed, delivery success and coverage. No LLM.
import type { AddressBook } from './address.js';
import { blockedBy } from './redzone.js';
import { rateFor, type RateLevel } from './rank.js';
import type { Payment, RefData, ServiceGroup } from './types.js';

/** Check rate shows three groups; Instant, Same day and Next day are all Express */
export type RateGroup = 'reg' | 'exp' | 'cargo';
export const RATE_GROUP: Record<ServiceGroup, RateGroup> = { inst: 'exp', same: 'exp', next: 'exp', reg: 'reg', cargo: 'cargo' };
export type RateSort = 'recommended' | 'cheapest' | 'fastest' | 'success';
export type Coverage = 'delivers' | 'red_zone' | 'not_delivered';

/** Prices and estimates come from FLIK's shipping core through the BE */
export interface Offer {
  service: string;
  flikPrice: number;
  publishedPrice: number;
  etaDays: [number, number];
}
export interface RateQuery {
  to: { postcode: string; kecamatan: string; city: string };
  payment: Payment;
  offers: Offer[];
  sort?: RateSort;
}
export interface RateRow {
  service: string;
  group: RateGroup;
  etaDays: [number, number];
  flikPrice: number;
  publishedPrice: number;
  saving: number;
  savingPct: number;
  success: number;
  successLevel: RateLevel;
  parcels: number;
  coverage: Coverage;
  /** the courier takes COD here */
  cod: boolean;
  tags: ('recommended' | 'cheapest' | 'fastest')[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function checkRate(q: RateQuery, ctx: { ref: RefData; book: AddressBook; now?: Date }): RateRow[] {
  const now = ctx.now ?? new Date();
  const rows: RateRow[] = [];
  for (const o of q.offers) {
    const svc = ctx.ref.services.find((s) => s.id === o.service);
    if (!svc) continue;
    const r = rateFor(ctx.ref, ctx.book, svc.id, q.to);
    const cover = blockedBy(ctx.ref, ctx.book, svc.courier, { ...q.to, payment: 'NON_COD' }, now);
    const codBlock = blockedBy(ctx.ref, ctx.book, svc.courier, { ...q.to, payment: 'COD' }, now);
    const coverage: Coverage = cover ? 'not_delivered' : codBlock && q.payment === 'COD' ? 'red_zone' : 'delivers';
    const saving = Math.max(0, o.publishedPrice - o.flikPrice);
    rows.push({
      service: svc.id, group: RATE_GROUP[svc.group], etaDays: o.etaDays, flikPrice: o.flikPrice, publishedPrice: o.publishedPrice,
      saving, savingPct: o.publishedPrice ? Math.round((100 * saving) / o.publishedPrice) : 0,
      success: round1(r.rate), successLevel: r.level, parcels: r.parcels, coverage, cod: !cover && !codBlock, tags: [],
    });
  }
  const ok = rows.filter((r) => r.coverage === 'delivers');
  const byRec = (a: RateRow, b: RateRow) => b.success - a.success || a.flikPrice - b.flikPrice;
  const byCheap = (a: RateRow, b: RateRow) => a.flikPrice - b.flikPrice;
  const byFast = (a: RateRow, b: RateRow) => a.etaDays[1] - b.etaDays[1] || a.flikPrice - b.flikPrice;
  const bySuccess = (a: RateRow, b: RateRow) => b.success - a.success;
  ok.slice().sort(byRec)[0]?.tags.push('recommended');
  ok.slice().sort(byCheap)[0]?.tags.push('cheapest');
  ok.slice().sort(byFast)[0]?.tags.push('fastest');
  const sorter = { recommended: byRec, cheapest: byCheap, fastest: byFast, success: bySuccess }[q.sort ?? 'recommended'];
  // services that can't deliver this order sit at the end, flagged
  return [...ok.sort(sorter), ...rows.filter((r) => r.coverage !== 'delivers').sort(sorter)];
}
