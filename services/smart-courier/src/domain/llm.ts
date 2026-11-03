// The only door to an LLM. Off by default until Legal confirms zero retention (LLM_ENABLED=false).
// Names and phone numbers never leave: samples are redacted before any call.
import type { Field } from './types.js';

export interface LlmAdapter {
  enabled: boolean;
  /** Stage 1: which template field a column holds */
  classifyColumn(header: string, samples: string[]): Promise<{ field: Field | 'ignore'; confidence: number } | null>;
  /** Stage 2: one short line saying what is wrong with a row's area fields; never a value */
  explainRow(area: Record<string, string>): Promise<string | null>;
}

export const DISABLED_LLM: LlmAdapter = {
  enabled: false,
  classifyColumn: async () => null,
  explainRow: async () => null,
};

/** Replace anything that looks like a phone number with its shape, so no number reaches a provider */
export function redact(value: string): string {
  return value.replace(/\+?\d[\d\s-]{7,}\d/g, (m) => m.replace(/\d/g, 'x'));
}

/** Wrap a provider so every call is redacted, time-boxed and capped per request */
export function guarded(inner: LlmAdapter, opts = { timeoutMs: 3000, maxCalls: 20 }): LlmAdapter {
  let calls = 0;
  const run = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (!inner.enabled || calls >= opts.maxCalls) return null;
    calls++;
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<null>((resolve) => (timer = setTimeout(() => resolve(null), opts.timeoutMs)));
    try {
      return await Promise.race([fn(), timeout]);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    enabled: inner.enabled,
    classifyColumn: (h, s) => run(() => inner.classifyColumn(redact(h), s.map(redact))).then((r) => r ?? null),
    explainRow: (a) =>
      run(() => inner.explainRow(Object.fromEntries(Object.entries(a).map(([k, v]) => [k, redact(v)])))).then((line) =>
        // one line of text, never something that looks like a value to write back
        typeof line === 'string' && line.length <= 160 && !line.includes('\n') ? line : null,
      ),
  };
}
