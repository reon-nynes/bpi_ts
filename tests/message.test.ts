import { describe, expect, it } from 'vitest';
import { Client, ErrAuthenticationRequired, ParameterError, ResponseDecodeError, TransportError, requiresLogin, stringifyJSON } from '../src/index.js';
import { sanitizeURL, signWBIAt } from '../src/client/index.js';
import { normalizePayload } from '../src/message/models.js';

const keys = { image: '7cd084941338484aae1ad9425b84077c', sub: '4932caff0ff746eab6f01bf08b70ac45' };
const cookie = 'DedeUserID=1; SESSDATA=test-session; bili_jct=test-csrf; buvid3=test-device';
const now = new Date('2026-10-03T12:00:00Z');
const sessions = { has_more: 0, is_address_list_empty: 0, anti_disturb_cleaning: false, show_level: false };
const history = { has_more: 0, min_seqno: 0, max_seqno: 0 };
const session = { talker_id: 1, session_type: 1, session_ts: 0, top_ts: 0, ack_seqno: 0, ack_ts: 0, max_seqno: 0, unread_count: 0, system_msg_type: 0, is_follow: 0, is_dnd: 0 };
const message = { sender_uid: 1, receiver_id: 2, receiver_type: 1, msg_type: 99, content: '{"unknown":true}', msg_seqno: 1, msg_key: 1, timestamp: 0, msg_status: 0, msg_source: 0, notify_code: '' };

function setup(payload: unknown = { msg_key: 9007199254740993n }) {
  const requests: Request[] = [];
  const logs: unknown[] = [];
  const client = new Client({ cookie, now: () => now, logger: event => logs.push(event), fetch: async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    if (new URL(request.url).pathname === '/x/web-interface/nav') return Response.json({ code: 0, data: { wbi_img: {
      img_url: `https://i0.hdslb.com/bfs/wbi/${keys.image}.png`, sub_url: `https://i0.hdslb.com/bfs/wbi/${keys.sub}.png`,
    } } });
    return new Response(stringifyJSON({ code: 0, data: payload }));
  } });
  return { client, requests, logs };
}

describe('private-message reads', () => {
  it('sends source defaults and retains null session lists', async () => {
    const { client, requests } = setup(sessions);
    expect(await client.message.sessions()).toEqual({ ...sessions, session_list: null });
    expect(Object.fromEntries(new URL(requests[0]!.url).searchParams)).toEqual({ session_type: '4', sort_rule: '2', size: '100', mobi_app: 'web', group_fold: '0', unfollow_fold: '0' });
  });

  it('preserves exact cursors without reordering or imposing a range direction', async () => {
    const { client, requests } = setup(history);
    expect(await client.message.sessionMessages({ talker_id: '18446744073709551615', begin_seqno: 20, end_seqno: 10, size: 1 })).toEqual({ ...history, messages: null });
    expect(Object.fromEntries(new URL(requests[0]!.url).searchParams)).toEqual({ talker_id: '18446744073709551615', session_type: '1', size: '1', mobi_app: 'web', begin_seqno: '20', end_seqno: '10' });
    const page = setup(sessions);
    await page.client.message.sessions({ session_type: 2, begin_ts: 9007199254740993n, end_ts: 1 });
    expect(new URL(page.requests[0]!.url).searchParams.get('begin_ts')).toBe('9007199254740993');
  });

  it.each([{ size: 0 }, { size: 101 }, { session_type: 3 }, { begin_ts: 0 }, { end_ts: 0 }, { begin_ts: '18446744073709551616' }, { sort_rule: 1 }])('rejects invalid session parameters %j before I/O', async params => {
    const { client, requests } = setup(sessions);
    await expect(client.message.sessions(params as never)).rejects.toBeInstanceOf(ParameterError);
    expect(requests).toHaveLength(0);
  });

  it.each([{ talker_id: 0 }, { talker_id: 1, size: 101 }, { talker_id: 1, begin_seqno: 0 }, { talker_id: 1, end_seqno: 0 }, { talker_id: 1, session_type: 2 }])('rejects invalid history parameters %j', async params => {
    const { client, requests } = setup(history);
    await expect(client.message.sessionMessages(params as never)).rejects.toBeInstanceOf(ParameterError);
    expect(requests).toHaveLength(0);
  });

  it('allows null or missing last messages and preserves unknown content', () => {
    expect(normalizePayload('Session', session)).toMatchObject({ last_msg: null });
    expect(normalizePayload('Session', { ...session, last_msg: null })).toMatchObject({ last_msg: null });
    expect(normalizePayload('PrivateMessage', message)).toMatchObject({ ...message, at_uids: null, new_face_version: null });
  });

  it.each([['Sessions', sessions], ['Session', session], ['SessionMessages', history], ['PrivateMessage', message]] as const)('requires every upstream mandatory field in %s', (name, value) => {
    expect(normalizePayload(name, value)).toMatchObject(value);
    for (const key of Object.keys(value)) {
      const missing: Record<string, unknown> = { ...value };
      delete missing[key];
      expect(() => normalizePayload(name, missing), key).toThrow();
      expect(() => normalizePayload(name, { ...value, [key]: null }), key).toThrow();
    }
  });

  it('reports schema drift privately and checks API errors first', async () => {
    const { client } = setup({ messages: 'private-marker' });
    const error: unknown = await client.message.sessionMessages({ talker_id: 1 }).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(ResponseDecodeError);
    expect(String(error)).not.toContain('private-marker');
    expect(new TextDecoder().decode((error as ResponseDecodeError).body())).toContain('private-marker');
    const guest = new Client({ fetch: async () => Response.json({ code: -101, data: { messages: 'private-marker' } }) });
    await expect(guest.message.sessionMessages({ talker_id: 1 })).rejects.toSatisfy(requiresLogin);
  });
});

describe('private-message sending', () => {
  it('signs the query and sends the source form with a shared UUIDv4', async () => {
    const { client, requests, logs } = setup();
    expect(await client.message.send({ receiver_id: '18446744073709551615', text: ' 收到\n<&>\u2028\u2029\\" ' })).toMatchObject({ msg_key: 9007199254740993n });
    expect(requests).toHaveLength(2);
    const request = requests[1]!;
    const url = new URL(request.url);
    const form = new URLSearchParams(await request.text());
    const device = form.get('msg[dev_id]')!;
    expect(device).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(Object.fromEntries(url.searchParams)).toEqual(signWBIAt({ w_sender_uid: '1', w_receiver_id: '18446744073709551615', w_dev_id: device }, keys, now.getTime() / 1000));
    expect(request.method).toBe('POST');
    expect(url.origin + url.pathname).toBe('https://api.vc.bilibili.com/web_im/v1/web_im/send_msg');
    expect(request.headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    expect(Object.fromEntries(form)).toEqual({ 'msg[sender_uid]': '1', 'msg[receiver_id]': '18446744073709551615', 'msg[receiver_type]': '1', 'msg[msg_type]': '1', 'msg[msg_status]': '0', 'msg[dev_id]': device, 'msg[timestamp]': String(now.getTime() / 1000), 'msg[new_face_version]': '1', 'msg[content]': JSON.stringify({ content: ' 收到\n<&>\u2028\u2029\\" ' }), csrf: 'test-csrf', csrf_token: 'test-csrf', mobi_app: 'web', build: '0' });
    expect(JSON.stringify(logs)).not.toContain(device);
    expect(JSON.stringify(logs)).not.toContain('18446744073709551615');
    expect(JSON.stringify(logs)).not.toContain('收到');
  });

  it('sends images with exact dimensions and the selected receiver type', async () => {
    const { client, requests } = setup();
    await client.message.send({ receiver_id: 1, receiver_type: 2, image: { url: 'https://example.com/a?x=1&y=2', height: 9007199254740993n, width: 10, size: 1.5 } });
    const form = new URLSearchParams(await requests[1]!.text());
    expect(form.get('msg[msg_type]')).toBe('2');
    expect(form.get('msg[receiver_type]')).toBe('2');
    expect(form.get('msg[content]')).toBe('{"url":"https://example.com/a?x=1\\u0026y=2","height":9007199254740993,"width":10,"imageType":null,"original":null,"size":1.5}');
  });

  it.each([' \n ', '中'.repeat(663), '"'.repeat(1000), '\ud800', 'a'.repeat(1987)])('rejects invalid or oversized text before I/O', async text => {
    const { client, requests } = setup();
    await expect(client.message.send({ receiver_id: 1, text })).rejects.toBeInstanceOf(ParameterError);
    expect(requests).toHaveLength(0);
  });

  it.each(['a'.repeat(1986), 'x' + '\u2028'.repeat(661)])('accepts the encoded UTF-8 byte boundary', async text => {
    const { client } = setup();
    await expect(client.message.send({ receiver_id: 1, text })).resolves.toMatchObject({ msg_key: 9007199254740993n });
  });

  it.each([{ receiver_id: 0, text: 'x' }, { receiver_id: 1, receiver_type: 3, text: 'x' }, { receiver_id: 1 }, { receiver_id: 1, text: 'x', image: {} }, { receiver_id: Number.MAX_SAFE_INTEGER + 1, text: 'x' }])('rejects invalid send parameters before I/O', async params => {
    const { client, requests } = setup();
    await expect(client.message.send(params as never)).rejects.toBeInstanceOf(ParameterError);
    expect(requests).toHaveLength(0);
  });

  it('requires a complete account and CSRF before signing', async () => {
    let calls = 0;
    for (const auth of [{}, { cookie: 'bili_jct=csrf; SESSDATA=session' }]) {
      const client = new Client({ ...auth, fetch: async () => { calls++; return Response.json({}); } });
      await expect(client.message.send({ receiver_id: 1, text: 'x' })).rejects.toBe(ErrAuthenticationRequired);
    }
    expect(calls).toBe(0);
  });

  it('does not retry uncertain delivery and supports cancellation', async () => {
    const base = setup();
    let posts = 0;
    const client = new Client({ cookie, fetch: async (input, init) => {
      if (new URL(String(input)).pathname === '/x/web-interface/nav') return Response.json({ code: 0, data: { wbi_img: { img_url: `https://example.com/${keys.image}.png`, sub_url: `https://example.com/${keys.sub}.png` } } });
      posts++;
      throw new Error('uncertain delivery');
    } });
    await expect(client.message.send({ receiver_id: 1, text: 'x' })).rejects.toBeInstanceOf(TransportError);
    expect(posts).toBe(1);
    await expect(base.client.message.send({ receiver_id: 1, text: 'x' }, { signal: AbortSignal.abort() })).rejects.toBeInstanceOf(TransportError);
    expect(base.requests).toHaveLength(0);
  });
});

it('removes messaging identifiers from logged URLs case-insensitively', () => {
  const url = new URL(sanitizeURL('https://api.vc.bilibili.com/x?W_SENDER_UID=sender&w_receiver_id=receiver&w_dev_id=device&dev_id=device&talker_id=talker&size=100'));
  expect(Object.fromEntries(url.searchParams)).toEqual({ size: '100' });
});
