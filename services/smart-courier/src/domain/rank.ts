// Stage 4: delivery rate per service, the recommendation, per-order courier and the batch split. No LLM.
import type { AddressBook } from './address.js';
import { blockedBy, BLOCK_TEXT, type Block } from './redzone.js';
import type { Payment, RefData, Service, ServiceGroup, Tally } from './types.js';

/** Parcels a kecamatan or city needs before its own rate is used */
export const MIN_PARCELS = 30;

export interface Order {
  ref: string;
  warehouse: string;
  postcode: string;
  kecamatan: string;
  city: string;
  payment: Payment;
  kg: number;
  /** a Risky COD order sent to the customer for a WhatsApp check or a payment link: ships as its own batch */
  hold?: boolean;
}
export type RateLevel = 'kecamatan' | 'city' | 'global';

/** Delivery success over the last 90 days of FLIK shipments, and how many parcels it is based on */
export function rateFor(ref: RefData, book: AddressBook, serviceId: string, o: Pick<Order, 'kecamatan' | 'city'>): { rate: number; level: RateLevel; parcels: number } {
  const pct = (t: Tally) => (t.finished ? (100 * t.delivered) / t.finished : 0);
  const kec = ref.rates[`${serviceId}|kec|${book.key(o.kecamatan)}`];
  if (kec && kec.finished >= MIN_PARCELS) return { rate: pct(kec), level: 'kecamatan', parcels: kec.finished };
  const city = ref.rates[`${serviceId}|city|${book.key(o.city)}`];
  if (city && city.finished >= MIN_PARCELS) return { rate: pct(city), level: 'city', parcels: city.finished };
  const g = ref.rates[`${serviceId}|global`];
  return { rate: g ? pct(g) : 0, level: 'global', parcels: g?.finished ?? 0 };
}

export interface RecInput {
  orders: Order[];
  tab: ServiceGroup | 'all';
  enabled: string[];
  pricePerKg: Record<string, number>;
  /** the merchant's own pick; omitted means smart pick */
  chosen?: string;
}
export interface RecResult {
  services: { service: string; rate: number; rateLevel: RateLevel; redZoneOrders: number; price: number; recommended: boolean; cheapest: boolean }[];
  orders: { ref: string; service: string; movedFrom?: string; reason?: string }[];
  batches: { service: string; hold: boolean; pickups: { warehouse: string; refs: string[] }[]; reason: string }[];
  unplaced: { ref: string; reason: string }[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function recommend(input: RecInput, ctx: { ref: RefData; book: AddressBook; now?: Date }): RecResult {
  const { ref, book } = ctx;
  const now = ctx.now ?? new Date();
  const pool: Service[] = ref.services.filter((s) => input.enabled.includes(s.id) && (input.tab === 'all' || s.group === input.tab));
  const price = (s: Service, o: Order) => (input.pricePerKg[s.id] ?? Infinity) * o.kg;
  const block = (s: Service, o: Order): Block | null => blockedBy(ref, book, s.courier, o, now);

  const services = pool.map((s) => {
    const rates = input.orders.map((o) => rateFor(ref, book, s.id, o));
    const rate = rates.length ? round1(rates.reduce((a, r) => a + r.rate, 0) / rates.length) : 0;
    const levels = rates.map((r) => r.level);
    const rateLevel: RateLevel = levels.includes('global') ? 'global' : levels.includes('city') ? 'city' : 'kecamatan';
    return { service: s.id, rate, rateLevel, redZoneOrders: input.orders.filter((o) => block(s, o)).length, price: input.orders.reduce((a, o) => a + price(s, o), 0), recommended: false, cheapest: false };
  });
  const best = services
    .filter((s) => !s.redZoneOrders)
    .sort((a, b) => b.rate - a.rate || a.price - b.price)[0];
  if (best) best.recommended = true;
  const cheapest = services.filter((s) => !s.redZoneOrders).sort((a, b) => a.price - b.price)[0];
  if (cheapest) cheapest.cheapest = true;

  const orders: RecResult['orders'] = [];
  const unplaced: RecResult['unplaced'] = [];
  const chosen = input.chosen ? pool.find((s) => s.id === input.chosen) : undefined;
  for (const o of input.orders) {
    const able = pool.filter((s) => !block(s, o));
    if (chosen && !block(chosen, o)) {
      orders.push({ ref: o.ref, service: chosen.id });
      continue;
    }
    if (!able.length) {
      const why = chosen ? block(chosen, o) : pool.map((s) => block(s, o)).find(Boolean);
      unplaced.push({ ref: o.ref, reason: why ? `${BLOCK_TEXT[why]} for every courier` : 'No courier service available' });
      continue;
    }
    if (chosen) {
      // the merchant's courier can't take it: start on the cheapest service that can
      const fallback = able.sort((a, b) => price(a, o) - price(b, o))[0]!;
      orders.push({ ref: o.ref, service: fallback.id, movedFrom: chosen.id, reason: BLOCK_TEXT[block(chosen, o)!] });
    } else {
      const top = able.sort((a, b) => rateFor(ref, book, b.id, o).rate - rateFor(ref, book, a.id, o).rate || price(a, o) - price(b, o))[0]!;
      orders.push({ ref: o.ref, service: top.id });
    }
  }
  return { services, orders, batches: splitBatches(input.orders, orders, ref), unplaced };
}

/**
 * One batch per courier service for the orders shipping now; inside it, one pickup per warehouse.
 * An order held for its customer's reply is a batch of its own, so no order waits on another customer.
 */
export function splitBatches(all: Order[], placed: RecResult['orders'], ref: RefData): RecResult['batches'] {
  const byRef = new Map(all.map((o) => [o.ref, o]));
  const nameOf = (service: string) => ref.services.find((s) => s.id === service)?.name ?? service;
  const held = placed
    .filter((p) => byRef.get(p.ref)!.hold)
    .map((p) => ({ service: p.service, hold: true, pickups: [{ warehouse: byRef.get(p.ref)!.warehouse, refs: [p.ref] }], reason: `${nameOf(p.service)}: ${p.ref} ships when the customer replies` }));
  const groups = new Map<string, Map<string, string[]>>();
  for (const p of placed) {
    if (byRef.get(p.ref)!.hold) continue;
    const wh = byRef.get(p.ref)!.warehouse;
    const g = groups.get(p.service) ?? new Map<string, string[]>();
    g.set(wh, [...(g.get(wh) ?? []), p.ref]);
    groups.set(p.service, g);
  }
  const now = [...groups].map(([service, g]) => {
    const pickups = [...g].map(([warehouse, refs]) => ({ warehouse, refs }));
    const n = pickups.reduce((a, p) => a + p.refs.length, 0);
    const moved = placed.filter((p) => p.service === service && p.movedFrom && !byRef.get(p.ref)!.hold).length;
    const reason = `${nameOf(service)}: ${n} ${n === 1 ? 'order' : 'orders'} from ${pickups.length} ${pickups.length === 1 ? 'warehouse' : 'warehouses'}${moved ? `, ${moved} moved here from your courier` : ''}`;
    return { service, hold: false, pickups, reason };
  });
  return [...now, ...held];
}
