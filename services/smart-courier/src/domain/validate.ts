// Stage 2: check every row and suggest fixes. Rules only; the LLM may add an error line later, never a value.
import { AddressBook, checkArea, type MatchCell } from './address.js';
import { normPayment, normPhone, normRupiah, normWeight, phoneOk } from './normalise.js';
import type { Issue, Row, Suggestion } from './types.js';

export type RowStatus = 'ready' | 'suggestion' | 'need_input';
export interface RowCheck {
  index: number;
  status: RowStatus;
  issues: Issue[];
  suggestions: Suggestion[];
  matchTable?: MatchCell[];
}
export interface ValidateResult {
  counts: { ready: number; suggestions: number; need_input: number };
  rows: RowCheck[];
}

const HOUSE_NO = /\d|\bblok\b|\bblk\b|\brt\b|\brw\b/i;
const squash = (s: string) => s.toUpperCase().replace(/[\s_-]/g, '');

export function checkWarehouse(raw: string | undefined, codes: string[]): { issue?: Issue; suggestion?: Suggestion } {
  const v = (raw ?? '').trim();
  if (codes.includes(v)) return {};
  if (!v) return { issue: { field: 'warehouse', code: 'empty', text: 'Warehouse is empty.' } };
  const hit = codes.find((c) => squash(c) === squash(v));
  if (hit) return { issue: { field: 'warehouse', code: 'not_found', text: `Warehouse "${v}" not found. Suggest ${hit}.` }, suggestion: { field: 'warehouse', from: v, to: hit, source: 'rule' } };
  return { issue: { field: 'warehouse', code: 'unknown', text: `Warehouse "${v}" isn't one of your active warehouses.` } };
}

export function validateRows(rows: Row[], ctx: { warehouses: string[]; book: AddressBook }): ValidateResult {
  const seen = new Map<string, number>();
  const out = rows.map((row, index): RowCheck => {
    const issues: Issue[] = [];
    const suggestions: Suggestion[] = [];

    const wh = checkWarehouse(row.warehouse, ctx.warehouses);
    if (wh.issue) issues.push(wh.issue);
    if (wh.suggestion) suggestions.push(wh.suggestion);

    const area = checkArea(row, ctx.book);
    issues.push(...area.issues);
    suggestions.push(...area.suggestions);

    const phone = normPhone(row.phone);
    if (!phoneOk(phone)) issues.push({ field: 'phone', code: 'invalid', text: 'Phone needs 10 to 13 digits after 62, starting with 8.' });
    else if (phone !== row.phone) suggestions.push({ field: 'phone', from: row.phone ?? '', to: phone!, source: 'rule' });

    if (!row.street?.trim()) issues.push({ field: 'street', code: 'empty', text: 'Street address is empty.' });
    else if (!HOUSE_NO.test(row.street)) issues.push({ field: 'street', code: 'no_house_number', text: 'No house number, block or RT/RW.' });

    if (!row.name?.trim()) issues.push({ field: 'name', code: 'empty', text: 'Customer name is empty.' });
    if (!row.product?.trim()) issues.push({ field: 'product', code: 'empty', text: 'Product is empty.' });

    const kg = normWeight(row.weight);
    if (!kg || kg <= 0) issues.push({ field: 'weight', code: 'invalid', text: 'Weight must be above 0.' });

    const pay = normPayment(row.payment);
    if (!pay) issues.push({ field: 'payment', code: 'invalid', text: 'Payment must be COD or Non-COD.' });
    else if (pay === 'COD' && !(normRupiah(row.cod_amount) ?? 0)) issues.push({ field: 'cod_amount', code: 'invalid', text: 'COD amount must be a whole number above 0.' });

    const dupKey = [phone, (row.product ?? '').trim().toLowerCase(), ctx.book.key(row.street), ctx.book.key(row.kelurahan)].join('|');
    if (phone && seen.has(dupKey)) issues.push({ field: 'row', code: 'duplicate', text: `Same customer, product and address as row ${seen.get(dupKey)! + 1}.` });
    else seen.set(dupKey, index);

    // a phone rewritten to 62… is a quiet fix, not something the merchant has to look at
    const fixable = new Set(suggestions.map((s) => s.field));
    const open = issues.filter((i) => i.field === 'row' ? i.code !== 'area_swapped' : !fixable.has(i.field));
    const status: RowStatus = open.some((i) => i.code !== 'no_house_number' && i.code !== 'duplicate')
      ? 'need_input'
      : suggestions.some((s) => s.field !== 'phone') ? 'suggestion' : 'ready';
    return { index, status, issues, suggestions, ...(area.matchTable ? { matchTable: area.matchTable } : {}) };
  });
  return {
    counts: {
      ready: out.filter((r) => r.status === 'ready').length,
      suggestions: out.filter((r) => r.status === 'suggestion').length,
      need_input: out.filter((r) => r.status === 'need_input').length,
    },
    rows: out,
  };
}

/** Every suggestion as one change, for the "Fix all" confirmation, and the rows still left for the merchant */
export function fixAll(res: ValidateResult) {
  const changes = res.rows.flatMap((r) => r.suggestions.filter((s) => s.field !== 'phone').map((s) => ({ index: r.index, field: s.field, from: s.from, to: s.to })));
  const left = res.rows.filter((r) => r.status === 'need_input').map((r) => r.index);
  return { changes, left };
}

/** Apply suggestions to the rows, returning new rows */
export function applyFixes(rows: Row[], res: ValidateResult): Row[] {
  return rows.map((row, i) => {
    const next = { ...row };
    for (const s of res.rows[i]?.suggestions ?? []) next[s.field] = s.to;
    return next;
  });
}
