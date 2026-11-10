import { describe, expect, it } from 'vitest';
import { band, scoreOrders, type ScoreInput } from '../src/domain/score.js';
import { blockedBy, softZonesFromHistory, warnings } from '../src/domain/redzone.js';
import type { RefData } from '../src/domain/types.js';
import { BOOK, NOW, REF, SALT, history } from './fixtures.js';

const order = (o: Partial<ScoreInput> = {}): ScoreInput => ({
  ref: 'A1', phone: '081234567890', street: 'Jl. Dago 12', kelurahan: 'Dago', kecamatan: 'Coblong', payment: 'COD', ...o,
});
const refWithArea = (kec: string, delivered: number): RefData => ({ ...REF, areaCod: { ...REF.areaCod, [kec]: { delivered, finished: 100 } } });
const score = (o: ScoreInput, h = history({}), ref = REF) => scoreOrders([o], { ref, book: BOOK, history: h, salt: SALT })[0]!;

describe('Stage 3: health score (prior weight 3, 60/40)', () => {
  it('uses the area rate when there is no history: 85 is Safe', () => {
    const r = score(order({ kecamatan: 'Tamalanrea' }), history({}), refWithArea('tamalanrea', 85));
    expect(r).toMatchObject({ score: 85, band: 'safe', flagForDialog: false });
  });

  it('one returned parcel does not make a shopper Risky, and Watch is not held', () => {
    const r = score(order(), history({ '6281234567890': { delivered: 0, finished: 1 } }));
    expect(r.factors[0]).toMatchObject({ name: 'shopper', rate: 67.5 });
    expect(r).toMatchObject({ score: 76.5, band: 'watch', flagForDialog: false });
  });

  it('shopper 1 of 5 and address 1 of 3 in an 80% area is Risky', () => {
    const h = history({ '6281234567890': { delivered: 1, finished: 5 } }, { 'jl dago 12|dago': { delivered: 1, finished: 3 } });
    const r = score(order(), h, refWithArea('coblong', 80));
    expect(r.factors.map((f) => f.rate)).toEqual([42.5, 56.7, 80]);
    expect(r).toMatchObject({ score: 48.2, band: 'risky', flagForDialog: true });
  });

  it.each([[60, 'watch'], [80, 'safe'], [59.9, 'risky']] as const)('score %s is %s', (s, b) => expect(band(s)).toBe(b));

  it('scores a Non-COD order but never sends it to the dialog', () => {
    const h = history({ '6281234567890': { delivered: 0, finished: 6 } });
    const r = score(order({ payment: 'NON_COD' }), h);
    expect(r.band).toBe('risky');
    expect(r.flagForDialog).toBe(false);
  });

  it('scores 500 orders with one history lookup each', () => {
    let calls = 0;
    const h = { phone: () => (calls++, undefined), address: () => undefined };
    const out = scoreOrders(Array.from({ length: 500 }, (_, i) => order({ ref: 'R' + i })), { ref: REF, book: BOOK, history: h, salt: SALT });
    expect(out).toHaveLength(500);
    expect(calls).toBe(500);
  });
});

describe('Stage 5: red zones', () => {
  const dest = (postcode: string, kecamatan: string, payment: 'COD' | 'NON_COD' = 'COD') => ({ postcode, kecamatan, payment });

  it('blocks a COD order in a COD red zone', () => expect(blockedBy(REF, BOOK, 'jne', dest('90231', 'Panakkukang'), NOW)).toBe('cod'));
  it('lets a Non-COD order through a COD red zone', () => expect(blockedBy(REF, BOOK, 'jne', dest('90231', 'Panakkukang', 'NON_COD'), NOW)).toBeNull());
  it('blocks every order in a no-delivery zone, by postcode or kecamatan', () => {
    expect(blockedBy(REF, BOOK, 'jne', dest('90245', 'Tamalanrea', 'NON_COD'), NOW)).toBe('cover');
    expect(blockedBy(REF, BOOK, 'spx', dest('90245', 'Tamalanrea', 'NON_COD'), NOW)).toBe('cover');
  });
  it('ignores a manual entry past its end date', () => expect(blockedBy(REF, BOOK, 'ninja', dest('90231', 'Panakkukang'), NOW)).toBeNull());
  it('shows a soft zone as a warning, never a block', () => {
    expect(blockedBy(REF, BOOK, 'sicepat', dest('40135', 'Coblong'), NOW)).toBeNull();
    expect(warnings(REF, BOOK, 'sicepat', dest('40135', 'Coblong'), NOW)).toHaveLength(1);
  });

  it('makes a soft zone from 69% over 30 or more parcels, not over 29', () => {
    const z = softZonesFromHistory({ 'lion|Tebet': { delivered: 69, finished: 100 }, 'spx|Tebet': { delivered: 20, finished: 29 }, 'jne|Tebet': { delivered: 21, finished: 30 } });
    expect(z).toEqual([expect.objectContaining({ courier: 'lion', kecamatan: 'Tebet', soft: true, source: 'history' })]);
  });
});
