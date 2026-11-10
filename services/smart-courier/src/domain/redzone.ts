// Stage 5: red zones. A list lookup plus one rule on history. No LLM.
import type { AddressBook } from './address.js';
import type { Payment, RedZone, RefData, Tally } from './types.js';

/** A service's COD delivery rate under this, over at least this many finished parcels, is a soft red zone (a warning) */
export const SOFT_RATE = 0.7;
export const SOFT_MIN_PARCELS = 30;

export interface Dest {
  postcode: string;
  kecamatan: string;
  payment: Payment;
}
export type Block = 'cod' | 'cover';

const active = (z: RedZone, now: Date) => !z.endsAt || new Date(z.endsAt) > now;

function zonesAt(ref: RefData, book: AddressBook, courier: string, d: Dest, now: Date): RedZone[] {
  const kec = book.key(d.kecamatan);
  return ref.redZones.filter(
    (z) => z.courier === courier && active(z, now) && ((z.postcode && z.postcode === d.postcode) || (z.kecamatan && book.key(z.kecamatan) === kec)),
  );
}

/** Why a courier can't take this parcel, or null when it can. Soft zones never block */
export function blockedBy(ref: RefData, book: AddressBook, courier: string, d: Dest, now = new Date()): Block | null {
  const hard = zonesAt(ref, book, courier, d, now).filter((z) => !z.soft);
  if (hard.some((z) => z.kind === 'no_delivery')) return 'cover';
  if (d.payment === 'COD' && hard.some((z) => z.kind === 'cod')) return 'cod';
  return null;
}

/** Soft red zones shown as a warning */
export function warnings(ref: RefData, book: AddressBook, courier: string, d: Dest, now = new Date()): RedZone[] {
  return d.payment === 'COD' ? zonesAt(ref, book, courier, d, now).filter((z) => z.soft) : [];
}

/** The daily rule that turns COD history into soft red zones: key is `${courier}|${kecamatan}` */
export function softZonesFromHistory(codByCourierKec: Record<string, Tally>): RedZone[] {
  return Object.entries(codByCourierKec)
    .filter(([, t]) => t.finished >= SOFT_MIN_PARCELS && t.delivered / t.finished < SOFT_RATE)
    .map(([key, t]) => {
      const [courier = '', kecamatan = ''] = key.split('|');
      return { courier, kecamatan, kind: 'cod', source: 'history', soft: true, reason: `${Math.round((100 * t.delivered) / t.finished)}% COD delivered over ${t.finished} parcels` };
    });
}

export const BLOCK_TEXT: Record<Block, string> = { cod: 'Red zone for COD', cover: 'Out of coverage' };
