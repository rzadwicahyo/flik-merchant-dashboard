// Entry point. Secrets come from the environment's secret store (a local .env only on a laptop), never from the repo.
import type { RefData } from '../domain/index.js';
import { buildApp } from './app.js';

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set`);
  return v;
};

// Until the daily refresh job and PostgreSQL are wired in, the service starts with empty reference data.
const empty: RefData = { version: 'empty', areas: [], aliases: {}, synonyms: {}, fingerprints: [], rates: {}, areaCod: {}, redZones: [], services: [] };

const app = buildApp({
  refData: () => empty,
  history: { phone: () => undefined, address: () => undefined },
  serviceToken: need('SMART_COURIER_TOKEN'),
  phoneSalt: need('PHONE_HASH_SALT'),
});

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 8080) });
