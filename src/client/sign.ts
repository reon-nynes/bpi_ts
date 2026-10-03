import { createHash, createHmac } from 'node:crypto';
import { ParameterError } from './errors.js';

export interface WBIKeys { readonly image: string; readonly sub: string }
const mixinTable = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
export function newWBIKeys(image: string, sub: string): WBIKeys {
  if (!image) throw new ParameterError('img_key', 'key cannot be empty');
  if (!sub) throw new ParameterError('sub_key', 'key cannot be empty');
  return { image, sub };
}
export function wbiKeysFromURLs(imageURL: string, subURL: string): WBIKeys {
  const stem = (input: string, field: string): string => {
    let path: string;
    try { path = new URL(input, 'https://bpi.invalid').pathname; } catch { throw new ParameterError(field, 'resource URL is invalid'); }
    let name: string;
    try { name = decodeURIComponent(path.split('/').at(-1) ?? ''); } catch { throw new ParameterError(field, 'resource URL is invalid'); }
    const extension = name.lastIndexOf('.');
    if (extension <= 0) throw new ParameterError(field, 'filename must contain a stem and extension');
    return name.slice(0, extension);
  };
  return newWBIKeys(stem(imageURL, 'img_url'), stem(subURL, 'sub_url'));
}
export function mixinKey(keys: WBIKeys): string {
  newWBIKeys(keys.image, keys.sub);
  const bytes = Buffer.from(keys.image + keys.sub);
  const result = mixinTable.filter(index => index < bytes.length).slice(0, 32).map(index => bytes[index]!);
  if (result.length !== 32) throw new ParameterError('wbi_keys', 'combined keys must produce a 32-byte mixin key');
  return Buffer.from(result).toString();
}
const escape = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
export function encodeWBIQuery(params: Readonly<Record<string, string>>): string {
  return Object.keys(params).sort().map(key => `${escape(key)}=${escape(params[key]!)}`).join('&');
}
function unixTimestamp(timestamp: number | bigint): string {
  if (typeof timestamp === 'number' && (!Number.isSafeInteger(timestamp) || timestamp < 0) || typeof timestamp === 'bigint' && timestamp < 0n) throw new ParameterError('timestamp', 'timestamp must be a non-negative safe integer or bigint');
  return String(timestamp);
}
export function signWBIAt(params: Readonly<Record<string, string>>, keys: WBIKeys, timestamp: number | bigint): Record<string, string> {
  const signed = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value.replace(/[!'()*]/g, '')]));
  signed.wts = unixTimestamp(timestamp);
  signed.w_rid = createHash('md5').update(encodeWBIQuery(signed) + mixinKey(keys)).digest('hex');
  return signed;
}
export function hexSign(key: string, timestamp: number | bigint): string {
  if (!key) throw new ParameterError('key', 'HMAC key cannot be empty');
  return createHmac('sha256', key).update(`ts${unixTimestamp(timestamp)}`).digest('hex');
}
export function ticketHexSign(timestamp: number | bigint): string { return hexSign('XgwSnGZ1p', timestamp); }
export function ticketRequestParams(timestamp: number | bigint, csrf: string): Record<string, string> {
  return { key_id: 'ec02', hexsign: ticketHexSign(timestamp), 'context[ts]': unixTimestamp(timestamp), csrf };
}
