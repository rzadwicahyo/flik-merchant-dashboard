// Internal API, called only by the merchant dashboard BE with a service token.
import Fastify, { type FastifyInstance } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import {
  AddressBook, DISABLED_LLM, applyFixes, checkRate, differences, finalFileCsv, fixAll, mapColumnsWithLlm, options, recommend, scoreOrders, validateRows,
  type AreaLevel, type Choice, type RateQuery, type HistoryLookup, type LlmAdapter, type Order, type RefData, type Row, type ScoreInput, type ServiceGroup,
} from '../domain/index.js';

export const MAX_ROWS = 500;

export interface Deps {
  /** the current reference data snapshot; swapped after each daily refresh */
  refData: () => RefData;
  history: HistoryLookup;
  llm?: LlmAdapter;
  serviceToken: string;
  phoneSalt: string;
  now?: () => Date;
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function buildApp(deps: Deps): FastifyInstance {
  // request logs carry the request ID and route only, never bodies (they hold names and phones)
  const app = Fastify({ logger: false, bodyLimit: 5 * 1024 * 1024 });
  let cachedFor: RefData | null = null;
  let book: AddressBook;
  const ctx = () => {
    const ref = deps.refData();
    if (ref !== cachedFor) (book = new AddressBook(ref)), (cachedFor = ref);
    return { ref, book };
  };
  const llm = deps.llm ?? DISABLED_LLM;

  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/internal/v1/health') return;
    const auth = req.headers.authorization ?? '';
    if (!auth.startsWith('Bearer ') || !same(auth.slice(7), deps.serviceToken)) return reply.code(401).send({ code: 'unauthorized' });
  });
  const tooMany = (n: number) => ({ code: 'too_many_rows', message: `Up to ${MAX_ROWS} rows per request; got ${n}.` });

  app.get('/internal/v1/health', async () => {
    const ref = deps.refData();
    return { ok: true, refdata: ref.version, llm: llm.enabled };
  });

  app.post<{ Body: { headers: string[]; sample_rows: string[][]; saved_mappings?: Record<string, Record<string, never>> } }>('/internal/v1/map', async (req) => {
    const { ref } = ctx();
    return mapColumnsWithLlm({ headers: req.body.headers, sampleRows: req.body.sample_rows, saved: req.body.saved_mappings ?? {} }, ref, llm);
  });

  app.post<{ Body: { rows: Row[]; warehouses: string[] } }>('/internal/v1/validate', async (req, reply) => {
    if (req.body.rows.length > MAX_ROWS) return reply.code(422).send(tooMany(req.body.rows.length));
    return validateRows(req.body.rows, { warehouses: req.body.warehouses, book: ctx().book });
  });

  app.post<{ Body: { row: Row; field: AreaLevel } }>('/internal/v1/options', async (req) => ({ values: options(req.body.row, req.body.field, ctx().book) }));

  app.post<{ Body: { rows: Row[]; warehouses: string[] } }>('/internal/v1/fix-all', async (req, reply) => {
    if (req.body.rows.length > MAX_ROWS) return reply.code(422).send(tooMany(req.body.rows.length));
    const res = validateRows(req.body.rows, { warehouses: req.body.warehouses, book: ctx().book });
    return { ...fixAll(res), rows: applyFixes(req.body.rows, res) };
  });

  app.post<{ Body: { orders: ScoreInput[] } }>('/internal/v1/shopper-score', async (req, reply) => {
    if (req.body.orders.length > MAX_ROWS) return reply.code(422).send(tooMany(req.body.orders.length));
    return scoreOrders(req.body.orders, { ...ctx(), history: deps.history, salt: deps.phoneSalt });
  });

  app.post<{ Body: { orders: Order[]; tab: ServiceGroup | 'all'; enabled: string[]; price_per_kg: Record<string, number>; chosen_service?: string } }>(
    '/internal/v1/recommendations',
    async (req, reply) => {
      const b = req.body;
      if (b.orders.length > MAX_ROWS) return reply.code(422).send(tooMany(b.orders.length));
      return recommend({ orders: b.orders, tab: b.tab, enabled: b.enabled, pricePerKg: b.price_per_kg, ...(b.chosen_service ? { chosen: b.chosen_service } : {}) }, { ...ctx(), now: deps.now?.() ?? new Date() });
    },
  );

  app.post<{ Body: RateQuery }>('/internal/v1/check-rate', async (req) => ({ services: checkRate(req.body, { ...ctx(), now: deps.now?.() ?? new Date() }) }));

  app.post<{ Body: { uploaded: Row[]; rows: Row[]; choices: Choice[] } }>('/internal/v1/final-file', async (req) => ({
    csv: finalFileCsv(req.body.rows, req.body.choices),
    differences: differences(req.body.uploaded, req.body.rows, req.body.choices),
  }));

  return app;
}
