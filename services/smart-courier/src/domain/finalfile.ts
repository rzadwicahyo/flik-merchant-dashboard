// The orders exactly as they will be sent, and what changed from the uploaded file (the Review view).
import { FIELDS, type Field, type Row } from './types.js';

export interface Choice {
  status: 'ship' | 'waiting' | 'removed';
  service?: string;
  batch?: string;
}

const cell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function finalFileCsv(rows: Row[], choices: Choice[]): string {
  const head = [...FIELDS, 'status', 'service', 'batch'];
  const lines = rows.map((r, i) => {
    const c = choices[i] ?? { status: 'ship' };
    return [...FIELDS.map((f) => cell(r[f])), c.status, c.service ?? '', c.batch ?? ''].join(',');
  });
  return [head.join(','), ...lines].join('\n') + '\n';
}

export type Difference =
  | { index: number; kind: 'changed'; field: Field; from: string; to: string }
  | { index: number; kind: 'removed' };

export function differences(uploaded: Row[], final: Row[], choices: Choice[]): Difference[] {
  const out: Difference[] = [];
  uploaded.forEach((u, index) => {
    if (choices[index]?.status === 'removed') return void out.push({ index, kind: 'removed' });
    const f = final[index] ?? {};
    for (const field of FIELDS) {
      const from = u[field] ?? '';
      const to = f[field] ?? '';
      if (from !== to) out.push({ index, kind: 'changed', field, from, to });
    }
  });
  return out;
}
