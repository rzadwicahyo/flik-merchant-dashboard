// Shared types for the five stages. Every stage is a pure function over its input and a RefData snapshot.

export const FIELDS = [
  'order_ref', 'warehouse', 'name', 'phone', 'street', 'kelurahan', 'kecamatan', 'city', 'province',
  'postcode', 'product', 'qty', 'length', 'width', 'height', 'weight', 'payment', 'cod_amount',
] as const;
export type Field = (typeof FIELDS)[number];

/** Fields a row can't ship without */
export const REQUIRED: readonly Field[] = [
  'warehouse', 'name', 'phone', 'street', 'kelurahan', 'kecamatan', 'city', 'province', 'postcode',
  'product', 'weight', 'payment', 'cod_amount',
];

export type AreaLevel = 'kelurahan' | 'kecamatan' | 'city' | 'province' | 'postcode';
export const AREA_LEVELS: readonly AreaLevel[] = ['province', 'city', 'kecamatan', 'kelurahan', 'postcode'];

/** One kelurahan from the address dictionary */
export interface Area {
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postcode: string;
}

export type Payment = 'COD' | 'NON_COD';
export type ServiceGroup = 'inst' | 'same' | 'next' | 'reg' | 'cargo';

export interface Service {
  id: string; // e.g. jne-reg
  courier: string; // e.g. jne
  name: string; // e.g. JNE Regular
  group: ServiceGroup;
}

/** Delivered and finished parcels, for a rate */
export interface Tally {
  delivered: number;
  finished: number;
}

export interface RedZone {
  courier: string;
  postcode?: string;
  kecamatan?: string;
  kind: 'cod' | 'no_delivery';
  source: 'courier' | 'history' | 'manual';
  /** history zones only warn; they never block */
  soft?: boolean;
  reason?: string;
  endsAt?: string; // ISO date, manual entries only
}

export interface Fingerprint {
  name: string;
  headers: string[];
  mapping: Record<string, Field | 'ignore'>;
}

export interface RefData {
  version: string;
  areas: Area[];
  /** shortenings and common misspellings, normalised: 'jkt' -> 'jakarta' */
  aliases: Record<string, string>;
  synonyms: Partial<Record<Field, string[]>>;
  fingerprints: Fingerprint[];
  /** delivery outcomes per service, keyed `${serviceId}|kec|${kecamatan}`, `${serviceId}|city|${city}` and `${serviceId}|global` */
  rates: Record<string, Tally>;
  /** COD outcomes per kecamatan, all couriers, last 90 days */
  areaCod: Record<string, Tally>;
  redZones: RedZone[];
  services: Service[];
}

/** Shopper and address history, looked up by salted hash */
export interface HistoryLookup {
  phone(hash: string): Tally | undefined;
  address(hash: string): Tally | undefined;
}

/** A row after mapping and normalising; strings as uploaded until fixed */
export type Row = Partial<Record<Field, string>>;

export interface Issue {
  field: Field | 'row';
  code: string;
  text: string;
}

export interface Suggestion {
  field: Field;
  from: string;
  to: string;
  source: 'rule' | 'catalog' | 'history' | 'llm';
}
