import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/http/app.js';
import type { Row } from '../src/domain/types.js';
import { NOW, REF, SALT, WAREHOUSES, history } from './fixtures.js';

const TOKEN = 'test-token';
const app = buildApp({ refData: () => REF, history: history({}), serviceToken: TOKEN, phoneSalt: SALT, now: () => NOW });
const post = (url: string, payload: unknown, token = TOKEN) =>
  app.inject({ method: 'POST', url: '/internal/v1' + url, payload: payload as object, headers: { authorization: `Bearer ${token}` } });

const ROW: Row = {
  warehouse: 'BDG-01', name: 'Sari Wulandari', phone: '6281234567890', street: 'Jl. Dago 12', kelurahan: 'Dago', kecamatan: 'Coblong',
  city: 'Kota Bandung', province: 'Jawa Barat', postcode: '40135', product: 'Tas kanvas', weight: '1', payment: 'COD', cod_amount: '198000',
};
// 500 different shoppers in a few areas, with typos in some rows
const AREA_ROWS: Partial<Row>[] = [
  {},
  { kelurahan: 'Ngagel', kecamatan: 'Wonokrmo', city: 'Kota Surabaya', province: 'Jawa Timur', postcode: '60246', warehouse: 'SBY-01' },
  { kelurahan: 'Tebet Timur', kecamatan: 'Tebet', city: 'Jkt Selatan', province: 'DKI Jakarta', postcode: '12820', warehouse: 'JKT01' },
  { postcode: '40153' },
];
const bigFile = Array.from({ length: 500 }, (_, i) => ({ ...ROW, ...AREA_ROWS[i % 4], phone: '62812' + String(10000000 + i), street: `Jl. Contoh ${i + 1}` }));

describe('internal API', () => {
  it('refuses a request without the service token', async () => {
    expect((await post('/validate', { rows: [], warehouses: [] }, 'wrong')).statusCode).toBe(401);
  });

  it('answers health without a token', async () => {
    const r = await app.inject({ method: 'GET', url: '/internal/v1/health' });
    expect(r.json()).toEqual({ ok: true, refdata: 'test-1', llm: false });
  });

  it('rejects 501 rows', async () => {
    const r = await post('/validate', { rows: Array.from({ length: 501 }, () => ROW), warehouses: WAREHOUSES });
    expect(r.statusCode).toBe(422);
    expect(r.json().code).toBe('too_many_rows');
  });

  it('runs 500 rows through every stage in under 10 seconds, LLM off', async () => {
    const t0 = performance.now();
    const v = (await post('/validate', { rows: bigFile, warehouses: WAREHOUSES })).json();
    const fixed = (await post('/fix-all', { rows: bigFile, warehouses: WAREHOUSES })).json();
    const orders = fixed.rows.map((r: Row, i: number) => ({ ref: 'R' + i, phone: r.phone, street: r.street, kelurahan: r.kelurahan, kecamatan: r.kecamatan, payment: 'COD' }));
    const s = (await post('/shopper-score', { orders })).json();
    const rec = (await post('/recommendations', {
      orders: fixed.rows.map((r: Row, i: number) => ({ ref: 'R' + i, warehouse: r.warehouse, postcode: r.postcode, kecamatan: r.kecamatan, city: r.city, payment: 'COD', kg: 1 })),
      tab: 'reg', enabled: ['jne-reg', 'spx-std', 'sicepat-reg'], price_per_kg: { 'jne-reg': 14000, 'spx-std': 11000, 'sicepat-reg': 12500 },
    })).json();
    const ff = (await post('/final-file', { uploaded: bigFile, rows: fixed.rows, choices: fixed.rows.map(() => ({ status: 'ship' })) })).json();
    const ms = performance.now() - t0;

    expect(v.counts).toEqual({ ready: 125, suggestions: 375, need_input: 0 });
    expect(fixed.changes).toHaveLength(375); // Wonokromo; JKT-01; postcode 40135
    expect(s).toHaveLength(500);
    expect(rec.orders).toHaveLength(500);
    expect(rec.batches.length).toBeGreaterThan(0);
    expect(ff.csv.trim().split('\n')).toHaveLength(501);
    expect(ms).toBeLessThan(10_000);
  });

  it('checks rates for one route through the API', async () => {
    const r = await post('/check-rate', { to: { postcode: '40135', kecamatan: 'Coblong', city: 'Kota Bandung' }, payment: 'COD', offers: [{ service: 'spx-std', flikPrice: 11000, publishedPrice: 12000, etaDays: [2, 4] }] });
    expect(r.json().services[0]).toMatchObject({ service: 'spx-std', tags: ['recommended', 'cheapest', 'fastest'] });
  });

  it('gives dropdown options through the API', async () => {
    const r = await post('/options', { row: { ...ROW, postcode: '' }, field: 'postcode' });
    expect(r.json()).toEqual({ values: ['40135'] });
  });
});
