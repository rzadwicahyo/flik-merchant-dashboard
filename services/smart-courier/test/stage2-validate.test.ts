import { describe, expect, it } from 'vitest';
import { checkArea, options } from '../src/domain/address.js';
import { applyFixes, fixAll, validateRows } from '../src/domain/validate.js';
import { guarded, redact, type LlmAdapter } from '../src/domain/llm.js';
import type { Row } from '../src/domain/types.js';
import { BOOK, WAREHOUSES } from './fixtures.js';

const good: Row = {
  warehouse: 'BDG-01', name: 'Sari Wulandari', phone: '6281234567890', street: 'Jl. Dago 12', kelurahan: 'Dago', kecamatan: 'Coblong',
  city: 'Kota Bandung', province: 'Jawa Barat', postcode: '40135', product: 'Tas kanvas', weight: '1', payment: 'COD', cod_amount: '198000',
};
const check = (row: Partial<Row>) => validateRows([{ ...good, ...row }], { warehouses: WAREHOUSES, book: BOOK }).rows[0]!;
const sugg = (r: { suggestions: { field: string; to: string }[] }, f: string) => r.suggestions.find((s) => s.field === f)?.to;

describe('Stage 2: address', () => {
  it('passes a clean row', () => expect(check({}).status).toBe('ready'));

  it('detects swapped kelurahan, kecamatan and city and returns the match table', () => {
    const r = checkArea({ ...good, kelurahan: 'Bandung', kecamatan: 'Dago', city: 'Coblong' }, BOOK);
    expect(r.issues[0]?.code).toBe('area_swapped');
    expect(r.matchTable?.find((m) => m.column === 'kelurahan')?.foundAs).toEqual(['city']);
    expect(r.matchTable?.find((m) => m.column === 'city')?.foundAs).toEqual(['kecamatan']);
    expect(r.suggestions.map((s) => [s.field, s.to])).toEqual([['kelurahan', 'Dago'], ['kecamatan', 'Coblong'], ['city', 'Kota Bandung']]);
  });

  it('suggests Wonokromo for Wonokrmo in Surabaya', () => {
    const r = check({ kelurahan: 'Ngagel', kecamatan: 'Wonokrmo', city: 'Kota Surabaya', province: 'Jawa Timur', postcode: '60246' });
    expect(sugg(r, 'kecamatan')).toBe('Wonokromo');
    expect(r.status).toBe('suggestion');
  });

  it('gives no suggestion when two names are equally close', () => {
    const r = check({ kelurahan: 'Sukawarna', kecamatan: 'Sukasadi', postcode: '40164' });
    expect(sugg(r, 'kecamatan')).toBeUndefined();
    expect(r.issues.find((i) => i.field === 'kecamatan')?.code).toBe('unknown_name');
    expect(r.status).toBe('need_input');
  });

  it('matches "Jkt Selatan" through the alias table', () => {
    const r = check({ kelurahan: 'Tebet Timur', kecamatan: 'Tebet', city: 'Jkt Selatan', province: 'DKI Jakarta', postcode: '12820', warehouse: 'JKT-01' });
    expect(r.status).toBe('ready');
  });

  it('fills an empty postcode from the kelurahan', () => expect(sugg(check({ postcode: '' }), 'postcode')).toBe('40135'));

  it('suggests 40135 for postcode 40153 in Dago', () => {
    const r = check({ postcode: '40153' });
    expect(sugg(r, 'postcode')).toBe('40135');
    expect(r.issues.find((i) => i.field === 'postcode')?.text).toBe("40153 doesn't match Dago. Suggest 40135.");
  });

  it('suggests the kelurahan from the postcode when the kelurahan is unknown', () => {
    const r = check({ kelurahan: 'Xyzabc', postcode: '40134' });
    expect(sugg(r, 'kelurahan')).toBe('Sekeloa');
  });

  it('fixes province spelling and shortenings', () => {
    expect(sugg(check({ kelurahan: 'Ngagel', kecamatan: 'Wonokromo', city: 'Kota Surabaya', province: 'Jawa Tmur', postcode: '60246' }), 'province')).toBe('Jawa Timur');
    expect(check({ province: 'Jabar' }).status).toBe('ready');
  });
});

describe('Stage 2: other checks', () => {
  it('suggests JKT-01 for JKT01', () => expect(sugg(check({ warehouse: 'JKT01' }), 'warehouse')).toBe('JKT-01'));

  it('flags a phone with 9 digits after 62, with no suggestion', () => {
    const r = check({ phone: '62812345678' });
    expect(r.issues.find((i) => i.field === 'phone')?.code).toBe('invalid');
    expect(r.status).toBe('need_input');
  });

  it('flags a street with no number, block or RT/RW, with no suggestion', () => {
    expect(check({ street: 'Jl. Dago' }).issues.find((i) => i.field === 'street')?.code).toBe('no_house_number');
    expect(check({ street: 'Perumahan Indah Blok C' }).issues.some((i) => i.field === 'street')).toBe(false);
  });

  it('needs a COD amount on a COD row but not on a Non-COD row', () => {
    expect(check({ cod_amount: '' }).status).toBe('need_input');
    expect(check({ cod_amount: '', payment: 'Non-COD' }).status).toBe('ready');
  });

  it('flags the second of two identical orders as a possible duplicate', () => {
    const res = validateRows([good, { ...good }], { warehouses: WAREHOUSES, book: BOOK });
    expect(res.rows[0]!.issues.some((i) => i.code === 'duplicate')).toBe(false);
    expect(res.rows[1]!.issues.find((i) => i.code === 'duplicate')?.text).toBe('Same customer, product and address as row 1.');
  });
});

describe('Stage 2: dropdowns and fix all (v4)', () => {
  it('narrows kelurahan options to the valid kecamatan', () => {
    expect(options({ ...good, kelurahan: '' }, 'kelurahan', BOOK)).toEqual(['Cipaganti', 'Dago', 'Lebak Siliwangi', 'Sekeloa']);
  });
  it('gives the postcode of the chosen kelurahan', () => expect(options({ ...good, postcode: '' }, 'postcode', BOOK)).toEqual(['40135']));
  it('narrows by province only when the city is invalid', () => {
    expect(options({ province: 'Jawa Barat', city: 'Xyz' }, 'city', BOOK)).toEqual(['Kota Bandung']);
    expect(options({ province: 'Jawa Barat', city: 'Xyz' }, 'kecamatan', BOOK)).toEqual(['Coblong', 'Sukajadi', 'Sukasari']);
  });

  it('lists every change before applying, and leaves rows that need the merchant', () => {
    const rows: Row[] = [
      { ...good, postcode: '40153' },
      { ...good, warehouse: 'JKT01', phone: '6281111111111' },
      { ...good, kecamatan: '', phone: '6282222222222' },
    ];
    const res = validateRows(rows, { warehouses: WAREHOUSES, book: BOOK });
    const { changes, left } = fixAll(res);
    expect(changes).toEqual([
      { index: 0, field: 'postcode', from: '40153', to: '40135' },
      { index: 1, field: 'warehouse', from: 'JKT01', to: 'JKT-01' },
    ]);
    expect(left).toEqual([2]);
    expect(applyFixes(rows, res)[0]!.postcode).toBe('40135');
  });
});

describe('LLM guard', () => {
  it('never lets a phone number reach the provider', () => expect(redact('Call 0812-3456-7890 now')).toBe('Call xxxx-xxxx-xxxx now'));

  it('keeps only one short line of text, never a value with line breaks', async () => {
    const seen: Record<string, string>[] = [];
    const inner: LlmAdapter = { enabled: true, classifyColumn: async () => null, explainRow: async (a) => (seen.push(a), 'Kelurahan: Dago\nKecamatan: Coblong') };
    expect(await guarded(inner).explainRow({ kecamatan: 'Jl Merdeka', phone: '081234567890' })).toBeNull();
    expect(seen[0]!.phone).toBe('xxxxxxxxxxxx');
  });

  it('times out to null and stops after the per-request cap', async () => {
    const slow: LlmAdapter = { enabled: true, classifyColumn: () => new Promise(() => {}), explainRow: async () => 'The kecamatan looks like a street name' };
    expect(await guarded(slow, { timeoutMs: 10, maxCalls: 20 }).classifyColumn('x', [])).toBeNull();
    const g = guarded(slow, { timeoutMs: 10, maxCalls: 1 });
    expect(await g.explainRow({})).toBe('The kecamatan looks like a street name');
    expect(await g.explainRow({})).toBeNull();
  });
});
