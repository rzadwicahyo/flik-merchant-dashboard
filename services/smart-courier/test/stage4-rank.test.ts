import { describe, expect, it } from 'vitest';
import { rateFor, recommend, type Order } from '../src/domain/rank.js';
import { differences, finalFileCsv } from '../src/domain/finalfile.js';
import { BOOK, NOW, REF } from './fixtures.js';

const ctx = { ref: REF, book: BOOK, now: NOW };
const coblong = (ref: string, o: Partial<Order> = {}): Order => ({ ref, warehouse: 'BDG-01', postcode: '40135', kecamatan: 'Coblong', city: 'Kota Bandung', payment: 'COD', kg: 1, ...o });
const makassar = (ref: string, o: Partial<Order> = {}): Order => ({ ref, warehouse: 'JKT-01', postcode: '90231', kecamatan: 'Panakkukang', city: 'Kota Makassar', payment: 'COD', kg: 1, ...o });
const PRICES = { 'jne-reg': 14000, 'spx-std': 11000, 'sicepat-reg': 12500, 'ninja-reg': 13000, 'gosend-inst': 40000 };
const ALL = Object.keys(PRICES);

describe('Stage 4: delivery rate level', () => {
  it('uses the kecamatan rate with 30 or more parcels', () => expect(rateFor(REF, BOOK, 'spx-std', coblong('a'))).toMatchObject({ rate: 95, level: 'kecamatan', parcels: 40 }));
  it('falls back to the city when the kecamatan has fewer than 30', () => {
    expect(rateFor(REF, BOOK, 'sicepat-reg', coblong('a'))).toMatchObject({ rate: 90, level: 'city' });
    expect(rateFor(REF, BOOK, 'spx-std', { kecamatan: 'Tebet', city: 'Jakarta Selatan' })).toMatchObject({ rate: 90, level: 'city' });
  });
  it('falls back to the global rate when neither has enough', () => expect(rateFor(REF, BOOK, 'ninja-reg', coblong('a'))).toMatchObject({ rate: 91, level: 'global' }));
});

describe('Stage 4: recommendation and per-order courier', () => {
  it('recommends SPX in Coblong (95% over 40) over JNE (93% over 100)', () => {
    const r = recommend({ orders: [coblong('a')], tab: 'reg', enabled: ALL, pricePerKg: PRICES }, ctx);
    expect(r.services.find((s) => s.recommended)?.service).toBe('spx-std');
  });

  it('picks the cheaper of two services with the same rate', () => {
    const ref = { ...REF, rates: { ...REF.rates, 'ninja-reg|kec|coblong': { delivered: 38, finished: 40 } } };
    const r = recommend({ orders: [coblong('a')], tab: 'reg', enabled: ALL, pricePerKg: { ...PRICES, 'ninja-reg': 10000 } }, { ...ctx, ref });
    expect(r.services.find((s) => s.recommended)?.service).toBe('ninja-reg');
  });

  it('never recommends a service with a red-zone order, or one outside the tab or switched off', () => {
    const r = recommend({ orders: [makassar('a')], tab: 'reg', enabled: ALL.filter((s) => s !== 'ninja-reg'), pricePerKg: PRICES }, ctx);
    expect(r.services.find((s) => s.service === 'jne-reg')).toMatchObject({ redZoneOrders: 1, recommended: false });
    expect(r.services.map((s) => s.service)).not.toContain('ninja-reg');
    expect(r.services.map((s) => s.service)).not.toContain('gosend-inst');
  });

  it("moves the merchant's JNE orders it can't take to the cheapest service that can", () => {
    const orders = [coblong('a'), makassar('b'), makassar('c'), makassar('d')];
    const r = recommend({ orders, tab: 'reg', enabled: ALL, pricePerKg: PRICES, chosen: 'jne-reg' }, ctx);
    expect(r.orders).toEqual([
      { ref: 'a', service: 'jne-reg' },
      { ref: 'b', service: 'spx-std', movedFrom: 'jne-reg', reason: 'Red zone for COD' },
      { ref: 'c', service: 'spx-std', movedFrom: 'jne-reg', reason: 'Red zone for COD' },
      { ref: 'd', service: 'spx-std', movedFrom: 'jne-reg', reason: 'Red zone for COD' },
    ]);
  });

  it('puts an order nothing can take in unplaced', () => {
    const r = recommend({ orders: [makassar('a', { postcode: '90245', kecamatan: 'Tamalanrea' })], tab: 'reg', enabled: ['jne-reg', 'spx-std'], pricePerKg: PRICES, chosen: 'jne-reg' }, ctx);
    expect(r.unplaced).toEqual([{ ref: 'a', reason: 'Out of coverage for every courier' }]);
    expect(r.batches).toEqual([]);
  });

  it('smart pick sends each order to its best-rate service', () => {
    const r = recommend({ orders: [coblong('a'), coblong('b', { kecamatan: 'Tebet', city: 'Jakarta Selatan', postcode: '12820' })], tab: 'reg', enabled: ALL, pricePerKg: PRICES }, ctx);
    expect(r.orders.map((o) => o.service)).toEqual(['spx-std', 'jne-reg']);
  });
});

describe('Stage 4: batches (v4)', () => {
  it('makes one batch per courier service with a pickup per warehouse inside', () => {
    const orders = [
      ...Array.from({ length: 4 }, (_, i) => coblong('j' + i, { warehouse: i < 2 ? 'JKT-01' : 'BDG-01' })),
      ...Array.from({ length: 2 }, (_, i) => makassar('m' + i)),
    ];
    const r = recommend({ orders, tab: 'reg', enabled: ALL, pricePerKg: PRICES, chosen: 'jne-reg' }, ctx);
    expect(r.batches).toHaveLength(2);
    const jne = r.batches.find((b) => b.service === 'jne-reg')!;
    expect(jne.pickups).toEqual([{ warehouse: 'JKT-01', refs: ['j0', 'j1'] }, { warehouse: 'BDG-01', refs: ['j2', 'j3'] }]);
    expect(jne.reason).toBe('JNE Regular: 4 orders from 2 warehouses');
    expect(r.batches.find((b) => b.service === 'spx-std')!.reason).toBe('SPX Standard: 2 orders from 1 warehouse, 2 moved here from your courier');
  });
});

describe("Stage 4: batches (Raam's guide, 28 Oct)", () => {
  it('500 orders on JNE from 3 warehouses with 3 held for the customer make 4 batches', () => {
    const whs = ['JKT-01', 'BDG-01', 'SBY-01'];
    const orders = Array.from({ length: 500 }, (_, i) => coblong('o' + i, { warehouse: whs[i % 3]!, hold: i < 3 }));
    const r = recommend({ orders, tab: 'reg', enabled: ALL, pricePerKg: PRICES, chosen: 'jne-reg' }, ctx);
    expect(r.batches).toHaveLength(4);
    const now = r.batches.filter((b) => !b.hold);
    expect(now).toHaveLength(1);
    expect(now[0]!.pickups.map((p) => p.warehouse)).toEqual(whs);
    expect(now[0]!.pickups.reduce((a, p) => a + p.refs.length, 0)).toBe(497);
    expect(r.batches.filter((b) => b.hold).map((b) => b.pickups)).toEqual([
      [{ warehouse: 'JKT-01', refs: ['o0'] }], [{ warehouse: 'BDG-01', refs: ['o1'] }], [{ warehouse: 'SBY-01', refs: ['o2'] }],
    ]);
  });

  it('an extra courier from the split pop-up adds one batch', () => {
    const r = recommend({ orders: [coblong('a'), coblong('b'), makassar('c')], tab: 'reg', enabled: ALL, pricePerKg: PRICES, chosen: 'jne-reg' }, ctx);
    expect(r.batches.map((b) => b.service)).toEqual(['jne-reg', 'spx-std']);
  });

  it('tags the cheapest service with no red-zone order', () => {
    const r = recommend({ orders: [makassar('a')], tab: 'reg', enabled: ALL, pricePerKg: { ...PRICES, 'jne-reg': 9000 } }, ctx);
    expect(r.services.filter((s) => s.cheapest).map((s) => s.service)).toEqual(['spx-std']);
  });
});

describe('final file', () => {
  it('has every row once, with status, service and batch, and lists the differences', () => {
    const up = [{ name: 'A', postcode: '40153' }, { name: 'B, Jr' }, { name: 'C' }];
    const fin = [{ name: 'A', postcode: '40135' }, { name: 'B, Jr' }, { name: 'C' }];
    const choices = [{ status: 'ship', service: 'jne-reg', batch: 'B1' }, { status: 'waiting' }, { status: 'removed' }] as const;
    const csv = finalFileCsv(fin, [...choices]);
    expect(csv.trim().split('\n')).toHaveLength(4);
    expect(csv).toContain('"B, Jr"');
    expect(differences(up, fin, [...choices])).toEqual([
      { index: 0, kind: 'changed', field: 'postcode', from: '40153', to: '40135' },
      { index: 2, kind: 'removed' },
    ]);
  });
});
