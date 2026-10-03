import { describe, expect, it } from 'vitest';
import { CoreClient, encodeWBIQuery, ErrMissingData, hexSign, mixinKey, ParameterError, signWBIAt, ticketRequestParams, TransportError, wbiKeysFromURLs } from '../src/client/index.js';

const img = 'abcdefghijklmnopqrstuvwxyz123456';
const sub = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ654321';
const navigation = '{"code":-101,"message":"not logged in","data":{"wbi_img":{"img_url":"https://i0.hdslb.com/bfs/wbi/' + img + '.png","sub_url":"https://i0.hdslb.com/bfs/wbi/' + sub + '.png"}}}';

describe('WBI signing', () => {
  it('matches the upstream HMAC ticket signature vector', () => {
    expect(hexSign('XgwSnGZ1p', 1234567890)).toBe('a7da9d971f117aa2b439c4b6cc46c7afbba8ade9f3ca959578af1bcfb37ebd2f');
    expect(ticketRequestParams(1234567890, 'csrf-token')).toEqual({ key_id: 'ec02', hexsign: 'a7da9d971f117aa2b439c4b6cc46c7afbba8ade9f3ca959578af1bcfb37ebd2f', 'context[ts]': '1234567890', csrf: 'csrf-token' });
    expect(() => hexSign('', 1)).toThrow(ParameterError);
  });
  it('matches upstream Rust vectors without mutating values', () => {
    const params = { foo: "value!'()*", bar: 'space value' };
    const keys = wbiKeysFromURLs(`https://i0.hdslb.com/${img}.png`, `https://i0.hdslb.com/${sub}.png`);
    expect(mixinKey(keys)).toBe('OPscVixApSk66dND2LfRBjKt43oHmGJn');
    expect(signWBIAt(params, keys, 1700000000)).toEqual({ foo: 'value', bar: 'space value', wts: '1700000000', w_rid: 'e0bbf3c23838f46f9b7b2785d19dd01e' });
    expect(params.foo).toBe("value!'()*");
    expect(encodeWBIQuery({ 'a!': 'space value+中文' })).toBe('a%21=space%20value%2B%E4%B8%AD%E6%96%87');
    expect(() => wbiKeysFromURLs('https://example.com/no-extension', 'https://example.com/sub.png')).toThrow(ParameterError);
    expect(() => wbiKeysFromURLs('https://example.com/%ZZ.png', 'https://example.com/sub.png')).toThrow(ParameterError);
  });
  it('single-flights navigation, caches hourly per client, and signs merged queries', async () => {
    let now = new Date('2026-08-11T10:30:00Z');
    let navCalls = 0;
    const urls: URL[] = [];
    const fetcher: typeof fetch = async input => {
      const url = new URL(String(input));
      if (url.pathname === '/x/web-interface/nav') { navCalls++; await new Promise(resolve => setTimeout(resolve, 5)); return new Response(navigation); }
      urls.push(url); return new Response('{"code":0,"data":true}');
    };
    const client = new CoreClient({ fetch: fetcher, now: () => now });
    await Promise.all(Array.from({ length: 16 }, () => client.request('https://api.bilibili.com/x?fixed=value', { wbi: true, query: { foo: 'space value' } })));
    expect(navCalls).toBe(1);
    expect(urls[0]!.searchParams.get('fixed')).toBe('value');
    expect(urls[0]!.searchParams.get('w_rid')).toMatch(/^[0-9a-f]{32}$/);
    now = new Date('2026-08-11T11:00:00Z');
    await client.request('https://api.bilibili.com/x', { wbi: true });
    expect(navCalls).toBe(2);
    await new CoreClient({ fetch: fetcher, now: () => now }).request('https://api.bilibili.com/x', { wbi: true });
    expect(navCalls).toBe(3);
    await expect(client.request('https://api.bilibili.com/x?duplicate=base', { wbi: true, query: { duplicate: 'added' } })).rejects.toBeInstanceOf(ParameterError);
  });
  it('lets a waiting caller cancel without aborting the shared navigation call', async () => {
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    let count = 0;
    const client = new CoreClient({ fetch: async input => {
      if (String(input).includes('/nav')) { count++; started(); await blocked; return new Response(navigation); }
      return new Response('{"code":0,"data":true}');
    } });
    const first = client.request('https://api.bilibili.com/x', { wbi: true });
    await ready;
    const abort = new AbortController();
    const second = client.request('https://api.bilibili.com/x', { wbi: true, signal: abort.signal });
    abort.abort(new Error('cancelled waiter'));
    await expect(second).rejects.toBeInstanceOf(TransportError);
    release();
    await expect(first).resolves.toBe(true);
    expect(count).toBe(1);
  });
  it('keeps shared keys available when the first caller cancels', async () => {
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const blocked = new Promise<void>(resolve => { release = resolve; });
    let count = 0;
    const client = new CoreClient({ fetch: async input => {
      if (String(input).includes('/nav')) { count++; started(); await blocked; return new Response(navigation); }
      return new Response('{"code":0,"data":true}');
    } });
    const abort = new AbortController();
    const first = client.request('https://api.bilibili.com/x', { wbi: true, signal: abort.signal });
    await ready;
    const second = client.request('https://api.bilibili.com/x', { wbi: true });
    abort.abort(new Error('first caller cancelled'));
    await expect(first).rejects.toBeInstanceOf(TransportError);
    release();
    await expect(second).resolves.toBe(true);
    expect(count).toBe(1);
  });
  it('aborts an abandoned navigation fetch and allows an immediate fresh retry', async () => {
    let count = 0;
    let navSignal: AbortSignal | undefined;
    const client = new CoreClient({ fetch: async (input, init) => {
      if (String(input).includes('/nav')) {
        count++;
        if (count === 1) { navSignal = init?.signal ?? undefined; return new Promise<Response>(() => {}); }
        return new Response(navigation);
      }
      return new Response('{"code":0,"data":true}');
    } });
    const abort = new AbortController();
    const first = client.request('https://api.bilibili.com/x', { wbi: true, signal: abort.signal });
    abort.abort(new Error('abandoned'));
    await expect(first).rejects.toBeInstanceOf(TransportError);
    expect(navSignal?.aborted).toBe(true);
    await expect(client.request('https://api.bilibili.com/x', { wbi: true })).resolves.toBe(true);
    expect(count).toBe(2);
  });
  it('does not cache failed key fetches', async () => {
    let count = 0;
    const client = new CoreClient({ fetch: async input => {
      if (String(input).includes('/nav')) { count++; return new Response(count === 1 ? '{"code":0}' : navigation); }
      return new Response('{"code":0,"data":true}');
    } });
    await expect(client.request('https://api.bilibili.com/x', { wbi: true })).rejects.toBe(ErrMissingData);
    await expect(client.request('https://api.bilibili.com/x', { wbi: true })).resolves.toBe(true);
    expect(count).toBe(2);
  });
  it('keeps each WBI caller on its captured session while navigation is pending', async () => {
    let release!: () => void;
    let started!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const cookies: Record<string, string> = {};
    let navCalls = 0;
    const client = new CoreClient({ cookie: 'SESSDATA=old-session; bili_jct=old-csrf', fetch: async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/nav')) {
        navCalls++; started(); await blocked;
        return new Response(navigation, { headers: { 'set-cookie': 'SESSDATA=old-navigation-response' } });
      }
      cookies[url.pathname] = new Headers(init?.headers).get('cookie') ?? '';
      return new Response('{"code":0,"data":true}');
    } });
    const first = client.request('https://api.bilibili.com/old', { wbi: true });
    await ready;
    client.setCookie('SESSDATA=new-session; bili_jct=new-csrf');
    const second = client.request('https://api.bilibili.com/new', { wbi: true });
    release(); await Promise.all([first, second]);
    expect(navCalls).toBe(1);
    expect(cookies['/old']).toContain('SESSDATA=old-session');
    expect(cookies['/old']).toContain('bili_jct=old-csrf');
    expect(cookies['/new']).toContain('SESSDATA=new-session');
    expect(cookies['/new']).toContain('bili_jct=new-csrf');
    expect(client.csrf()).toBe('new-csrf');
  });
});
