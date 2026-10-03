import { describe, expect, it } from 'vitest';
import { Client, ParameterError } from '../src/index.js';

const respond = (data: unknown) => new Response(JSON.stringify({ code: 0, data }));

describe('domain request behavior', () => {
  it('uses the selected BVID and retains API response field names', async () => {
    let request: Request | undefined;
    const client = new Client({ fetch: async (input, init) => {
      request = new Request(input, init);
      return respond({ bvid: 'BV1xx411c7mD', title: 'Example', aid: 170001 });
    } });
    const view = await client.video.view({ bvid: 'BV1xx411c7mD' });
    expect(request?.url).toBe('https://api.bilibili.com/x/web-interface/view?bvid=BV1xx411c7mD');
    expect(view.title).toBe('Example');
  });

  it('rejects missing, ambiguous, malformed and unsafe video identifiers before fetching', async () => {
    let calls = 0;
    const client = new Client({ fetch: async () => { calls++; return respond({}); } });
    for (const params of [{}, { aid: 1, bvid: 'BV1xx411c7mD' }, { bvid: 'bad' }, { aid: 9007199254740992 }]) {
      await expect(client.video.view(params as { aid: number })).rejects.toBeInstanceOf(ParameterError);
    }
    expect(calls).toBe(0);
  });

  it('applies activity defaults while preserving explicit zero-valued flags', async () => {
    let query: URLSearchParams | undefined;
    const client = new Client({ fetch: async (input, init) => {
      query = new URL(new Request(input, init).url).searchParams;
      return respond({ list: [] });
    } });
    await client.activity.list({ http: 0 });
    expect(Object.fromEntries(query!)).toEqual({ plat: '1,3', mold: '0', http: '0', pn: '1', ps: '15' });
  });

  it('uses the manga JSON body defaults', async () => {
    let body: unknown;
    const client = new Client({ fetch: async (input, init) => {
      body = await new Request(input, init).json();
      return respond({ coupons: [] });
    } });
    await client.manga.coupons({ pageNum: 2 });
    expect(body).toEqual({ pageNum: 2, pageSize: 20, notExpired: true, tabType: 1, type: 0 });
  });

  it('rejects reversed danmaku ranges and invalid calendar dates', async () => {
    let calls = 0;
    const client = new Client({ fetch: async () => { calls++; return respond({}); } });
    await expect(client.danmaku.webSegment({ type: 1, oid: 1, segment_index: 1, ps: 2, pe: 1 })).rejects.toBeInstanceOf(ParameterError);
    await expect(client.danmaku.historyXMLBytes({ type: 1, oid: 1, date: '2026-02-30' })).rejects.toBeInstanceOf(ParameterError);
    expect(calls).toBe(0);
  });

  it('uses avid for WBI playback by AID', async () => {
    let playback: URL | undefined;
    const client = new Client({ now: () => new Date('2026-10-03T12:00:00Z'), fetch: async (input, init) => {
      const url = new URL(new Request(input, init).url);
      if (url.pathname.endsWith('/nav')) return respond({ wbi_img: {
        img_url: 'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png',
        sub_url: 'https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png',
      } });
      playback = url;
      return respond({ quality: 32 });
    } });
    await client.video.playURL({ aid: 170001, cid: 62131 });
    expect(playback?.searchParams.get('avid')).toBe('170001');
    expect(playback?.searchParams.has('aid')).toBe(false);
    expect(playback?.searchParams.get('w_rid')).toMatch(/^[0-9a-f]{32}$/);
  });
});
