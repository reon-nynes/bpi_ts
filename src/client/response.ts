import { APIError, ErrMissingData, ResponseDecodeError } from './errors.js';
import { parseJSON } from './json.js';

/** Common Bilibili wrapper. `data` is undefined for a missing or null payload. */
export class Envelope<T> {
  constructor(public readonly code: number, public readonly data: T | undefined, public readonly message = '', public readonly status = false) {}
  ensureSuccess(): void { if (this.code !== 0) throw new APIError(this.code, this.message); }
  intoPayload(): T { this.ensureSuccess(); return this.intoData(); }
  intoOptionalPayload(): T | undefined { this.ensureSuccess(); return this.data; }
  intoData(): T { if (this.data === undefined) throw ErrMissingData; return this.data; }
}

export function decodeEnvelope<T = unknown>(body: Uint8Array | string): Envelope<T> {
  try {
    const value = parseJSON(typeof body === 'string' ? body : new TextDecoder('utf-8', { fatal: true }).decode(body));
    if (value === null) return new Envelope<T>(0, undefined);
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error('expected an object');
    for (const field of ['code', 'errno']) if (value[field] !== undefined && value[field] !== null && (typeof value[field] !== 'number' || !Number.isSafeInteger(value[field]))) throw new Error('invalid response code');
    for (const field of ['message', 'msg', 'showMsg']) if (value[field] !== undefined && value[field] !== null && typeof value[field] !== 'string') throw new Error('invalid response message');
    if (value.status !== undefined && value.status !== null && typeof value.status !== 'boolean') throw new Error('invalid response status');
    const payload = Object.hasOwn(value, 'data') ? value.data : value.result;
    return new Envelope<T>((value.code ?? value.errno ?? 0) as number, payload == null ? undefined : payload as T, (value.message ?? value.msg ?? value.showMsg ?? '') as string, (value.status ?? false) as boolean);
  } catch (error) { throw new ResponseDecodeError(error, body); }
}
