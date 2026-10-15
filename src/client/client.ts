import { type AccountValues, Account, isBilibiliHost, Session } from './account.js';
import { APIError, HTTPError, ParameterError, ResponseTooLargeError, TransportError } from './errors.js';
import { stringifyJSON } from './json.js';
import { decodeEnvelope } from './response.js';
import { signWBIAt, wbiKeysFromURLs, type WBIKeys } from './sign.js';

export type QueryScalar = string | number | bigint | boolean;
export type Query = Record<string, QueryScalar | readonly QueryScalar[] | undefined>;
export interface RequestSpec {
  method?: string;
  query?: Query | URLSearchParams;
  body?: unknown;
  bodyType?: 'json' | 'form';
  headers?: HeadersInit;
  signal?: AbortSignal;
  operation?: string;
  wbi?: boolean;
  responseMode?: 'payload' | 'optional' | 'data' | 'envelope';
}
export interface HTTPResponse { status: number; headers: Headers; body: Uint8Array }
export interface LogEvent {
  level: 'info' | 'error';
  message: string;
  operation: string;
  method?: string;
  url?: string;
  status?: number;
  apiCode?: number;
}
export interface ClientOptions {
  fetch?: typeof fetch;
  cookie?: string;
  account?: AccountValues;
  timeout?: number;
  maxResponseBytes?: number;
  now?: () => Date;
  userAgent?: string;
  referer?: string;
  origin?: string;
  logger?: (event: Readonly<LogEvent>) => void;
}
interface WBIKeyCall { promise: Promise<WBIKeys>; controller: AbortController; waiters: number; settled: boolean }

const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const sensitiveKeys = new Set(['sessdata', 'dedeuserid', 'dedeuserid__ckmd5', 'bili_jct', 'csrf', 'csrf_token', 'w_rid', 'access_key', 'token', 'cookie', 'qrcode_key', 'refresh_token', 'refresh_csrf', 'access_token', 'w_sender_uid', 'w_receiver_id', 'w_dev_id', 'dev_id', 'talker_id']);
export function sanitizeURL(input: string | URL): string {
  const url = new URL(input); url.username = ''; url.password = '';
  for (const key of [...url.searchParams.keys()]) if (sensitiveKeys.has(key.toLowerCase())) url.searchParams.delete(key);
  return url.toString();
}

function scalar(value: QueryScalar): string {
  if (typeof value === 'number' && (!Number.isFinite(value) || Number.isInteger(value) && !Number.isSafeInteger(value))) throw new ParameterError('query', 'integer numbers must be safe; use bigint or a string');
  if (!['string', 'number', 'bigint', 'boolean'].includes(typeof value)) throw new ParameterError('query', 'query values must be strings, numbers, bigints, or booleans');
  return String(value);
}
export function queryValues(query?: Query | URLSearchParams): URLSearchParams {
  if (query instanceof URLSearchParams) return new URLSearchParams(query);
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) result.append(key, scalar(item as QueryScalar));
  }
  return result;
}
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void promise.catch(() => {}); return Promise.reject(signal.reason); }
  return new Promise<T>((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); }, error => { signal.removeEventListener('abort', abort); reject(error); });
  });
}
function headerOption(field: string, value: string): string {
  if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) throw new ParameterError(field, 'header value must be non-empty and cannot contain a newline');
  return value;
}
function positive(field: string, value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new ParameterError(field, 'value must be a positive safe integer');
  return value;
}

/** Isolated, dependency-free Node HTTP client. Construction never performs I/O. */
export class CoreClient {
  #fetch: typeof fetch;
  #timeout: number;
  #limit: number;
  #clock: () => Date;
  #userAgent: string;
  #referer: string;
  #origin: string;
  #logger: ((event: Readonly<LogEvent>) => void) | undefined;
  #session = new Session();
  #keys = new Map<string, WBIKeys>();
  #inFlight = new Map<string, WBIKeyCall>();

  constructor(options: ClientOptions = {}) {
    if (!options || typeof options !== 'object') throw new ParameterError('options', 'options must be an object');
    if (options.cookie !== undefined && options.account !== undefined) throw new ParameterError('credentials', 'cookie and account options are mutually exclusive');
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.#fetch !== 'function') throw new ParameterError('fetch', 'fetch must be a function');
    this.#timeout = positive('timeout', options.timeout ?? 10_000);
    this.#limit = positive('max_response_bytes', options.maxResponseBytes ?? 16 * 1024 * 1024);
    this.#clock = options.now ?? (() => new Date());
    if (typeof this.#clock !== 'function') throw new ParameterError('clock', 'clock must be a function');
    this.#userAgent = headerOption('user_agent', options.userAgent ?? defaultUserAgent);
    this.#referer = headerOption('referer', options.referer ?? 'https://www.bilibili.com/');
    this.#origin = headerOption('origin', options.origin ?? 'https://www.bilibili.com');
    this.#logger = options.logger;
    if (this.#logger !== undefined && typeof this.#logger !== 'function') throw new ParameterError('logger', 'logger must be a function');
    if (options.cookie !== undefined) this.setCookie(options.cookie);
    if (options.account !== undefined) this.setAccount(options.account);
  }
  setCookie(value: string): void { this.#session.setCookie(value); }
  setAccount(value: AccountValues): void { this.#session.setAccount(value); }
  clearAccount(): void { this.#session.clear(); }
  account(): Account | undefined { return this.#session.account(); }
  hasLoginCookies(): boolean { return this.#session.hasLoginCookies(); }
  csrf(): string { return this.#session.csrf(); }
  now(): Date { return this.#clock(); }
  referer(): string { return this.#referer; }
  origin(): string { return this.#origin; }
  /** Merge cookies from a trusted HTTPS Bilibili response only. Custom callers must verify the URL first. */
  mergeCookies(headers: Headers): void { this.#session.merge(headers, this.now()); }
  #log(event: LogEvent): void { this.#logger?.(Object.freeze(event)); }

  async request<T = unknown>(url: string, spec: RequestSpec = {}): Promise<T> {
    const response = await this.do(url, spec);
    const envelope = decodeEnvelope<T>(response.body);
    this.#log({ level: 'info', message: 'Bilibili response decoded', operation: spec.operation ?? 'request', apiCode: envelope.code });
    switch (spec.responseMode ?? 'payload') {
      case 'envelope': return envelope as T;
      case 'data': return envelope.intoData();
      case 'optional': return envelope.intoOptionalPayload() as T;
      default: return envelope.intoPayload();
    }
  }
  async requestRaw(url: string, spec: RequestSpec = {}): Promise<Uint8Array> {
    const response = await this.do(url, spec);
    const text = new TextDecoder().decode(response.body).trimStart();
    if (text.startsWith('{')) {
      try { decodeEnvelope(response.body).ensureSuccess(); }
      catch (error) { if (error instanceof APIError) throw error; }
    }
    return response.body;
  }

  /** Sign single-valued query parameters with this client's hourly key cache. */
  async wbiValues(query: Query | URLSearchParams, signal?: AbortSignal): Promise<URLSearchParams> {
    const controller = signal ?? new AbortController().signal;
    if (controller.aborted) throw new TransportError('sign.wbi.navigation', controller.reason);
    const params = queryValues(query);
    const values: Record<string, string> = {};
    for (const key of params.keys()) {
      const candidates = params.getAll(key);
      if (candidates.length !== 1) throw new ParameterError(key, 'WBI parameters require exactly one value per key');
      Object.defineProperty(values, key, { value: candidates[0]!, enumerable: true, writable: true, configurable: true });
    }
    const now = this.now();
    const bucket = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}T${now.getHours()}`;
    let keys = this.#keys.get(bucket);
    if (!keys) {
      let call = this.#inFlight.get(bucket);
      if (!call) {
        const sharedController = new AbortController();
        const created: WBIKeyCall = { controller: sharedController, waiters: 0, settled: false, promise: Promise.resolve({ image: '', sub: '' }) };
        created.promise = this.#fetchWBIKeys(sharedController.signal).then(value => { this.#keys.set(bucket, value); return value; }).finally(() => {
          created.settled = true;
          if (this.#inFlight.get(bucket) === created) this.#inFlight.delete(bucket);
        });
        call = created;
        this.#inFlight.set(bucket, call);
      }
      call.waiters++;
      try { keys = await abortable(call.promise, controller); }
      catch (error) {
        if (controller.aborted && error === controller.reason) throw new TransportError('sign.wbi.navigation', error);
        throw error;
      } finally {
        call.waiters--;
        if (!call.waiters && !call.settled) {
          if (this.#inFlight.get(bucket) === call) this.#inFlight.delete(bucket);
          call.controller.abort(new DOMException('WBI navigation has no waiting callers', 'AbortError'));
        }
      }
    }
    return new URLSearchParams(signWBIAt(values, keys, Math.floor(now.getTime() / 1000)));
  }
  async #fetchWBIKeys(signal: AbortSignal): Promise<WBIKeys> {
    const value = await this.request<{ wbi_img: { img_url: string; sub_url: string } }>('https://api.bilibili.com/x/web-interface/nav', { signal, operation: 'sign.wbi.navigation', responseMode: 'data' });
    if (!value?.wbi_img || typeof value.wbi_img.img_url !== 'string' || typeof value.wbi_img.sub_url !== 'string') throw new ParameterError('wbi_keys', 'navigation response is missing resource URLs');
    return wbiKeysFromURLs(value.wbi_img.img_url, value.wbi_img.sub_url);
  }

  async do(endpoint: string, spec: RequestSpec = {}): Promise<HTTPResponse> {
    let url: URL;
    try { url = new URL(endpoint); } catch { throw new ParameterError('endpoint', 'endpoint must be an absolute HTTP URL'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new ParameterError('endpoint', 'endpoint must be an HTTP URL without user credentials');
    const operation = spec.operation ?? 'request';
    if (typeof operation !== 'string' || !operation.trim()) throw new ParameterError('operation', 'operation cannot be empty');
    let method = spec.method ?? (spec.body === undefined ? 'GET' : 'POST');
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(method)) throw new ParameterError('method', 'HTTP method is invalid');
    method = method.toUpperCase();
    const headers = new Headers(spec.headers);
    if (!headers.get('user-agent')) headers.set('user-agent', this.#userAgent);
    let body: BodyInit | undefined;
    if (spec.body !== undefined) {
      if (spec.bodyType === 'form') {
        if (!(spec.body instanceof URLSearchParams) && (spec.body === null || typeof spec.body !== 'object')) throw new ParameterError('form_body', 'form body must contain query values');
        body = queryValues(spec.body as Query | URLSearchParams).toString();
        if (!headers.has('content-type')) headers.set('content-type', 'application/x-www-form-urlencoded');
      } else if (spec.bodyType === 'json' || isPlainJSONBody(spec.body)) {
        body = stringifyJSON(spec.body);
        if (!headers.has('content-type')) headers.set('content-type', 'application/json');
      } else body = spec.body as BodyInit;
    }
    if (body !== undefined && (method === 'GET' || method === 'HEAD')) throw new ParameterError('body', 'GET and HEAD requests cannot contain a body');
    for (const [key, value] of queryValues(spec.query)) url.searchParams.append(key, value);
    const requestSession = this.#session.snapshot();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), this.#timeout);
    const signal = spec.signal ? AbortSignal.any([spec.signal, controller.signal]) : controller.signal;
    try {
      if (signal.aborted) throw new TransportError(operation, signal.reason);
      if (spec.wbi) url.search = (await this.wbiValues(url.searchParams, signal)).toString();
      this.#log({ level: 'info', message: 'sending Bilibili request', operation, method, url: sanitizeURL(url) });
      let previous: URL | undefined;
      for (let redirects = 0; ; redirects++) {
        const hopHeaders = new Headers(headers);
        const bilibiliHost = isBilibiliHost(url.hostname);
        const trusted = bilibiliHost && url.protocol === 'https:';
        const crossOrigin = previous !== undefined && previous.origin !== url.origin;
        if (crossOrigin) {
          for (const key of ['authorization', 'proxy-authorization', 'cookie', 'origin', 'referer', 'host']) { headers.delete(key); hopHeaders.delete(key); }
        }
        if (bilibiliHost && !trusted) {
          for (const key of ['authorization', 'proxy-authorization', 'cookie']) { headers.delete(key); hopHeaders.delete(key); }
        }
        if (trusted) {
          if (!hopHeaders.get('referer')) hopHeaders.set('referer', this.#referer);
          if (!hopHeaders.get('origin')) hopHeaders.set('origin', this.#origin);
          const cookie = requestSession.session.header();
          if (cookie) hopHeaders.set('cookie', [hopHeaders.get('cookie'), cookie].filter(Boolean).join('; '));
        }
        let response: Response;
        try {
          const init: RequestInit & { duplex?: 'half' } = { method, headers: hopHeaders, signal, redirect: 'manual' };
          if (body !== undefined) init.body = body;
          if (body instanceof ReadableStream) init.duplex = 'half';
          response = await abortable(this.#fetch(url.toString(), init), signal);
        } catch (error) { throw new TransportError(operation, error); }
        if (trusted) this.#session.absorb(requestSession, response.headers, this.now());
        const location = response.headers.get('location');
        if ([301, 302, 303, 307, 308].includes(response.status) && location !== null) {
          void response.body?.cancel().catch(() => {});
          if (redirects >= 9) throw new TransportError(operation, new Error('too many redirects'));
          let next: URL;
          try { next = new URL(location, url); } catch { throw new TransportError(operation, new Error('invalid redirect URL')); }
          if (!['http:', 'https:'].includes(next.protocol) || next.username || next.password) throw new TransportError(operation, new Error('unsafe redirect URL'));
          const replay = [307, 308].includes(response.status);
          if (replay && body !== undefined && (url.origin !== next.origin || body instanceof ReadableStream)) throw new TransportError(operation, new Error('cannot replay a request body across origins or a consumed stream'));
          if (!replay && method !== 'GET' && method !== 'HEAD') { method = 'GET'; body = undefined; headers.delete('content-type'); headers.delete('content-length'); }
          previous = url; url = next; continue;
        }
        const bytes = await this.#readBody(response, signal);
        if (response.status < 200 || response.status >= 300) throw new HTTPError(response.status);
        this.#log({ level: 'info', message: 'Bilibili request completed', operation, method, status: response.status });
        return { status: response.status, headers: new Headers(response.headers), body: bytes };
      }
    } catch (error) {
      this.#log({ level: 'error', message: 'Bilibili request failed', operation, method, url: sanitizeURL(url), ...(error instanceof HTTPError ? { status: error.statusCode } : {}) });
      throw error;
    } finally { clearTimeout(timer); }
  }
  async #readBody(response: Response, signal: AbortSignal): Promise<Uint8Array> {
    if (!response.body) return new Uint8Array();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await abortable(reader.read(), signal);
        if (done) break;
        total += value.byteLength;
        if (total > this.#limit) throw new ResponseTooLargeError(this.#limit);
        chunks.push(value);
      }
      const body = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      return body;
    } catch (error) {
      void reader.cancel().catch(() => {});
      if (error instanceof ResponseTooLargeError) throw error;
      throw new TransportError('read response body', error);
    } finally { reader.releaseLock(); }
  }
}

function isPlainJSONBody(value: unknown): boolean {
  return value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || Array.isArray(value) || typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
