import { deflateRawSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDeflateXML } from '../src/danmaku/xml.js';
import { APIError, CoreClient, ParameterError } from '../src/client/index.js';
import { LoginFlows } from '../src/login/flows.js';

const compressed = (xml: string) => deflateRawSync(Buffer.from(xml));
const comment = '<d p="1.5,1,25,16777215,1700000000,0,abc,1932011031958944000,2">A &amp; B &#x1F642; &lt;tag&gt;</d>';

describe('raw-deflate danmaku XML', () => {
  it('decodes escaped text and all comment metadata without rounding large IDs', () => {
    const xml = parseDeflateXML(compressed(`<?xml version="1.0" encoding="UTF-8"?><i><chatserver>chat.bilibili.com</chatserver><chatid>16546</chatid><mission>0</mission><maxlimit>3000</maxlimit><state>0</state><real_name>0</real_name><source>k-v</source><!-- server comment -->${comment}</i>`));
    expect(xml).toMatchObject({ chatServer: 'chat.bilibili.com', chatID: '16546', maxLimit: 3000, source: 'k-v' });
    expect(xml.comments).toHaveLength(1);
    expect(xml.comments[0]).toEqual({
      parameters: '1.5,1,25,16777215,1700000000,0,abc,1932011031958944000,2',
      content: 'A & B 🙂 <tag>',
      meta: { time: 1.5, mode: 1, fontSize: 25, color: 16777215, sentAt: 1700000000, pool: 0, userHash: 'abc', id: 1932011031958944000n, blockLevel: 2 },
    });
  });

  it('preserves CDATA and accepts XML comments and empty documents', () => {
    const xml = parseDeflateXML(compressed('<i><!-- comment --><d p="0,1,25,0,0,0,u,1,0"><![CDATA[<raw>&text]]> &quot;ok&quot;</d></i>'));
    expect(xml.comments[0]?.content).toBe('<raw>&text "ok"');
    expect(parseDeflateXML(compressed('<i/>')).comments).toEqual([]);
    expect(parseDeflateXML(compressed('<i><mission/><maxlimit> </maxlimit></i>'))).toMatchObject({ mission: 0, maxLimit: 0 });
  });

  it('bounds the decompressed body', () => {
    expect(() => parseDeflateXML(compressed(`<i><source>${'x'.repeat(1000)}</source></i>`), 100)).toThrow(/decompress|limit/i);
    expect(() => parseDeflateXML(compressed('<i/>'), 0)).toThrow(/maxBytes/i);
  });

  it.each([
    '<!DOCTYPE i [<!ENTITY hidden "value">]><i/>',
    '<i><d></i>',
    '<i/><i/>',
    '<i>&unknown;</i>',
    '<i>&#0;</i>',
    '<i><source a="1" a="2"/></i>',
    '<i><!-- broken -- comment --></i>',
    '<i><source>bad]]>text</source></i>',
    '<i><source a=unquoted/></i>',
    '<i prefix:attribute="value"/>',
    '<i xmlns:xml="wrong"/>',
    '<i xmlns:prefix=""/>',
    '<i xmlns:a="urn:test" xmlns:b="urn:test" a:key="1" b:key="2"/>',
    '<unexpected/>',
  ])('rejects malformed or unsafe XML: %s', (input) => {
    expect(() => parseDeflateXML(compressed(input))).toThrow(/XML/i);
  });

  it.each([
    '0,1,25,0,0,0,u,1',
    '0,1.5,25,0,0,0,u,1,0',
    'NaN,1,25,0,0,0,u,1,0',
    '0,2147483648,25,0,0,0,u,1,0',
    '0,1,25,0,0,0,u,9223372036854775808,0',
  ])('rejects malformed compact metadata: %s', (parameters) => {
    expect(() => parseDeflateXML(compressed(`<i><d p="${parameters}">text</d></i>`))).toThrow(/metadata/i);
  });

  it('rejects invalid compressed data and invalid UTF-8', () => {
    expect(() => parseDeflateXML(Uint8Array.of(0xff))).toThrow(/decompress/i);
    expect(() => parseDeflateXML(deflateRawSync(Uint8Array.of(0xff)))).toThrow(/XML/i);
  });

  it('retains declared root namespaces while matching danmaku fields by local name', () => {
    const xml = parseDeflateXML(compressed(`<dm:i xmlns:dm="urn:danmaku"><dm:chatid>42</dm:chatid>${comment}</dm:i>`));
    expect(xml.xmlName).toEqual({ space: 'urn:danmaku', local: 'i' });
    expect(xml.chatID).toBe('42');
    expect(xml.comments).toHaveLength(1);
  });

  it.each(['list-so', 'comment-xml'])('parses the sanitized upstream %s fixture', (folder) => {
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/contracts/danmaku/xml-read/${folder}/responses/success.json`, import.meta.url), 'utf8'));
    const body = Buffer.from(fixture.body_base64 ?? fixture.bodyBase64 ?? fixture.body?.base64 ?? '', 'base64');
    const xml = parseDeflateXML(body);
    expect(xml.comments).toHaveLength(307);
    expect(xml.comments[0]?.meta).toBeDefined();
  });
});

describe('login protocols', () => {
  it('exposes anonymous navigation data and normalizes guest identity', async () => {
    const core = new CoreClient({ fetch: async (input) => {
      expect(String(input)).toBe('https://api.bilibili.com/x/web-interface/nav');
      return Response.json({ code: -101, message: 'not logged in', data: { isLogin: false, mid: 0, uname: ' ', face: '', wbi_img: { img_url: 'img', sub_url: 'sub' } } });
    } });
    const nav = await new LoginFlows(core).navState();
    expect(nav).toEqual({ isLogin: false, wbi_img: { img_url: 'img', sub_url: 'sub' } });
  });

  it('normalizes missing navigation fields and rejects invalid identity values', async () => {
    const empty = new LoginFlows(new CoreClient({ fetch: async () => Response.json({ code: 0, data: {} }) }));
    expect(await empty.navState()).toEqual({ isLogin: false, wbi_img: { img_url: '', sub_url: '' } });
    const malformed = new LoginFlows(new CoreClient({ fetch: async () => Response.json({ code: 0, data: { isLogin: true, mid: -1, wbi_img: { img_url: '', sub_url: '' } } }) }));
    await expect(malformed.navState()).rejects.toThrow();
  });

  it('polls a trimmed QR key and preserves nonzero inner business state', async () => {
    const core = new CoreClient({ fetch: async (input, init) => {
      expect(String(input)).toBe('https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=key');
      expect(init?.method).toBe('GET');
      return Response.json({ code: 0, message: 'scanned', data: { code: 86090, message: 'confirm on phone' } });
    } });
    const status = await new LoginFlows(core).pollQR({ qrcode_key: ' key ' });
    expect(status.code).toBe(86090);
    expect(status.message).toBe('confirm on phone');
    expect(status.cookies).toBeUndefined();
  });

  it('rejects nonzero outer QR envelopes even when the inner status reports success', async () => {
    const login = new LoginFlows(new CoreClient({ fetch: async () => Response.json({ code: -101, message: 'not logged in', data: { code: 0 } }) }));
    await expect(login.pollQR({ qrcode_key: 'key' })).rejects.toMatchObject({ code: -101 });
  });

  it('absorbs successful QR cookies into the shared client and returns their values', async () => {
    const core = new CoreClient({ fetch: async () => {
      const response = Response.json({ code: 0, data: { code: 0, refresh_token: 'refresh', timestamp: 1700000000000, url: 'https://www.bilibili.com/', message: '' } });
      for (const cookie of ['DedeUserID=42; Path=/', 'SESSDATA=session; Path=/; HttpOnly', 'bili_jct=csrf; Path=/', 'buvid3=buvid; Path=/']) response.headers.append('set-cookie', cookie);
      return response;
    } });
    const status = await new LoginFlows(core).pollQR({ qrcode_key: 'key' });
    expect(status.cookies).toEqual({ DedeUserID: '42', SESSDATA: 'session', bili_jct: 'csrf', buvid3: 'buvid' });
    expect(core.hasLoginCookies()).toBe(true);
    expect(core.csrf()).toBe('csrf');
    expect(core.account()?.sessdata).toBe('session');
  });

  it('generates and polls one QR challenge as a composed flow', async () => {
    const calls: string[] = [];
    const core = new CoreClient({ fetch: async (input) => {
      calls.push(String(input));
      if (calls.length === 1) return Response.json({ code: 0, data: { url: 'https://qr.example/challenge', qrcode_key: 'generated-key' } });
      return Response.json({ code: 0, data: { code: 86101, message: 'waiting' } });
    } });
    const flow = await new LoginFlows(core).qr();
    expect(flow.generate.qrcode_key).toBe('generated-key');
    expect(flow.poll.code).toBe(86101);
    expect(calls).toEqual([
      'https://passport.bilibili.com/x/passport-login/web/qrcode/generate',
      'https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=generated-key',
    ]);
  });

  it('rejects empty QR keys before sending a request', async () => {
    let requests = 0;
    const login = new LoginFlows(new CoreClient({ fetch: async () => { requests++; return Response.json({ code: 0 }); } }));
    await expect(login.pollQR({ qrcode_key: ' \t ' })).rejects.toBeInstanceOf(ParameterError);
    expect(requests).toBe(0);
  });

  it('keeps semantic API errors when a nonzero QR payload is incompatible', async () => {
    const login = new LoginFlows(new CoreClient({ fetch: async () => Response.json({ code: -400, message: 'bad key', data: 'invalid' }) }));
    await expect(login.pollQR({ qrcode_key: 'key' })).rejects.toBeInstanceOf(APIError);
  });

  it('propagates cancellation through composed QR requests', async () => {
    const controller = new AbortController();
    controller.abort();
    let requests = 0;
    const login = new LoginFlows(new CoreClient({ fetch: async () => { requests++; return Response.json({ code: 0 }); } }));
    await expect(login.qr({ signal: controller.signal })).rejects.toThrow();
    expect(requests).toBe(0);
  });
});
