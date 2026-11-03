// Stage 1: map any order file's columns onto FLIK's template fields.
// Order: saved mapping, known export, synonyms, value patterns, then the LLM (only when switched on).
import { createHash } from 'node:crypto';
import type { LlmAdapter } from './llm.js';
import { normPayment, normPhone, phoneOk } from './normalise.js';
import { REQUIRED, type Field, type RefData } from './types.js';

export type MapSource = 'saved' | 'known' | 'synonym' | 'pattern' | 'llm';
export interface ColumnMap {
  column: string;
  field: Field | 'ignore' | null;
  source: MapSource | null;
  confidence: number;
}
export interface MapResult {
  columns: ColumnMap[];
  /** required fields the merchant must confirm: unmapped, or mapped below 0.8 */
  asked: Field[];
}

export const CONFIRM_BELOW = 0.8;

const normHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** The key a saved mapping is stored under: the same header row gives the same key */
export const headerKey = (headers: string[]) =>
  createHash('sha256').update(headers.map(normHeader).join('|')).digest('hex').slice(0, 16);

/** Value tests per field; a column passes when most of its sample values match */
export const PATTERNS: Partial<Record<Field, (v: string) => boolean>> = {
  phone: (v) => /^\+?[\d\s-]{9,17}$/.test(v.trim()) && phoneOk(normPhone(v)),
  postcode: (v) => /^\d{5}$/.test(v.trim()),
  payment: (v) => normPayment(v) !== null,
  weight: (v) => /^\d+([.,]\d+)?\s*(kg|g|gr|gram)$/i.test(v.trim()),
  cod_amount: (v) => /^(rp\.?\s*)?\d{1,3}([.,]\d{3})+$/i.test(v.trim()) || /^rp\.?\s*\d+$/i.test(v.trim()),
};

export function patternShare(field: Field, samples: string[]): number {
  const test = PATTERNS[field];
  const vals = samples.filter((s) => s && s.trim());
  if (!test || !vals.length) return 0;
  return vals.filter(test).length / vals.length;
}

export interface MapInput {
  headers: string[];
  /** first rows, as arrays in header order */
  sampleRows: string[][];
  saved?: Record<string, Record<string, Field | 'ignore'>>;
}

/** Everything but the LLM step; columns still unknown come back with field null */
export function mapColumns(input: MapInput, ref: RefData): MapResult {
  const { headers, sampleRows } = input;
  const samples = (i: number) => sampleRows.slice(0, 50).map((r) => r[i] ?? '');
  const out: ColumnMap[] = headers.map((column) => ({ column, field: null, source: null, confidence: 0 }));

  const saved = input.saved?.[headerKey(headers)];
  if (saved) return finish(out.map((c) => ({ ...c, field: saved[c.column] ?? null, source: 'saved', confidence: 1 })));

  const fp = ref.fingerprints.find(
    (f) => f.headers.length === headers.length && f.headers.every((h, i) => normHeader(h) === normHeader(headers[i] ?? '')),
  );
  if (fp) return finish(out.map((c) => ({ ...c, field: fp.mapping[c.column] ?? 'ignore', source: 'known', confidence: 1 })));

  const taken = new Set<Field>();
  const synonyms = Object.entries(ref.synonyms) as [Field, string[]][];
  out.forEach((c) => {
    const h = normHeader(c.column);
    const hit = synonyms.find(([f, names]) => !taken.has(f) && names.some((n) => normHeader(n) === h));
    if (hit) Object.assign(c, { field: hit[0], source: 'synonym', confidence: 0.95 }), taken.add(hit[0]);
  });

  out.forEach((c, i) => {
    if (c.field) return;
    let best: [Field, number] | null = null;
    for (const f of Object.keys(PATTERNS) as Field[]) {
      if (taken.has(f)) continue;
      const share = patternShare(f, samples(i));
      if (share >= 0.6 && (!best || share > best[1])) best = [f, share];
    }
    if (best) Object.assign(c, { field: best[0], source: 'pattern', confidence: Math.round(best[1] * 100) / 100 }), taken.add(best[0]);
  });
  return finish(out);
}

function finish(columns: ColumnMap[]): MapResult {
  const asked = REQUIRED.filter((f) => {
    const c = columns.find((x) => x.field === f);
    return !c || c.confidence < CONFIRM_BELOW;
  });
  return { columns, asked };
}

/** Mapping with the LLM fallback for columns the rules left unknown. An answer is kept only if the samples pass that field's pattern */
export async function mapColumnsWithLlm(input: MapInput, ref: RefData, llm: LlmAdapter): Promise<MapResult> {
  const res = mapColumns(input, ref);
  if (!llm.enabled) return res;
  const taken = new Set(res.columns.map((c) => c.field).filter(Boolean));
  for (const [i, c] of res.columns.entries()) {
    if (c.field) continue;
    const samples = input.sampleRows.slice(0, 5).map((r) => r[i] ?? '');
    const ans = await llm.classifyColumn(c.column, samples);
    if (!ans || ans.field === 'ignore' || taken.has(ans.field)) continue;
    if (!PATTERNS[ans.field] || patternShare(ans.field, samples) < 0.6) continue;
    Object.assign(c, { field: ans.field, source: 'llm', confidence: Math.min(ans.confidence, 0.9) });
    taken.add(ans.field);
  }
  return finish(res.columns);
}
