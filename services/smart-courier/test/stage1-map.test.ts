import { describe, expect, it } from 'vitest';
import { headerKey, mapColumns, mapColumnsWithLlm } from '../src/domain/map.js';
import { DISABLED_LLM, type LlmAdapter } from '../src/domain/llm.js';
import { chargedKg, normPayment, normPhone, normRupiah, normWeight } from '../src/domain/normalise.js';
import { splitAddress } from '../src/domain/address.js';
import { BOOK, REF } from './fixtures.js';

const fieldOf = (r: ReturnType<typeof mapColumns>, col: string) => r.columns.find((c) => c.column === col);

describe('Stage 1: map columns', () => {
  it('reuses a saved mapping for a header row seen before', () => {
    const headers = ['Kolom A', 'Kolom B'];
    const r = mapColumns({ headers, sampleRows: [], saved: { [headerKey(headers)]: { 'Kolom A': 'name', 'Kolom B': 'phone' } } }, REF);
    expect(fieldOf(r, 'Kolom A')).toMatchObject({ field: 'name', source: 'saved' });
  });

  it.each(REF.fingerprints.map((f) => [f.name, f] as const))('maps a %s export in one step', (_, fp) => {
    const r = mapColumns({ headers: fp.headers, sampleRows: [] }, REF);
    expect(r.columns.every((c) => c.source === 'known')).toBe(true);
    expect(fieldOf(r, fp.headers[1]!)?.field).toBe('name');
  });

  it.each(['No. HP', 'Telepon', 'WA'])('maps "%s" to the phone field by synonym', (h) => {
    const r = mapColumns({ headers: [h], sampleRows: [] }, REF);
    expect(fieldOf(r, h)).toMatchObject({ field: 'phone', source: 'synonym' });
  });

  it('maps an unnamed column of 0812… values by pattern', () => {
    const r = mapColumns({ headers: ['Kolom 7'], sampleRows: [['081234567890'], ['0857-1111-2222'], ['+62 813 5555 6666']] }, REF);
    expect(fieldOf(r, 'Kolom 7')).toMatchObject({ field: 'phone', source: 'pattern' });
  });

  it('asks about an unknown column when the LLM is off', async () => {
    const r = await mapColumnsWithLlm({ headers: ['Catatan'], sampleRows: [['tolong cepat']] }, REF, DISABLED_LLM);
    expect(fieldOf(r, 'Catatan')?.field).toBeNull();
    expect(r.asked).toContain('postcode');
  });

  it('rejects an LLM answer whose samples fail the pattern', async () => {
    const llm: LlmAdapter = { enabled: true, classifyColumn: async () => ({ field: 'postcode', confidence: 0.9 }), explainRow: async () => null };
    const r = await mapColumnsWithLlm({ headers: ['Misteri'], sampleRows: [['abc'], ['def']] }, REF, llm);
    expect(fieldOf(r, 'Misteri')?.field).toBeNull();
    expect(r.asked).toContain('postcode');
  });

  it('keeps an LLM answer whose first samples pass the pattern', async () => {
    // a messy column: the first rows hold postcodes, later rows hold notes, so the pattern step alone can't tell
    const llm: LlmAdapter = { enabled: true, classifyColumn: async () => ({ field: 'postcode', confidence: 0.85 }), explainRow: async () => null };
    const rows = [...['40135', '12820', '60246', '50132', '55271'].map((v) => [v]), ...Array.from({ length: 6 }, () => ['lihat catatan'])];
    const r = await mapColumnsWithLlm({ headers: ['ZIP?'], sampleRows: rows }, REF, llm);
    expect(fieldOf(r, 'ZIP?')).toMatchObject({ field: 'postcode', source: 'llm' });
  });

  it('splits one address column into street, kelurahan, kecamatan and city', () => {
    expect(splitAddress('Jl. Merdeka 5, Dago, Coblong, Bandung', BOOK)).toEqual({
      street: 'Jl. Merdeka 5', kelurahan: 'Dago', kecamatan: 'Coblong', city: 'Kota Bandung',
    });
  });
});

describe('normalising', () => {
  it.each([
    ['+62 812-3456-7890', '6281234567890'],
    ['0812 3456 7890', '6281234567890'],
    ['8123456789', '628123456789'],
  ])('phone %s -> %s', (raw, want) => expect(normPhone(raw)).toBe(want));

  it.each([['1,5'], ['1.5'], ['1500 gr']])('weight %s -> 1.5 kg', (raw) => expect(normWeight(raw)).toBe(1.5));

  it('reads rupiah and payment words', () => {
    expect(normRupiah('Rp1.250.000')).toBe(1250000);
    expect(normPayment('Bayar di tempat')).toBe('COD');
    expect(normPayment('Non-COD')).toBe('NON_COD');
    expect(normPayment('kartu')).toBeNull();
  });

  it.each([
    [0.4, 10, 10, 60, 1],
    [2.3, 30, 30, 30, 5],
    [0, 0, 0, 0, 1],
  ])('charged weight of %s kg at %sx%sx%s cm is %s kg', (kg, l, w, h, want) => expect(chargedKg(kg, l, w, h)).toBe(want));
});
