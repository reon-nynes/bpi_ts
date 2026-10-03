import { CoreClient, ParameterError, ResponseDecodeError, decodeEnvelope } from '../client/index.js';
import { parseMID } from '../ids/index.js';
import type { Nav, QRFlow, QRGenerate, QRStatus } from './models.js';

export interface LoginCallOptions { signal?: AbortSignal }
export interface QRPollInput { qrcode_key: string }

const NAV_URL = 'https://api.bilibili.com/x/web-interface/nav';
const GENERATE_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate';
const POLL_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll';

/** Normalize the zero/blank guest identity fields handled by Go's Nav decoder. */
export function normalizeNav(nav: Nav): Nav {
  if (nav === null || typeof nav !== 'object' || Array.isArray(nav)) throw new TypeError('invalid navigation payload');
  if (nav.isLogin != null && typeof nav.isLogin !== 'boolean') throw new TypeError('invalid navigation login flag');
  if (nav.wbi_img != null && (typeof nav.wbi_img !== 'object' || Array.isArray(nav.wbi_img))) throw new TypeError('invalid navigation WBI image');
  const normalized: Nav = {
    isLogin: nav.isLogin ?? false,
    wbi_img: { img_url: navString(nav.wbi_img?.img_url), sub_url: navString(nav.wbi_img?.sub_url) },
  };
  if (nav.mid != null && nav.mid !== 0 && nav.mid !== 0n) {
    if (typeof nav.mid !== 'number' && typeof nav.mid !== 'bigint') throw new TypeError('invalid navigation member ID');
    normalized.mid = parseMID(nav.mid);
  }
  const uname = navString(nav.uname);
  const face = navString(nav.face);
  if (uname.trim() !== '') normalized.uname = uname;
  if (face.trim() !== '') normalized.face = face;
  return normalized;
}

function navString(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string') throw new TypeError('invalid navigation text field');
  return value;
}

/** Session protocols composed on the same isolated core as the ordinary login endpoints. */
export class LoginFlows {
  constructor(protected readonly core: CoreClient) {}

  /** Navigation state including useful guest data carried by a nonzero API envelope. */
  async navState(options: LoginCallOptions = {}): Promise<Nav> {
    const nav = await this.core.request<Nav>(NAV_URL, {
      method: 'GET', operation: 'login.nav', responseMode: 'data', ...options,
    });
    return normalizeNav(nav);
  }

  /** Poll once. Waiting/scanned/expired business states are returned to the caller. */
  async pollQR(params: QRPollInput, options: LoginCallOptions = {}): Promise<QRStatus> {
    if (typeof params?.qrcode_key !== 'string' || params.qrcode_key.trim() === '') {
      throw new ParameterError('qrcode_key', 'value cannot be blank');
    }
    const response = await this.core.do(POLL_URL, {
      method: 'GET', query: { qrcode_key: params.qrcode_key.trim() },
      operation: 'login.qr_poll', ...options,
    });
    const envelope = decodeEnvelope<unknown>(response.body);
    envelope.ensureSuccess();
    const payload = envelope.data;
    if (!isQRStatus(payload)) {
      if (payload === undefined) envelope.intoPayload();
      throw new ResponseDecodeError(new Error('invalid QR status payload'), response.body);
    }
    const status: QRStatus = {
      url: typeof payload.url === 'string' ? payload.url : '',
      refresh_token: typeof payload.refresh_token === 'string' ? payload.refresh_token : '',
      timestamp: payload.timestamp ?? 0,
      code: payload.code,
      message: typeof payload.message === 'string' ? payload.message : '',
    };
    if (status.code === 0) {
      const cookies = responseCookies(response.headers);
      if (Object.keys(cookies).length !== 0) status.cookies = cookies;
    }
    return status;
  }

  /** Generate a challenge and perform its first poll; subsequent polling is explicit. */
  async qr(options: LoginCallOptions = {}): Promise<QRFlow> {
    const generate = await this.core.request<QRGenerate>(GENERATE_URL, {
      method: 'GET', operation: 'login.qr_generate', responseMode: 'payload', ...options,
    });
    const poll = await this.pollQR({ qrcode_key: generate.qrcode_key }, options);
    return { generate, poll };
  }

  /** Camel-case spelling of the upstream QRFlow operation. */
  qrFlow(options: LoginCallOptions = {}): Promise<QRFlow> { return this.qr(options); }
}

function isQRStatus(value: unknown): value is {
  code: number; url?: string; refresh_token?: string; timestamp?: number | bigint; message?: string;
} {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.code !== 'number' || !Number.isInteger(record.code) || record.code < -2147483648 || record.code > 2147483647) return false;
  for (const key of ['url', 'refresh_token', 'message']) {
    if (record[key] !== undefined && record[key] !== null && typeof record[key] !== 'string') return false;
  }
  const time = record.timestamp;
  if (time !== undefined && time !== null && !(
    typeof time === 'number' && Number.isSafeInteger(time) && time >= 0 ||
    typeof time === 'bigint' && time >= 0n && time <= 18446744073709551615n
  )) return false;
  return true;
}

function responseCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const header of headers.getSetCookie()) {
    const pair = header.split(';', 1)[0]!;
    const separator = pair.indexOf('=');
    if (separator < 1) continue;
    const name = pair.slice(0, separator).trim();
    if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)) continue;
    let value = pair.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (/[^\x20-\x7e]|[";,\\]/.test(value)) continue;
    cookies[name] = value;
  }
  return cookies;
}
