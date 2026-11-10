// A small fixed RefData: a few areas in Bandung, Jakarta Selatan, Surabaya, Semarang, Yogyakarta and Makassar; four couriers.
// All names are real places; every shopper, phone and number is made up.
import { AddressBook } from '../src/domain/address.js';
import type { Area, HistoryLookup, RefData, Tally } from '../src/domain/types.js';
import { hashKey } from '../src/domain/score.js';

const A = (kelurahan: string, kecamatan: string, city: string, province: string, postcode: string): Area => ({ kelurahan, kecamatan, city, province, postcode });

export const AREAS: Area[] = [
  A('Dago', 'Coblong', 'Kota Bandung', 'Jawa Barat', '40135'),
  A('Lebak Siliwangi', 'Coblong', 'Kota Bandung', 'Jawa Barat', '40132'),
  A('Sekeloa', 'Coblong', 'Kota Bandung', 'Jawa Barat', '40134'),
  A('Cipaganti', 'Coblong', 'Kota Bandung', 'Jawa Barat', '40131'),
  A('Sukawarna', 'Sukajadi', 'Kota Bandung', 'Jawa Barat', '40164'),
  A('Isola', 'Sukasari', 'Kota Bandung', 'Jawa Barat', '40154'),
  A('Tebet Timur', 'Tebet', 'Jakarta Selatan', 'DKI Jakarta', '12820'),
  A('Tebet Barat', 'Tebet', 'Jakarta Selatan', 'DKI Jakarta', '12810'),
  A('Cilandak Barat', 'Cilandak', 'Jakarta Selatan', 'DKI Jakarta', '12430'),
  A('Ngagel', 'Wonokromo', 'Kota Surabaya', 'Jawa Timur', '60246'),
  A('Jagir', 'Wonokromo', 'Kota Surabaya', 'Jawa Timur', '60244'),
  A('Gubeng', 'Gubeng', 'Kota Surabaya', 'Jawa Timur', '60281'),
  A('Sekayu', 'Semarang Tengah', 'Kota Semarang', 'Jawa Tengah', '50132'),
  A('Sosromenduran', 'Gedongtengen', 'Kota Yogyakarta', 'DI Yogyakarta', '55271'),
  A('Pringgokusuman', 'Gedongtengen', 'Kota Yogyakarta', 'DI Yogyakarta', '55272'),
  A('Pandang', 'Panakkukang', 'Kota Makassar', 'Sulawesi Selatan', '90231'),
  A('Tamalanrea', 'Tamalanrea', 'Kota Makassar', 'Sulawesi Selatan', '90245'),
];

const T = (delivered: number, finished: number): Tally => ({ delivered, finished });

export const REF: RefData = {
  version: 'test-1',
  areas: AREAS,
  aliases: { jkt: 'jakarta', jaksel: 'jakarta selatan', jabar: 'jawa barat', jatim: 'jawa timur', jateng: 'jawa tengah' },
  synonyms: {
    phone: ['No. HP', 'Telepon', 'Phone', 'WA', 'Nomor WhatsApp'],
    name: ['Nama Penerima', 'Recipient name', 'Nama'],
    street: ['Alamat', 'Street address'],
    kelurahan: ['Kelurahan', 'Desa'],
    kecamatan: ['Kecamatan'],
    city: ['Kota', 'City', 'Kabupaten/Kota'],
    province: ['Provinsi', 'Province'],
    postcode: ['Kode Pos', 'Postcode'],
    product: ['Produk', 'Product name'],
    weight: ['Berat', 'Weight'],
    payment: ['Pembayaran', 'Payment'],
    cod_amount: ['Nilai COD', 'COD amount'],
    warehouse: ['Gudang', 'Warehouse code'],
  },
  fingerprints: [
    {
      name: 'Shopee',
      headers: ['No. Pesanan', 'Nama Penerima', 'No. Telepon', 'Alamat Pengiriman', 'Kota/Kabupaten', 'Provinsi', 'Nama Produk', 'Berat Produk', 'Total Pembayaran'],
      mapping: { 'No. Pesanan': 'order_ref', 'Nama Penerima': 'name', 'No. Telepon': 'phone', 'Alamat Pengiriman': 'street', 'Kota/Kabupaten': 'city', Provinsi: 'province', 'Nama Produk': 'product', 'Berat Produk': 'weight', 'Total Pembayaran': 'cod_amount' },
    },
    {
      name: 'Tokopedia',
      headers: ['Invoice', 'Recipient', 'Recipient Number', 'Recipient Address', 'Product Name', 'Weight (gr)', 'Total Amount'],
      mapping: { Invoice: 'order_ref', Recipient: 'name', 'Recipient Number': 'phone', 'Recipient Address': 'street', 'Product Name': 'product', 'Weight (gr)': 'weight', 'Total Amount': 'cod_amount' },
    },
    {
      name: 'TikTok Shop',
      headers: ['Order ID', 'Recipient', 'Phone #', 'Detail Address', 'Product Name', 'Weight(kg)', 'Order Amount'],
      mapping: { 'Order ID': 'order_ref', Recipient: 'name', 'Phone #': 'phone', 'Detail Address': 'street', 'Product Name': 'product', 'Weight(kg)': 'weight', 'Order Amount': 'cod_amount' },
    },
  ],
  rates: {
    // Coblong: SPX has its own kecamatan history; JNE too
    'spx-std|kec|coblong': T(38, 40),
    'jne-reg|kec|coblong': T(93, 100),
    'sicepat-reg|kec|coblong': T(20, 25),
    'sicepat-reg|city|bandung': T(270, 300),
    // Tebet: nobody has 30 parcels in the kecamatan, the city does
    'spx-std|kec|tebet': T(10, 12),
    'spx-std|city|jakarta selatan': T(180, 200),
    'jne-reg|city|jakarta selatan': T(190, 200),
    // global
    'spx-std|global': T(9000, 10000),
    'jne-reg|global': T(9200, 10000),
    'sicepat-reg|global': T(8800, 10000),
    'ninja-reg|global': T(9100, 10000),
    'gosend-inst|global': T(990, 1000),
  },
  areaCod: { coblong: T(90, 100), tebet: T(80, 100), wonokromo: T(85, 100) },
  redZones: [
    { courier: 'jne', postcode: '90231', kind: 'cod', source: 'courier' },
    { courier: 'jne', postcode: '90245', kind: 'no_delivery', source: 'courier' },
    { courier: 'spx', kecamatan: 'Tamalanrea', kind: 'no_delivery', source: 'courier' },
    { courier: 'ninja', postcode: '90231', kind: 'cod', source: 'manual', endsAt: '2026-10-01T00:00:00Z' },
    { courier: 'sicepat', kecamatan: 'Coblong', kind: 'cod', source: 'history', soft: true },
  ],
  services: [
    { id: 'jne-reg', courier: 'jne', name: 'JNE Regular', group: 'reg' },
    { id: 'spx-std', courier: 'spx', name: 'SPX Standard', group: 'reg' },
    { id: 'sicepat-reg', courier: 'sicepat', name: 'SiCepat Regular', group: 'reg' },
    { id: 'ninja-reg', courier: 'ninja', name: 'Ninja Standard', group: 'reg' },
    { id: 'gosend-inst', courier: 'gosend', name: 'GoSend Instant', group: 'inst' },
  ],
};

export const BOOK = new AddressBook(REF);
export const WAREHOUSES = ['JKT-01', 'BDG-01', 'SBY-01'];
export const SALT = 'test-salt';
export const NOW = new Date('2026-10-14T09:20:00Z');

/** History keyed by plain phone or `street|kelurahan` (normalised), hashed the way the service does it */
export function history(phones: Record<string, Tally>, addresses: Record<string, Tally> = {}): HistoryLookup {
  const ph = new Map(Object.entries(phones).map(([k, v]) => [hashKey(SALT, k), v]));
  const ad = new Map(Object.entries(addresses).map(([k, v]) => [hashKey(SALT, k), v]));
  return { phone: (h) => ph.get(h), address: (h) => ad.get(h) };
}
