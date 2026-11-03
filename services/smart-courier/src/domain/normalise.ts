import type { Payment } from './types.js';

/** Digits only, as 62 followed by the mobile number; null when it can't be read as an Indonesian number */
export function normPhone(raw: string | undefined): string | null {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('62')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return d ? '62' + d : null;
}

/** A phone FLIK can deliver to: 10 to 13 digits after 62, starting with 8 */
export function phoneOk(p: string | null): boolean {
  if (!p) return false;
  const rest = p.slice(2);
  return rest.startsWith('8') && rest.length >= 10 && rest.length <= 13;
}

/** kg from "1,5", "1.5", "1500 gr", "2 kg"; null when unreadable */
export function normWeight(raw: string | undefined): number | null {
  const s = String(raw ?? '').trim().toLowerCase();
  const m = s.match(/^([\d.,]+)\s*(kg|kilo|g|gr|gram)?$/);
  if (!m || !m[1]) return null;
  const num = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(num)) return null;
  return m[2] && m[2].startsWith('g') ? num / 1000 : num;
}

/** Whole rupiah from "Rp1.250.000", "1,250,000", "1250000" */
export function normRupiah(raw: string | undefined): number | null {
  const d = String(raw ?? '').replace(/[^\d]/g, '');
  return d ? Number(d) : null;
}

const COD_WORDS = ['cod', 'bayar di tempat', 'cash on delivery', 'bayar ditempat'];
const NON_COD_WORDS = ['non cod', 'non-cod', 'noncod', 'non_cod', 'transfer', 'prepaid', 'lunas', 'sudah bayar'];

export function normPayment(raw: string | undefined): Payment | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (NON_COD_WORDS.includes(s)) return 'NON_COD';
  if (COD_WORDS.includes(s)) return 'COD';
  return null;
}

/** The weight a courier charges: the higher of the weight and L x W x H / 6,000, each rounded up, at least 1 kg */
export function chargedKg(kg: number, l = 0, w = 0, h = 0): number {
  return Math.max(1, Math.ceil(kg || 0), Math.ceil((l * w * h) / 6000));
}

/** Lower case, no punctuation, no area prefixes, single spaces: "Kec. Coblong" -> "coblong" */
export function normName(raw: string | undefined): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[.,/#()'"-]/g, ' ')
    .replace(/\b(kota|kabupaten|kab|kec|kecamatan|kel|kelurahan|desa|prov|provinsi)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Optimal string alignment distance (Levenshtein plus swapped neighbours) */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => d[i]![j]!;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, at(i - 2, j - 2) + 1);
      d[i]![j] = v;
    }
  }
  return at(a.length, b.length);
}
