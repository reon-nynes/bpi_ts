import { inspect } from 'node:util';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { Account, APIError, CoreClient, decodeEnvelope, ErrAuthenticationRequired, ErrMissingData, HTTPError, isPermissionError, isRiskControl, ParameterError, parseJSON, requiresLogin, requiresVIP, ResponseDecodeError, ResponseTooLargeError, stringifyJSON, TransportError } from '../src/client/index.js';

const json = (body: string, headers?: HeadersInit) => new Response(body, { ...(headers === undefined ? {} : { headers }), status: 200 });
const values = { dedeUserID: 'user-secret', sessdata: 'session-secret', biliJct: 'csrf-secret', buvid3: 'device-secret' };

describe('envelope decoding', () => {
  it.each(['1e400', '-1e400', '{"data":{"value":1e400}}'])('rejects nonfinite JSON exponent values %s', body => {
    expect(() => parseJSON(body)).toThrow();
    expect(() => decodeEnvelope(body)).toThrow(ResponseDecodeError);
  });
  it('extracts aliases with exact large integers and preserves numeric strings', () => {
    const envelope = decodeEnvelope<{ aid: bigint; label: string }>('{"errno":0,"msg":"ok","result":{"aid":18446744073709551615,"label":"18446744073709551615"}}');
    expect(envelope.intoPayload()).toEqual({ aid: 18446744073709551615n, label: '18446744073709551615' });
    expect(envelope.message).toBe('ok');
  });
  it('uses data even when null and applies message alias precedence', () => {
    const envelope = decodeEnvelope('{"code":0,"message":null,"msg":"alias","showMsg":"last","data":null,"result":42}');
    expect(envelope.message).toBe('alias');
    expect(envelope.intoOptionalPayload()).toBeUndefined();
    expect(() => envelope.intoPayload()).toThrow(ErrMissingData);
  });
  it('retains useful non-zero data while required payloads throw semantic errors', () => {
    const envelope = decodeEnvelope('{"code":-101,"message":"not logged in","data":{"state":7}}');
    expect(envelope.intoData()).toEqual({ state: 7 });
    expect(() => envelope.intoPayload()).toThrow(APIError);
    expect(() => envelope.ensureSuccess()).toThrow(APIError);
  });
  it.each(['{"code":"0"}', '{"message":42}', '{"status":1}', '[]', '{"data":"response-secret"'])('preserves private bodies on malformed envelopes %s', (body) => {
    if (body === '{"data":"response-secret"') body += '!';
    let error: unknown;
    try { decodeEnvelope(body); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(ResponseDecodeError);
    const decoded = error as ResponseDecodeError;
    expect(new TextDecoder().decode(decoded.body())).toBe(body);
    const copy = decoded.body(); copy[0] = 0;
    expect(new TextDecoder().decode(decoded.body())).toBe(body);
    expect(`${decoded} ${inspect(decoded)} ${JSON.stringify(decoded)}`).not.toContain('response-secret');
  });
  it('classifies semantic errors through causes', () => {
    expect(requiresLogin(new Error('wrapped', { cause: new APIError(800501007) }))).toBe(true);
    expect(requiresLogin(ErrAuthenticationRequired)).toBe(true);
    expect(requiresLogin(new HTTPError(401))).toBe(true);
    expect(requiresVIP(new APIError(-650))).toBe(true);
    expect(isPermissionError(new APIError(100007))).toBe(true);
    expect(isRiskControl(new HTTPError(412))).toBe(true);
    expect(isRiskControl(new APIError(0))).toBe(false);
  });
});

describe('session and requests', () => {
  it('constructs offline, isolates sessions, and redacts account representations', () => {
    let calls = 0;
    const client = new CoreClient({ account: values, fetch: async () => { calls++; return json('{"code":0}'); } });
    expect(calls).toBe(0);
    expect(client.hasLoginCookies()).toBe(true);
    expect(new CoreClient().hasLoginCookies()).toBe(false);
    const account = client.account()!;
    expect(account).toBeInstanceOf(Account);
    expect(account.sessdata).toBe('session-secret');
    account.sessdata = 'changed';
    expect(client.account()!.sessdata).toBe('session-secret');
    for (const value of Object.values(values)) expect(`${account} ${inspect(account)} ${JSON.stringify(account)}`).not.toContain(value);
    client.clearAccount();
    expect(client.account()).toBeUndefined();
    expect(() => client.csrf()).toThrow(ErrAuthenticationRequired);
  });
  it('validates configuration and cookie replacements atomically', () => {
    expect(() => new CoreClient({ cookie: 'a=b', account: values })).toThrow(ParameterError);
    expect(() => new CoreClient({ timeout: 0 })).toThrow(ParameterError);
    expect(() => new CoreClient({ maxResponseBytes: -1 })).toThrow(ParameterError);
    expect(() => new CoreClient({ userAgent: 'a\r\nb' })).toThrow(ParameterError);
    const client = new CoreClient({ cookie: 'SESSDATA=old; bili_jct=csrf; unknown=value' });
    expect(client.account()).toBeUndefined();
    expect(client.csrf()).toBe('csrf');
    expect(() => client.setCookie('bad name=value')).toThrow(ParameterError);
    expect(client.hasLoginCookies()).toBe(true);
    expect(() => client.setAccount({ ...values, buvid3: '' })).toThrow(ParameterError);
    expect(client.csrf()).toBe('csrf');
  });
  it('applies trusted headers, merges query arrays, and preserves callers', async () => {
    const received: Array<{ url: URL; headers: Headers }> = [];
    const headers = new Headers({ 'x-custom': 'caller' });
    const query = { aid: 18446744073709551615n, tag: ['one', 'two'], empty: undefined };
    const client = new CoreClient({ cookie: 'SESSDATA=session; unknown=value', fetch: async (input, init) => {
      received.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
      return json('{"code":0,"data":{"ok":true}}');
    } });
    expect(await client.request('https://API.BILIBILI.COM./x?tag=base', { query, headers })).toEqual({ ok: true });
    await client.do('https://bilibili.com.example.org/x');
    expect(received[0]!.url.searchParams.getAll('tag')).toEqual(['base', 'one', 'two']);
    expect(received[0]!.url.searchParams.get('aid')).toBe('18446744073709551615');
    expect(received[0]!.headers.get('cookie')).toContain('unknown=value');
    expect(received[0]!.headers.get('origin')).toBe('https://www.bilibili.com');
    expect(received[1]!.headers.get('cookie')).toBeNull();
    expect(received[1]!.headers.get('referer')).toBeNull();
    expect(headers.has('cookie')).toBe(false);
    expect(query.tag).toEqual(['one', 'two']);
    await expect(client.do('https://api.bilibili.com', { query: { aid: Number.MAX_SAFE_INTEGER + 1 } })).rejects.toBeInstanceOf(ParameterError);
  });
  it('encodes form and JSON bodies including bigint identifiers', async () => {
    const bodies: Array<{ body: unknown; type: string | null; method: string | undefined }> = [];
    const client = new CoreClient({ fetch: async (_url, init) => {
      bodies.push({ body: init?.body, type: new Headers(init?.headers).get('content-type'), method: init?.method });
      return json('{"code":0}');
    } });
    await client.request('https://api.bilibili.com', { body: { keyword: 'space value', ids: [1n, 2n] }, bodyType: 'form', responseMode: 'optional' });
    await client.do('https://api.bilibili.com', { body: { aid: 18446744073709551615n }, bodyType: 'json' });
    expect(bodies[0]).toEqual({ body: 'keyword=space+value&ids=1&ids=2', type: 'application/x-www-form-urlencoded', method: 'POST' });
    expect(bodies[1]).toEqual({ body: '{"aid":18446744073709551615}', type: 'application/json', method: 'POST' });
  });
  it('serializes sparse array holes and undefined elements as null, including nested bigint arrays', async () => {
    const sparse: unknown[] = [];
    sparse.length = 4; sparse[1] = 1n; sparse[2] = undefined; sparse[3] = [, 2n];
    expect(stringifyJSON(sparse)).toBe('[null,1,null,[null,2]]');
    let body: unknown;
    const client = new CoreClient({ fetch: async (_input, init) => { body = init?.body; return json('{"code":0}'); } });
    await client.do('https://api.bilibili.com/x', { bodyType: 'json', body: sparse });
    expect(body).toBe('[null,1,null,[null,2]]');
  });
  it('absorbs trusted cookies and deletes expired values but ignores external responses', async () => {
    let count = 0;
    const client = new CoreClient({ account: values, now: () => new Date('2026-08-11T12:00:00Z'), fetch: async () => {
      count++;
      const headers = new Headers();
      headers.append('set-cookie', count === 1 ? 'SESSDATA=external' : 'SESSDATA=refreshed; Path=/');
      headers.append('set-cookie', 'bili_jct=new-csrf');
      return json('{"code":0}', headers);
    } });
    await client.do('https://example.com');
    expect(client.account()!.sessdata).toBe('session-secret');
    await client.do('https://api.bilibili.com');
    expect(client.account()!.sessdata).toBe('refreshed');
    expect(client.csrf()).toBe('new-csrf');
    client.mergeCookies(new Headers({ 'set-cookie': 'SESSDATA=stale; Expires=Tue, 11 Aug 2026 12:00:00 GMT' }));
    expect(client.hasLoginCookies()).toBe(false);
    expect(client.account()).toBeUndefined();
  });
  it('keeps Bilibili credentials and response cookie updates restricted to HTTPS', async () => {
    let received!: Headers;
    const client = new CoreClient({ account: values, fetch: async (_input, init) => {
      received = new Headers(init?.headers);
      return json('{"code":0}', { 'set-cookie': 'SESSDATA=insecure-session' });
    } });
    await client.do('http://api.bilibili.com/x', { headers: { authorization: 'Bearer secret', cookie: 'caller=secret' } });
    expect(received.get('cookie')).toBeNull();
    expect(received.get('authorization')).toBeNull();
    expect(client.account()!.sessdata).toBe('session-secret');
  });
  it.each(['replace', 'clear'] as const)('keeps an in-flight redirect on its captured session after %s', async change => {
    let release!: () => void;
    let started!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const cookies: string[] = [];
    const client = new CoreClient({ account: values, fetch: async (_input, init) => {
      cookies.push(new Headers(init?.headers).get('cookie') ?? '');
      if (cookies.length === 1) {
        started(); await blocked;
        return new Response(null, { status: 302, headers: { location: '/next', 'set-cookie': 'SESSDATA=old-rotated' } });
      }
      return json('{"code":0}', { 'set-cookie': 'bili_jct=old-rotated-csrf' });
    } });
    const pending = client.do('https://api.bilibili.com/start');
    await ready;
    if (change === 'replace') client.setCookie('SESSDATA=new-session; bili_jct=new-csrf; DedeUserID=new-user; buvid3=new-device');
    else client.clearAccount();
    release(); await pending;
    expect(cookies[0]).toContain('SESSDATA=session-secret');
    expect(cookies[1]).toContain('SESSDATA=old-rotated');
    expect(cookies[1]).toContain('bili_jct=csrf-secret');
    expect(cookies[1]).not.toContain('new-csrf');
    if (change === 'replace') {
      expect(client.account()!.sessdata).toBe('new-session');
      expect(client.csrf()).toBe('new-csrf');
    } else {
      expect(client.hasLoginCookies()).toBe(false);
      expect(client.account()).toBeUndefined();
      expect(() => client.csrf()).toThrow(ErrAuthenticationRequired);
    }
  });
  it('does not overwrite a replaced account with an old final response', async () => {
    let release!: () => void;
    let started!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const client = new CoreClient({ account: values, fetch: async () => { started(); await blocked; return json('{"code":0}', { 'set-cookie': 'SESSDATA=old-response' }); } });
    const pending = client.do('https://api.bilibili.com/x');
    await ready; client.setAccount({ ...values, sessdata: 'new-account' });
    release(); await pending;
    expect(client.account()!.sessdata).toBe('new-account');
  });
  it('uses its own redirect cookie rotations and commits them when the session is unchanged', async () => {
    const cookies: string[] = [];
    const client = new CoreClient({ account: values, fetch: async (_input, init) => {
      cookies.push(new Headers(init?.headers).get('cookie') ?? '');
      if (cookies.length === 1) return new Response(null, { status: 302, headers: { location: '/next', 'set-cookie': 'SESSDATA=rotated-session' } });
      return json('{"code":0}', { 'set-cookie': 'bili_jct=rotated-csrf' });
    } });
    await client.do('https://api.bilibili.com/start');
    expect(cookies[1]).toContain('SESSDATA=rotated-session');
    expect(client.account()!.sessdata).toBe('rotated-session');
    expect(client.csrf()).toBe('rotated-csrf');
  });
  it('does not let an older concurrent response overwrite a newer cookie revision', async () => {
    let release!: () => void;
    let started!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const client = new CoreClient({ account: values, fetch: async input => {
      if (String(input).endsWith('/slow')) { started(); await blocked; return json('{"code":0}', { 'set-cookie': 'SESSDATA=stale-response' }); }
      return json('{"code":0}', { 'set-cookie': 'SESSDATA=newer-response' });
    } });
    const slow = client.do('https://api.bilibili.com/slow');
    await ready; await client.do('https://api.bilibili.com/fast');
    release(); await slow;
    expect(client.account()!.sessdata).toBe('newer-response');
  });
  it('strips credentials and Bilibili defaults on external redirects', async () => {
    const requests: Array<{ url: string; headers: Headers; method: string | undefined; body: unknown }> = [];
    const client = new CoreClient({ cookie: 'SESSDATA=session-secret', fetch: async (input, init) => {
      requests.push({ url: String(input), headers: new Headers(init?.headers), method: init?.method, body: init?.body });
      return requests.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://example.com/target' } }) : json('{"code":0}');
    } });
    await client.do('https://api.bilibili.com/start', { body: { csrf: 'secret' }, bodyType: 'form', headers: { authorization: 'Bearer secret' } });
    expect(requests[1]!.headers.get('cookie')).toBeNull();
    expect(requests[1]!.headers.get('authorization')).toBeNull();
    expect(requests[1]!.headers.get('origin')).toBeNull();
    expect(requests[1]!.headers.get('referer')).toBeNull();
    expect(requests[1]!.method).toBe('GET');
    expect(requests[1]!.body).toBeUndefined();
  });
  it('blocks external replay of credential-bearing bodies on 307 redirects', async () => {
    let count = 0;
    const client = new CoreClient({ cookie: 'SESSDATA=secret', fetch: async () => { count++; return new Response(null, { status: 307, headers: { location: 'https://example.com' } }); } });
    await expect(client.do('https://api.bilibili.com/start', { body: { csrf: 'secret' }, bodyType: 'form' })).rejects.toBeInstanceOf(TransportError);
    expect(count).toBe(1);
  });
  it('exposes HTTP statuses and enforces streaming response limits', async () => {
    const limit = new CoreClient({ maxResponseBytes: 4, fetch: async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); controller.enqueue(new Uint8Array([4, 5])); controller.close(); } })) });
    await expect(limit.do('https://example.com')).rejects.toMatchObject({ limit: 4 });
    await expect(limit.do('https://example.com')).rejects.toBeInstanceOf(ResponseTooLargeError);
    const http = new CoreClient({ fetch: async () => new Response('error-secret', { status: 403 }) });
    await expect(http.do('https://example.com')).rejects.toMatchObject({ statusCode: 403 });
  });
  it('cancels transport and pending body reads with the original reason as cause', async () => {
    const abort = new AbortController();
    const reason = new Error('cancelled');
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const client = new CoreClient({ fetch: async () => new Response(new ReadableStream({ start() { started(); } })) });
    const response = client.do('https://example.com', { signal: abort.signal });
    await ready; abort.abort(reason);
    await expect(response).rejects.toMatchObject({ cause: reason });
    const pre = new AbortController(); pre.abort(reason);
    await expect(client.do('https://example.com', { signal: pre.signal })).rejects.toMatchObject({ cause: reason });
  });
  it('times out even if injected fetch ignores its signal', async () => {
    const client = new CoreClient({ timeout: 10, fetch: async () => new Promise<Response>(() => {}) });
    await expect(client.do('https://example.com')).rejects.toBeInstanceOf(TransportError);
  });
  it('redacts response bodies, request secrets and transport causes in logs', async () => {
    const events: unknown[] = [];
    const client = new CoreClient({ logger: event => events.push(event), fetch: async () => { throw new Error('transport-secret'); } });
    let error: unknown;
    try { await client.do('https://api.bilibili.com/x?mid=42&SESSDATA=session-secret&csrf=csrf-secret&w_rid=signature-secret&qrcode_key=qr-secret&refresh_token=refresh-secret&access_token=access-secret'); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(TransportError);
    const output = `${inspect(error)} ${JSON.stringify(error)} ${JSON.stringify(events)}`;
    for (const secret of ['session-secret', 'csrf-secret', 'signature-secret', 'transport-secret', 'qr-secret', 'refresh-secret', 'access-secret']) expect(output).not.toContain(secret);
    expect(output).toContain('mid=42');
  });
  it('returns raw binary but rejects JSON API errors before returning bytes', async () => {
    const client = new CoreClient({ fetch: async input => String(input).includes('binary') ? new Response(new Uint8Array([0, 255, 1])) : json('{"code":-352,"message":"risk control"}') });
    expect(await client.requestRaw('https://example.com/binary')).toEqual(new Uint8Array([0, 255, 1]));
    await expect(client.requestRaw('https://example.com/json')).rejects.toBeInstanceOf(APIError);
  });
  it('works with native fetch for local redirects, form encoding, and lossless responses', async () => {
    let received = '';
    const server = createServer(async (request, response) => {
      if (request.url === '/redirect') {
        response.writeHead(307, { location: '/echo' }); response.end(); return;
      }
      for await (const chunk of request) received += String(chunk);
      response.setHeader('content-type', 'application/json');
      response.end('{"code":0,"data":{"aid":18446744073709551615}}');
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/redirect`;
      const client = new CoreClient();
      expect(await client.request(endpoint, { bodyType: 'form', body: { keyword: 'space value' } })).toEqual({ aid: 18446744073709551615n });
      expect(received).toBe('keyword=space+value');
    } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
});
