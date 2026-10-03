/** A JSON integer retained exactly by the response decoder. */
export type Integer = number | bigint;
/** Numeric request values support the complete unsigned 64-bit range. */
export type NumericIDInput = number | bigint | string;

declare const identifierBrand: unique symbol;
type NumericIdentifier<Name extends string> = Integer & { readonly [identifierBrand]: Name };
type TextIdentifier<Name extends string> = string & { readonly [identifierBrand]: Name };

export type AID = NumericIdentifier<'AID'>;
export type AudioID = NumericIdentifier<'AudioID'>;
export type CID = NumericIdentifier<'CID'>;
export type MID = NumericIdentifier<'MID'>;
export type UID = MID;
export type RoomID = NumericIdentifier<'RoomID'>;
export type MediaID = NumericIdentifier<'MediaID'>;
export type SeasonID = NumericIdentifier<'SeasonID'>;
export type EpisodeID = NumericIdentifier<'EpisodeID'>;
export type NoteID = NumericIdentifier<'NoteID'>;
export type CVID = NumericIdentifier<'CVID'>;
export type BVID = TextIdentifier<'BVID'>;
export type DynamicID = TextIdentifier<'DynamicID'>;

/** Identifier errors preserve the upstream parameter field names. */
export class InvalidError extends TypeError {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`ids: invalid ${field}: ${message}`);
    this.name = 'InvalidError';
    this.field = field;
  }
}

function parseNumeric<Name extends string>(field: string, input: NumericIDInput): NumericIdentifier<Name> {
  let value: bigint;
  if (typeof input === 'number') {
    if (!Number.isSafeInteger(input) || input < 0) {
      throw new InvalidError(field, 'identifier must be a safe unsigned integer number; use bigint or decimal text for larger values');
    }
    value = BigInt(input);
  } else if (typeof input === 'bigint') {
    value = input;
  } else if (typeof input === 'string' && /^[0-9]+$/.test(input)) {
    value = BigInt(input);
  } else {
    throw new InvalidError(field, 'identifier must be an unsigned decimal integer');
  }
  if (value <= 0n || value > 18446744073709551615n) {
    throw new InvalidError(field, value === 0n ? 'identifier must be non-zero' : 'identifier must fit an unsigned 64-bit integer');
  }
  return (value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value) as NumericIdentifier<Name>;
}

export const parseAID = (value: NumericIDInput): AID => parseNumeric<'AID'>('aid', value);
export const parseAudioID = (value: NumericIDInput): AudioID => parseNumeric<'AudioID'>('sid', value);
export const parseCID = (value: NumericIDInput): CID => parseNumeric<'CID'>('cid', value);
export const parseMID = (value: NumericIDInput): MID => parseNumeric<'MID'>('mid', value);
export const parseUID = parseMID;
export const parseRoomID = (value: NumericIDInput): RoomID => parseNumeric<'RoomID'>('room_id', value);
export const parseMediaID = (value: NumericIDInput): MediaID => parseNumeric<'MediaID'>('media_id', value);
export const parseSeasonID = (value: NumericIDInput): SeasonID => parseNumeric<'SeasonID'>('season_id', value);
export const parseEpisodeID = (value: NumericIDInput): EpisodeID => parseNumeric<'EpisodeID'>('ep_id', value);
export const parseNoteID = (value: NumericIDInput): NoteID => parseNumeric<'NoteID'>('note_id', value);
export const parseCVID = (value: NumericIDInput): CVID => parseNumeric<'CVID'>('cvid', value);

export function parseBVID(value: string): BVID {
  if (typeof value !== 'string' || !value.startsWith('BV')) {
    throw new InvalidError('bvid', "identifier must start with 'BV'");
  }
  if (value.length < 12 || !/^[a-zA-Z0-9]+$/.test(value)) {
    throw new InvalidError('bvid', 'identifier must contain at least 12 ASCII alphanumeric characters');
  }
  return value as BVID;
}

export function parseDynamicID(value: string): DynamicID {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidError('dynamic_id', 'identifier cannot be blank');
  }
  return value as DynamicID;
}
