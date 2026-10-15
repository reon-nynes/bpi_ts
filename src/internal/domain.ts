import { CoreClient, ParameterError, ResponseDecodeError, APIError, decodeEnvelope, parseJSON, ticketRequestParams, type Query, type RequestSpec } from '../client/index.js';
import { parseDeflateXML } from '../danmaku/xml.js';
import { endpoints } from './catalog.js';
import { isIP } from 'node:net';

export type IntegerInput = number | bigint | `${bigint}`;
export interface CallOptions { signal?: AbortSignal }
export interface FieldSpec {
  name: string; type: 'string' | 'integer' | 'boolean'; required: boolean;
  default?: string | number | boolean; min?: number; max?: number | string;
  format?: 'bvid' | 'date' | 'month' | 'ip'; enum?: readonly (string | number)[];
  booleanEncoding?: 'literal';
  fixed?: boolean; trim?: boolean;
}
export interface EndpointSpec {
  contract: string; domain: string; accessor: string; method: string; goMethod: string;
  paramType?: string; model: string; url: string; httpMethod: string;
  fields: readonly FieldSpec[]; mode: string; wbi: boolean; fixture: string;
  bodyType?: 'json' | 'form'; csrf?: 'optional' | 'required'; csrfBoth?: boolean;
  videoIdentifier?: boolean; aidKey?: string; oneOf?: readonly string[];
  pathID?: string; ticket?: boolean; special?: string; roomHeaders?: string; transform?: string;
  headerOnly?: readonly string[];
  deriveFourK?: boolean;
}

export function integer(field: FieldSpec, value: unknown): number | bigint | string {
  if (typeof value === 'number' && !Number.isSafeInteger(value) ||
    !['number', 'bigint', 'string'].includes(typeof value) ||
    typeof value === 'string' && !/^\d+$/.test(value)) {
    throw new ParameterError(field.name, 'use a safe integer, bigint, or decimal integer string');
  }
  const parsed = BigInt(value as number | bigint | string);
  if (parsed < BigInt(field.min ?? 0) || parsed > BigInt(field.max ?? '18446744073709551615')) {
    throw new ParameterError(field.name, 'integer is outside the supported range');
  }
  return value as number | bigint | string;
}

function validate(field: FieldSpec, value: unknown): string | number | bigint | boolean {
  if (field.type === 'integer') {
    const valid = integer(field, value);
    if(field.enum && !field.enum.some(entry=>BigInt(entry)===BigInt(valid))) throw new ParameterError(field.name,'unsupported value');
    return valid;
  }
  if (field.type === 'boolean') {
    if (![true, false, 0, 1, '0', '1', 'true', 'false'].includes(value as never)) throw new ParameterError(field.name, 'use a boolean or 0/1');
    return value === true || value === 1 || value === '1' || value === 'true';
  }
  if (typeof value !== 'string' || !value.trim() && field.default !== '') throw new ParameterError(field.name, 'value must be a non-blank string');
  if (field.format === 'bvid' && !/^BV[A-Za-z0-9]{10,}$/.test(value)) throw new ParameterError(field.name, 'invalid BVID');
  if (field.format === 'ip' && isIP(value) === 0) throw new ParameterError(field.name, 'invalid IP address');
  if (field.format === 'month' && !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(value)) throw new ParameterError(field.name, 'use YYYY-MM');
  if (field.format === 'date') {
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new ParameterError(field.name, 'use a valid YYYY-MM-DD date');
    }
  }
  if (field.enum && !field.enum.includes(value)) throw new ParameterError(field.name, 'unsupported value');
  return field.trim ? value.trim() : value;
}

function parameters(spec: EndpointSpec, input: object): Query {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ParameterError('params', 'parameters must be an object');
  const raw = input as Record<string, unknown>;
  const allowed = new Set(spec.fields.map((f) => f.name));
  for (const key of Object.keys(raw)) if (!allowed.has(key)) throw new ParameterError(key, 'unsupported parameter');
  const result: Query = {};
  for (const field of spec.fields) {
    const value = raw[field.name] ?? field.default;
    if (value === undefined) { if (field.required) throw new ParameterError(field.name, 'parameter is required'); continue; }
    const validated = validate(field, value);
    if(field.fixed && field.default!==undefined && String(validated)!==String(field.default)) throw new ParameterError(field.name,'field has a fixed protocol value');
    result[field.name] = field.type === 'boolean' && spec.bodyType !== 'json' ? field.booleanEncoding ? String(validated) : validated ? '1' : '0' : validated;
  }
  if (spec.videoIdentifier && Number(result.aid !== undefined) + Number(result.bvid !== undefined) !== 1) throw new ParameterError('video_id', 'exactly one AID or BVID is required');
  if (spec.oneOf && spec.oneOf.filter((k) => result[k] !== undefined).length !== 1) throw new ParameterError(spec.oneOf.join('/'), 'exactly one identifier is required');
  if (spec.aidKey && result.aid !== undefined) { result[spec.aidKey] = result.aid; delete result.aid; }
  if (spec.contract.startsWith('danmaku.') && ((result.ps !== undefined) !== (result.pe !== undefined) || result.ps !== undefined && BigInt(String(result.pe)) < BigInt(String(result.ps)))) throw new ParameterError('pe', 'supply both range boundaries with end at least start');
  for (const [begin, end] of [['beginTime','endTime'],['begin','end']] as const) {
    if (result[begin] !== undefined && result[end] !== undefined && String(result[end]) < String(result[begin])) throw new ParameterError(end!, 'range end must not precede range start');
  }
  if (spec.contract === 'wallet.info' && result.traceId === undefined) result.traceId = result.timestamp;
  if(spec.deriveFourK) {if((BigInt(String(result.fnval??0)) & 128n)!==0n)result.fourk='1';else delete result.fourk;}
  if(spec.contract==='message.single_unread' && String(result.unread_type)==='3' && raw.show_dustbin===undefined)result.show_dustbin='1';
  if (spec.contract === 'video.homepage_recommendations') result.fresh_idx_1h = result.brush = result.fresh_idx;
  return result;
}

/** Shared request execution; endpoint defaults and validation remain domain metadata. */
export class DomainClient {
  constructor(protected readonly core: CoreClient) {}

  protected async invoke<T>(contract: string, params: object, options: CallOptions,
    normalize: (model: string, payload: unknown) => unknown): Promise<T> {
    const spec = endpoints.find((entry) => entry.contract === contract);
    if (!spec) throw new ParameterError('contract', 'unknown endpoint');
    let query = parameters(spec, params);
    let url = spec.url;
    if (spec.pathID) { url = `https://comment.bilibili.com/${String(query[spec.pathID])}.xml`; delete query[spec.pathID]; }
    let csrf = '';
    if (spec.csrf) { try { csrf = this.core.csrf(); } catch (error) { if (spec.csrf === 'required') throw error; } query.csrf = csrf; if (spec.csrfBoth) query.csrf_token = csrf; }
    if (spec.ticket) { try { csrf = this.core.csrf(); } catch { /* optional anonymous ticket */ } query = ticketRequestParams(Math.floor(this.core.now().getTime() / 1000), csrf); }
    const request: RequestSpec = { method: spec.httpMethod, operation: contract, wbi: spec.wbi, ...options };
    if (spec.roomHeaders) request.headers = { referer: `https://live.bilibili.com/${String(query[spec.roomHeaders])}`, origin:'https://live.bilibili.com' };
    for(const key of spec.headerOnly ?? []) delete query[key];
    if (spec.domain === 'misc' && spec.method === 'shortLink') request.headers = { referer:this.core.referer(), origin:this.core.origin() };
    if (spec.bodyType) { request.bodyType = spec.bodyType; request.body = query; } else request.query = query;
    if (spec.mode === 'raw') return await this.core.requestRaw(url, request) as T;
    if (spec.mode === 'xml') return parseDeflateXML(await this.core.requestRaw(url, request)) as T;
    const response = await this.core.do(url, request);
    const envelope = decodeEnvelope<unknown>(response.body);
    let payload: unknown;
    if (spec.mode === 'json') { envelope.ensureSuccess(); payload = parseJSON(new TextDecoder().decode(response.body)); }
    else if (spec.mode === 'data') payload = envelope.intoData();
    else if (spec.mode === 'optional') payload = envelope.intoOptionalPayload();
    else payload = envelope.intoPayload();
    if (payload === undefined) return undefined as T;
    try {
      if (spec.transform === 'captcha') {
        const p = normalize('login.CaptchaPayload',payload) as { token: string; geetest: {gt:string;challenge:string} };
        payload = { token:p.token, gt:p.geetest.gt, challenge:p.geetest.challenge };
      }
      payload = normalize(spec.model, payload);
      if (spec.transform === 'shortLink') {
        const p = payload as { content:string;title:string;link:string };
        const index = p.content.indexOf('https://b23.tv/');
        p.title = (index < 0 ? p.content : p.content.slice(0,index)).trim();
        p.link = index < 0 ? '' : p.content.slice(index).trim();
      }
      return payload as T;
    } catch (error) { if (error instanceof APIError) throw error; throw new ResponseDecodeError(error, response.body); }
  }
}
