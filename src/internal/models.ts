// Shared generated-model decoder. Copied to src/internal/models.ts by models.mjs.
import * as ids from '../ids/index.js';
import { parseJSON } from '../client/json.js';

export type ModelType =
  | { kind: 'unknown' }
  | { kind: 'named'; name: string; args: ModelType[] }
  | { kind: 'pointer'; value: ModelType }
  | { kind: 'array'; value: ModelType; length: string | null }
  | { kind: 'map'; key: ModelType; value: ModelType }
  | { kind: 'struct'; fields: ModelField[] };
export interface ModelField {
  names: string[];
  value: ModelType;
  tag: string;
  name?: string;
  optional?: boolean;
  embed?: boolean;
  derived?: boolean;
}
export interface ModelDefinition { generic: string[]; value: ModelType; }
export type ModelNormalizer = (modelName: string, payload: unknown) => unknown;

function object(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('model payload must be a JSON object');
  return value as Record<string, unknown>;
}
function own(value: Record<string, unknown>, key: string): boolean { return Object.hasOwn(value, key); }
function numeric(value: unknown, bits: number, unsigned: boolean, quoted = false): number | bigint {
  if (value === null || value === undefined) return 0;
  let parsed: bigint;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new TypeError('integer payload must be exact; use the lossless JSON decoder');
    parsed = BigInt(value);
  } else if (typeof value === 'bigint') parsed = value;
  else if (quoted && typeof value === 'string' && (unsigned ? /^[0-9]+$/ : /^[+-]?[0-9]+$/).test(value)) parsed = BigInt(value);
  else throw new TypeError('integer payload has an invalid JSON type');
  const min = unsigned ? 0n : -(1n << BigInt(bits - 1));
  const max = unsigned ? (1n << BigInt(bits)) - 1n : (1n << BigInt(bits - 1)) - 1n;
  if (parsed < min || parsed > max) throw new RangeError(`integer payload is outside ${unsigned ? 'uint' : 'int'}${bits}`);
  return parsed >= BigInt(Number.MIN_SAFE_INTEGER) && parsed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(parsed) : parsed;
}
function parseType(expression: string): ModelType {
  if (expression.startsWith('[]')) return { kind: 'array', length: null, value: parseType(expression.slice(2)) };
  if (expression.startsWith('*')) return { kind: 'pointer', value: parseType(expression.slice(1)) };
  const bracket = expression.indexOf('[');
  if (bracket < 0) return { kind: 'named', name: expression, args: [] };
  const name = expression.slice(0, bracket);
  const argumentsText = expression.slice(bracket + 1, -1);
  const args: ModelType[] = [];
  let nesting = 0;
  let start = 0;
  for (let index = 0; index <= argumentsText.length; index++) {
    const char = argumentsText[index];
    if (char === '[') nesting++;
    if (char === ']') nesting--;
    if (index === argumentsText.length || (char === ',' && nesting === 0)) {
      args.push(parseType(argumentsText.slice(start, index).trim())); start = index + 1;
    }
  }
  return { kind: 'named', name, args };
}
function formatType(type: ModelType, bindings: Record<string, ModelType>): string {
  if (type.kind === 'pointer') return '*' + formatType(type.value, bindings);
  if (type.kind === 'array') return '[]' + formatType(type.value, bindings);
  if (type.kind === 'named') {
    if (bindings[type.name]) return formatType(bindings[type.name]!, {});
    return type.name + (type.args.length ? '[' + type.args.map(arg => formatType(arg, bindings)).join(',') + ']' : '');
  }
  throw new TypeError('cross-domain generic argument must be a named type, pointer, or array');
}

/** Model validation follows Go's JSON integer widths and validated ID types.
 * Missing fields keep Go zero values; null pointers and slices remain null. */
export function createModelNormalizer(
  domain: string,
  definitions: Record<string, ModelDefinition>,
  dependencies: Record<string, ModelNormalizer> = {},
): ModelNormalizer {
  const parseID: Record<string, (value: ids.NumericIDInput) => ids.Integer> = {
    AID: ids.parseAID, AudioID: ids.parseAudioID, CID: ids.parseCID, MID: ids.parseMID,
    RoomID: ids.parseRoomID, MediaID: ids.parseMediaID, SeasonID: ids.parseSeasonID,
    EpisodeID: ids.parseEpisodeID, NoteID: ids.parseNoteID, CVID: ids.parseCVID,
  };
  const normalize: ModelNormalizer = (expression, value) => walk(parseType(expression), value, {});
  function special(name: string, input: unknown): unknown {
    if (domain === 'user' && name === 'SpaceNotice') {
      if (input !== null && input !== undefined && typeof input !== 'string') throw new TypeError('space notice payload must be a string');
      return { content: input ?? '' };
    }
    if (domain === 'article' && name === 'CardItem') {
      const value = object(input);
      for (const [marker, target, output] of [['aid', 'VideoCard', 'video'], ['room_id', 'LiveCard', 'live'], ['id', 'ArticleCard', 'article']] as const) {
        if (own(value, marker)) {
          try { return { video: null, article: null, live: null, raw: null, [output]: normalize(target, value) }; }
          catch { /* The Go variant decoder deliberately retains incompatible schemas as raw JSON. */ }
        }
      }
      return { video: null, article: null, live: null, raw: input ?? null };
    }
    return undefined;
  }
  function prepare(name: string, input: unknown): Record<string, unknown> {
    const value = { ...object(input) };
    if (domain === 'user' && name === 'CardSummary' && own(value, 'mid')) value.mid = ids.parseMID(value.mid as ids.NumericIDInput);
    if (domain === 'user' && name === 'NameToUIDItem' && own(value, 'uid')) value.uid = ids.parseMID(value.uid as ids.NumericIDInput);
    if (domain === 'login' && name === 'Nav') {
      const mid = numeric(value.mid, 64, true);
      value.mid = mid === 0 || mid === 0n ? null : mid;
      for (const key of ['uname', 'face']) {
        const text = value[key];
        if (text !== null && text !== undefined && typeof text !== 'string') throw new TypeError(`navigation ${key} must be a string`);
        value[key] = typeof text === 'string' && text.trim() !== '' ? text : null;
      }
    }
    if (domain === 'login' && name === 'Captcha' && own(value, 'geetest')) {
      const geetest = object(value.geetest); value.gt = geetest.gt; value.challenge = geetest.challenge;
    }
    if (domain === 'bangumi' && name === 'Stat') {
      if (!own(value, 'coins') && own(value, 'coin')) value.coins = value.coin;
      if (!own(value, 'views') && own(value, 'play')) value.views = value.play;
    }
    if (domain === 'video' && name === 'CollectionPage') {
      for (const key of ['page_num', 'num', 'page_size', 'size']) {
        if (own(value, key)) numeric(value[key], 64, true);
      }
      value.page = value.page_num ?? value.num ?? 0;
      value.size = value.page_size ?? value.size ?? 0;
    }
    if (domain === 'video' && name === 'DASHStream') {
      // The Go decoder reads the alternative schema even when it does not need
      // a fallback, so malformed alias fields still fail model validation.
      for (const key of ['base_url', 'mime_type', 'frame_rate']) {
        if (value[key] !== null && value[key] !== undefined && typeof value[key] !== 'string') throw new TypeError(`DASH ${key} must be a string`);
      }
      if (value.backup_url !== null && value.backup_url !== undefined && (!Array.isArray(value.backup_url) || value.backup_url.some(item => item !== null && typeof item !== 'string'))) throw new TypeError('DASH backup_url must be an array of strings');
      if (value.baseUrl === '' || value.baseUrl === undefined || value.baseUrl === null) value.baseUrl = value.base_url;
      if (value.backupUrl === undefined || value.backupUrl === null) value.backupUrl = value.backup_url;
      if (value.mimeType === '' || value.mimeType === undefined || value.mimeType === null) value.mimeType = value.mime_type;
      if (value.frameRate === undefined || value.frameRate === null) value.frameRate = value.frame_rate;
    }
    if (domain === 'video' && name === 'DASHDolby') {
      try { value.type = numeric(value.type, 8, true); }
      catch { value.type = 0; }
    }
    if (domain === 'dynamic') {
      const uintFields = name === 'Feed' || name === 'NavFeed' ? ['update_num'] : name === 'NavAuthor' ? ['mid'] : name === 'NavItem' ? ['rid'] : [];
      for (const key of uintFields) value[key] = numeric(value[key], 64, true, true);
      if (name === 'MyInfo') for (const key of ['dyns', 'following', 'mid']) value[key] = numeric(value[key], 64, false, true);
      if (name === 'DetailItem') {
        const id = value.id_str;
        if (id === null || id === undefined) value.id_str = '';
        else if (typeof id === 'number' || typeof id === 'bigint') {
          if (typeof id === 'number' && (!Number.isFinite(id) || Number.isInteger(id) && !Number.isSafeInteger(id))) throw new TypeError('dynamic id_str number must preserve integer precision');
          value.id_str = String(id);
        }
        else if (typeof id !== 'string') throw new TypeError('dynamic id_str must be a string, number, or null');
      }
    }
    return value;
  }
  function finish(name: string, input: unknown, decoded: unknown): unknown {
    if (domain === 'live' && name === 'LotteryInfo') {
      const value = object(decoded);
      value.extra = Object.fromEntries(Object.entries(object(input)).filter(([key]) => key !== 'popularity_red_pocket' && key !== 'activity_box_info'));
    }
    if (domain === 'webwidget' && name === 'HeaderData') {
      const value = object(decoded);
      const text = value.split_layer;
      if (typeof text === 'string' && text.trim() !== '') value.parsedSplitLayer = normalize('SplitLayer', parseJSON(text));
    }
    return decoded;
  }
  function walk(type: ModelType, value: unknown, bindings: Record<string, ModelType>): unknown {
    if (type.kind === 'unknown') return value ?? null;
    if (type.kind === 'pointer') return value === null || value === undefined ? null : walk(type.value, value, bindings);
    if (type.kind === 'array') {
      if (value === null || value === undefined) return null;
      if (!Array.isArray(value)) throw new TypeError('model array payload must be an array');
      if (type.length !== null && value.length !== Number(type.length)) throw new TypeError('model fixed array length does not match');
      return value.map(item => walk(type.value, item, bindings));
    }
    if (type.kind === 'map') {
      if (value === null || value === undefined) return null;
      return Object.fromEntries(Object.entries(object(value)).map(([key, item]) => [key, walk(type.value, item, bindings)]));
    }
    if (type.kind === 'struct') {
      const input = object(value);
      const result: Record<string, unknown> = {};
      for (const field of type.fields) {
        if (field.embed) Object.assign(result, walk(field.value, input, bindings));
        else if (field.name) {
          Object.defineProperty(result, field.name, { value: walk(field.value, field.derived ? undefined : input[field.name], bindings), enumerable: true, writable: true, configurable: true });
        }
      }
      return result;
    }
    const binding = bindings[type.name];
    if (binding) return walk(binding, value, {});
    if (type.name === 'json.RawMessage' || type.name === 'any') return value ?? null;
    if (type.name === 'xml.Name') {
      const name = object(value);
      return { space: walk({ kind: 'named', name: 'string', args: [] }, name.space, {}), local: walk({ kind: 'named', name: 'string', args: [] }, name.local, {}) };
    }
    if (type.name === 'bool') {
      if (value === null || value === undefined) return false;
      if (typeof value !== 'boolean') throw new TypeError('boolean payload must be a JSON boolean');
      return value;
    }
    if (type.name === 'string') {
      if (value === null || value === undefined) return '';
      if (typeof value !== 'string') throw new TypeError('string payload must be a JSON string');
      return value;
    }
    if (/^(?:u?int(?:8|16|32|64)?|byte|rune)$/.test(type.name)) {
      const unsigned = type.name.startsWith('u') || type.name === 'byte';
      const width = type.name === 'byte' ? 8 : type.name === 'rune' ? 32 : Number(type.name.match(/\d+/)?.[0] ?? 64);
      return numeric(value, width, unsigned);
    }
    if (/^float(?:32|64)$/.test(type.name)) {
      if (value === null || value === undefined) return 0;
      if (typeof value !== 'number' && typeof value !== 'bigint') throw new TypeError('float payload must be a JSON number');
      const parsed = type.name === 'float32' ? Math.fround(Number(value)) : Number(value);
      if (!Number.isFinite(parsed)) throw new RangeError(`${type.name} payload must be finite and within its supported range`);
      return parsed;
    }
    if (type.name.startsWith('ids.')) {
      const name = type.name.slice(4);
      if (value === undefined) return name === 'BVID' || name === 'DynamicID' ? '' : 0;
      if (name === 'BVID') return ids.parseBVID(value as string);
      if (name === 'DynamicID') return ids.parseDynamicID(value as string);
      const parser = parseID[name];
      if (!parser) throw new TypeError(`unknown validated ID ${name}`);
      if (typeof value !== 'number' && typeof value !== 'bigint') throw new TypeError(`${name} payload must be an unsigned JSON integer`);
      return parser(value);
    }
    if (type.name.includes('.')) {
      const [other, name] = type.name.split('.') as [string, string];
      if (other !== domain) {
        const dependency = dependencies[other];
        if (!dependency) throw new TypeError(`missing model dependency ${other}`);
        return dependency(formatType(type, bindings), value);
      }
      return walk({ ...type, name }, value, bindings);
    }
    const definition = definitions[type.name];
    if (!definition) throw new TypeError(`unknown model ${domain}.${type.name}`);
    const bound = { ...bindings };
    definition.generic.forEach((name, index) => { bound[name] = type.args[index] ?? { kind: 'unknown' }; });
    if (definition.value.kind === 'struct') {
      const specialValue = special(type.name, value);
      if (specialValue !== undefined) return specialValue;
      return finish(type.name, value, walk(definition.value, prepare(type.name, value), bound));
    }
    return walk(definition.value, value, bound);
  }
  return normalize;
}
