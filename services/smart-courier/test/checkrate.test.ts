import { describe, expect, it } from 'vitest';
import { checkRate, type Offer, type RateQuery } from '../src/domain/checkrate.js';
import { BOOK, NOW, REF } from './fixtures.js';

const ctx = { ref: REF, book: BOOK, now: NOW };
const OFFERS: Offer[] = [
  { service: 'jne-reg', flikPrice: 12000, publishedPrice: 15000, etaDays: [2, 3] },
  { service: 'spx-std', flikPrice: 11000, publishedPrice: 12000, etaDays: [2, 4] },
  { service: 'sicepat-reg', flikPrice: 12500, publishedPrice: 12500, etaDays: [1, 2] },
  { service: 'gosend-inst', flikPrice: 40000, publishedPrice: 45000, etaDays: [0, 0] },
];
const dago: RateQuery['to'] = { postcode: '40135', kecamatan: 'Coblong', city: 'Kota Bandung' };
const makassar: RateQuery['to'] = { postcode: '90231', kecamatan: 'Panakkukang', city: 'Kota Makassar' };
const run = (q: Partial<RateQuery> = {}) => checkRate({ to: dago, payment: 'COD', offers: OFFERS, ...q }, ctx);

describe('Check rate', () => {
  it('shows success with the parcels it is based on, and the saving against the published rate', () => {
    expect(run().find((r) => r.service === 'spx-std')).toMatchObject({ success: 95, successLevel: 'kecamatan', parcels: 40, saving: 1000, savingPct: 8, group: 'reg' });
  });

  it('groups Instant, Same day and Next day as Express', () => expect(run().find((r) => r.service === 'gosend-inst')!.group).toBe('exp'));

  it('tags Recommended, Cheapest and Fastest', () => {
    const r = run();
    const tagged = (t: string) => r.filter((x) => x.tags.includes(t as never)).map((x) => x.service);
    expect(tagged('recommended')).toEqual(['gosend-inst']); // 99% global
    expect(tagged('cheapest')).toEqual(['spx-std']);
    expect(tagged('fastest')).toEqual(['gosend-inst']);
  });

  it.each([['cheapest', 'spx-std'], ['fastest', 'gosend-inst'], ['success', 'gosend-inst']] as const)('sorts by %s', (sort, first) =>
    expect(run({ sort })[0]!.service).toBe(first));

  it('puts a COD red zone at the end, flagged, and drops its tags', () => {
    const r = run({ to: makassar });
    expect(r.at(-1)).toMatchObject({ service: 'jne-reg', coverage: 'red_zone', cod: false, tags: [] });
  });

  it('lets a Non-COD check through a COD red zone, but marks COD as not covered', () => {
    expect(run({ to: makassar, payment: 'NON_COD' }).find((r) => r.service === 'jne-reg')).toMatchObject({ coverage: 'delivers', cod: false });
  });

  it('marks a no-delivery zone as not delivered for COD and Non-COD', () => {
    const to = { postcode: '90245', kecamatan: 'Tamalanrea', city: 'Kota Makassar' };
    expect(run({ to, payment: 'NON_COD' }).filter((r) => r.coverage === 'not_delivered').map((r) => r.service).sort()).toEqual(['jne-reg', 'spx-std']);
  });

  it('skips a service the reference data does not know', () => expect(run({ offers: [{ service: 'x', flikPrice: 1, publishedPrice: 1, etaDays: [1, 1] }] })).toEqual([]));
});
