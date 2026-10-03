import { inspect } from 'node:util';
import { ErrAuthenticationRequired, ParameterError } from './errors.js';

export interface AccountValues { dedeUserID: string; sessdata: string; biliJct: string; buvid3: string }

/** Complete account projection, redacted in strings, logs, and JSON output. */
export class Account implements AccountValues {
  dedeUserID: string;
  sessdata: string;
  biliJct: string;
  buvid3: string;
  constructor(values: AccountValues) { this.dedeUserID = values.dedeUserID; this.sessdata = values.sessdata; this.biliJct = values.biliJct; this.buvid3 = values.buvid3; }
  validate(): void {
    if ([this.dedeUserID, this.sessdata, this.biliJct, this.buvid3].some(value => typeof value !== 'string' || value === '')) throw new ParameterError('account', 'account requires dedeUserID, sessdata, biliJct, and buvid3');
  }
  csrf(): string { if (!this.biliJct) throw ErrAuthenticationRequired; return this.biliJct; }
  toJSON(): Record<string, string> { return Object.fromEntries(['dedeUserID', 'sessdata', 'biliJct', 'buvid3'].map(key => [key, this[key as keyof AccountValues] ? '<redacted>' : '<empty>'])); }
  toString(): string { return `Account ${JSON.stringify(this.toJSON())}`; }
  [inspect.custom](): string { return this.toString(); }
}

export function isBilibiliHost(host: string): boolean {
  const normalized = host.toLowerCase().replace(/\.$/, '');
  return normalized === 'bilibili.com' || normalized.endsWith('.bilibili.com');
}

function validateCookie(name: string, value: string): void {
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name) || /[^\x20-\x7E]|[";,\\]/.test(value)) throw new ParameterError('cookie', 'cookie name or value is invalid');
}

export function parseCookieHeader(header: string): Map<string, string> {
  if (typeof header !== 'string') throw new ParameterError('cookie', 'cookie must be a string');
  const cookies = new Map<string, string>();
  for (const segment of header.split(';')) {
    const trimmed = segment.trim(); if (!trimmed) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) throw new ParameterError('cookie', "each cookie segment must contain a non-empty name and '='");
    const name = trimmed.slice(0, separator).trim(); const value = trimmed.slice(separator + 1).trim();
    validateCookie(name, value); cookies.set(name, value);
  }
  if (!cookies.size) throw new ParameterError('cookie', 'cookie cannot be empty');
  return cookies;
}

export interface SessionSnapshot { readonly session: Session; revision: number; canCommit: boolean }

export class Session {
  #cookies = new Map<string, string>();
  #revision = 0;
  setCookie(value: string): void { this.#cookies = parseCookieHeader(value); this.#revision++; }
  setAccount(values: AccountValues): void {
    const account = new Account(values); account.validate();
    const cookies = new Map([['DedeUserID', account.dedeUserID], ['SESSDATA', account.sessdata], ['bili_jct', account.biliJct], ['buvid3', account.buvid3]]);
    for (const [name, value] of cookies) validateCookie(name, value);
    this.#cookies = cookies; this.#revision++;
  }
  clear(): void { this.#cookies.clear(); this.#revision++; }
  snapshot(): SessionSnapshot {
    const session = new Session(); session.#cookies = new Map(this.#cookies);
    return { session, revision: this.#revision, canCommit: true };
  }
  absorb(snapshot: SessionSnapshot, headers: Headers, now: Date): void {
    // Redirects continue with their own cookie rotations even when their global
    // session has been replaced. A detached request can never regain commit rights.
    if (snapshot.revision !== this.#revision) snapshot.canCommit = false;
    const changed = snapshot.session.merge(headers, now);
    if (snapshot.canCommit && changed) {
      this.#cookies = new Map(snapshot.session.#cookies);
      snapshot.revision = ++this.#revision;
    }
  }
  hasLoginCookies(): boolean { return Boolean(this.#cookies.get('SESSDATA')); }
  csrf(): string { const value = this.#cookies.get('bili_jct'); if (!value) throw ErrAuthenticationRequired; return value; }
  account(): Account | undefined {
    const account = new Account({ dedeUserID: this.#cookies.get('DedeUserID') ?? '', sessdata: this.#cookies.get('SESSDATA') ?? '', biliJct: this.#cookies.get('bili_jct') ?? '', buvid3: this.#cookies.get('buvid3') ?? '' });
    try { account.validate(); return account; } catch { return undefined; }
  }
  header(): string { return [...this.#cookies].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, value]) => `${name}=${value}`).join('; '); }
  merge(headers: Headers, now: Date): boolean {
    let changed = false;
    for (const header of headers.getSetCookie()) {
      const [pair, ...attributes] = header.split(';');
      if (!pair) continue;
      let cookies: Map<string, string>;
      try { cookies = parseCookieHeader(pair); } catch { continue; }
      const [name, value] = [...cookies][0]!;
      let expired = false;
      for (const attribute of attributes) {
        const separator = attribute.indexOf('=');
        const field = (separator === -1 ? attribute : attribute.slice(0, separator)).trim().toLowerCase();
        const item = separator === -1 ? '' : attribute.slice(separator + 1).trim();
        if (field === 'max-age' && /^-?\d+$/.test(item) && Number(item) <= 0) expired = true;
        if (field === 'expires') { const expires = Date.parse(item); if (!Number.isNaN(expires) && expires <= now.getTime()) expired = true; }
      }
      if (expired) changed = this.#cookies.delete(name) || changed;
      else {
        if (this.#cookies.get(name) !== value) changed = true;
        this.#cookies.set(name, value);
      }
    }
    if (changed) this.#revision++;
    return changed;
  }
}
