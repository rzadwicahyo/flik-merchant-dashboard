// Stage 2 address checks: swapped fields, approximate spelling, postcode lookup.
// Everything is a dictionary lookup; nothing here calls an LLM.
import { editDistance, normName } from './normalise.js';
import type { Area, AreaLevel, Issue, RefData, Row, Suggestion } from './types.js';

const ROW_FIELD: Record<AreaLevel, 'kelurahan' | 'kecamatan' | 'city' | 'province' | 'postcode'> = {
  kelurahan: 'kelurahan', kecamatan: 'kecamatan', city: 'city', province: 'province', postcode: 'postcode',
};
/** Each level and the level whose valid value narrows it */
const PARENT: Record<'province' | 'city' | 'kecamatan' | 'kelurahan', AreaLevel | null> = {
  province: null, city: 'province', kecamatan: 'city', kelurahan: 'kecamatan',
};
export const MAX_EDITS = 2;

export interface MatchCell {
  column: AreaLevel;
  value: string;
  foundAs: AreaLevel[];
}

export class AddressBook {
  private readonly aliases: [RegExp, string][];
  constructor(readonly ref: RefData) {
    this.aliases = Object.entries(ref.aliases).map(([k, v]) => [new RegExp(`\\b${k}\\b`, 'g'), v]);
  }

  /** Normalised name with shortenings expanded: "Jkt Selatan" -> "jakarta selatan" */
  key(raw: string | undefined): string {
    let s = normName(raw);
    for (const [re, v] of this.aliases) s = s.replace(re, v);
    return s;
  }

  areasWhere(level: AreaLevel, raw: string | undefined, within: Area[] = this.ref.areas): Area[] {
    const k = level === 'postcode' ? String(raw ?? '').trim() : this.key(raw);
    if (!k) return [];
    return within.filter((a) => (level === 'postcode' ? a.postcode === k : this.key(a[level]) === k));
  }

  /** Every level at which this value is a known name */
  levelsOf(raw: string): AreaLevel[] {
    return (['kelurahan', 'kecamatan', 'city', 'province', 'postcode'] as AreaLevel[]).filter(
      (l) => this.areasWhere(l, raw).length > 0,
    );
  }

  /** The one closest name at a level within the given areas, or null when there is none or two tie */
  closest(level: AreaLevel, raw: string, within: Area[]): string | null {
    const k = this.key(raw);
    const names = [...new Set(within.map((a) => a[level]))];
    let best: string | null = null;
    let bestD = Infinity;
    let tie = false;
    for (const n of names) {
      const d = editDistance(k, this.key(n));
      if (d < bestD) (best = n), (bestD = d), (tie = false);
      else if (d === bestD) tie = true;
    }
    return best && bestD <= MAX_EDITS && !tie ? best : null;
  }
}

export interface AreaCheck {
  issues: Issue[];
  suggestions: Suggestion[];
  matchTable?: MatchCell[];
  /** the dictionary area the row resolves to after the suggestions, if exactly one */
  area?: Area;
}

const LEVELS_TOP_DOWN = ['province', 'city', 'kecamatan', 'kelurahan'] as const;

export function checkArea(row: Row, book: AddressBook): AreaCheck {
  const issues: Issue[] = [];
  const suggestions: Suggestion[] = [];
  const v: Record<AreaLevel, string> = {
    province: row.province ?? '', city: row.city ?? '', kecamatan: row.kecamatan ?? '',
    kelurahan: row.kelurahan ?? '', postcode: (row.postcode ?? '').trim(),
  };
  const suggest = (level: AreaLevel, to: string) => {
    if (to === v[level]) return;
    suggestions.push({ field: ROW_FIELD[level], from: v[level], to, source: 'rule' });
    v[level] = to;
  };

  // 1. Swapped fields: kelurahan, kecamatan and city hold the right names in the wrong columns
  const exact = book.areasWhere('kelurahan', v.kelurahan, book.areasWhere('kecamatan', v.kecamatan, book.areasWhere('city', v.city)));
  let matchTable: MatchCell[] | undefined;
  if (!exact.length) {
    const vals = [v.kelurahan, v.kecamatan, v.city].map((x) => book.key(x));
    const swapped = book.ref.areas.filter((a) => {
      const want = [a.kelurahan, a.kecamatan, a.city].map((x) => book.key(x));
      return want.every((w) => vals.includes(w)) && new Set(vals).size === 3;
    });
    if (swapped.length === 1) {
      const a = swapped[0]!;
      matchTable = (['kelurahan', 'kecamatan', 'city', 'province', 'postcode'] as AreaLevel[]).map((column) => ({
        column, value: v[column], foundAs: v[column] ? book.levelsOf(v[column]) : [],
      }));
      issues.push({ field: 'row', code: 'area_swapped', text: 'Kelurahan, kecamatan and city are in the wrong columns.' });
      suggest('kelurahan', a.kelurahan);
      suggest('kecamatan', a.kecamatan);
      suggest('city', a.city);
    }
  }

  // 2. Spelling, top down, each level narrowed by its parent once that is valid
  let pool = book.ref.areas;
  for (const level of LEVELS_TOP_DOWN) {
    const parent = PARENT[level];
    const raw = v[level];
    if (!raw) {
      // an empty province or city can be filled from the levels below; the rest needs the merchant
      if (level === 'kelurahan' || level === 'kecamatan') issues.push({ field: level, code: 'empty', text: `${label(level)} is empty.` });
      continue;
    }
    const found = book.areasWhere(level, raw, pool);
    if (found.length) {
      pool = found;
      continue;
    }
    const fix = book.closest(level, raw, pool);
    if (fix) {
      issues.push({ field: level, code: 'not_found', text: `${label(level)} "${raw}" not found. Suggest ${fix}.` });
      suggest(level, fix);
      pool = book.areasWhere(level, fix, pool);
    } else {
      issues.push({ field: level, code: 'unknown_name', text: `${label(level)} "${raw}" not found.` });
      if (parent === null) continue;
    }
  }

  // 3. Postcode from the kelurahan; or the kelurahan from the postcode when the kelurahan is unknown
  let area = pool.length === 1 ? pool[0] : undefined;
  if (area) {
    if (!v.postcode) {
      issues.push({ field: 'postcode', code: 'empty', text: `Postcode is empty. Filled with ${area.postcode}.` });
      suggest('postcode', area.postcode);
    } else if (v.postcode !== area.postcode) {
      issues.push({ field: 'postcode', code: 'mismatch', text: `${v.postcode} doesn't match ${area.kelurahan}. Suggest ${area.postcode}.` });
      suggest('postcode', area.postcode);
    }
    if (!v.province || book.key(v.province) !== book.key(area.province)) suggest('province', area.province);
    if (!v.city) suggest('city', area.city);
  } else if (v.postcode && issues.some((i) => i.field === 'kelurahan')) {
    const byZip = book.areasWhere('postcode', v.postcode, pool.length ? pool : book.ref.areas);
    if (byZip.length === 1) {
      area = byZip[0]!;
      suggest('kelurahan', area.kelurahan);
      issues.find((i) => i.field === 'kelurahan')!.text += ` Postcode ${v.postcode} is ${area.kelurahan}.`;
    }
  }
  return { issues, suggestions, ...(matchTable ? { matchTable } : {}), ...(area ? { area } : {}) };
}

const label = (l: AreaLevel) => ({ kelurahan: 'Kelurahan', kecamatan: 'Kecamatan', city: 'City', province: 'Province', postcode: 'Postcode' })[l];

/** Values for one cell's dropdown, narrowed by the row's other cells that are already valid, top down */
export function options(row: Row, field: AreaLevel, book: AddressBook): string[] {
  let pool = book.ref.areas;
  for (const level of LEVELS_TOP_DOWN) {
    if (level === field) break;
    const n = book.areasWhere(level, row[level], pool);
    if (n.length) pool = n;
  }
  if (field === 'postcode' && row.kelurahan) {
    const n = book.areasWhere('kelurahan', row.kelurahan, pool);
    if (n.length) pool = n;
  }
  return [...new Set(pool.map((a) => a[field]))].sort();
}

/** One address column holding street, kelurahan, kecamatan, city (and maybe province and postcode), split on commas from the end */
export function splitAddress(raw: string, book: AddressBook): Row {
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  const out: Row = {};
  const take = (level: AreaLevel) => {
    const last = parts[parts.length - 1];
    if (last === undefined) return;
    const hit = book.areasWhere(level, last)[0];
    if (hit) (out[level] = level === 'postcode' ? hit.postcode : hit[level]), parts.pop();
  };
  take('postcode');
  take('province');
  take('city');
  take('kecamatan');
  take('kelurahan');
  out.street = parts.join(', ');
  return out;
}
