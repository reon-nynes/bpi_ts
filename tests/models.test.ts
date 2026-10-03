import { describe, expect, it } from 'vitest';
import { normalizePayload as article } from '../src/article/models.js';
import { normalizePayload as bangumi } from '../src/bangumi/models.js';
import { normalizePayload as cheese } from '../src/cheese/models.js';
import { normalizePayload as creativecenter } from '../src/creativecenter/models.js';
import { normalizePayload as danmaku } from '../src/danmaku/models.js';
import { normalizePayload as dynamic } from '../src/dynamic/models.js';
import { normalizePayload as live } from '../src/live/models.js';
import { normalizePayload as login } from '../src/login/models.js';
import { normalizePayload as search } from '../src/search/models.js';
import { normalizePayload as user } from '../src/user/models.js';
import { normalizePayload as video } from '../src/video/models.js';
import { normalizePayload as webwidget } from '../src/webwidget/models.js';

describe('upstream response model decoding', () => {
  it('accepts numeric or quoted member IDs on the flexible user fields', () => {
    expect(user('CardSummary', { mid: '18446744073709551615' })).toMatchObject({ mid: 18446744073709551615n });
    expect(user('NameToUIDItem', { uid: '170001', name: 'test' })).toMatchObject({ uid: 170001, name: 'test' });
    expect(() => user('NameToUIDItem', { uid: 0 })).toThrow();
    expect(() => user('SpaceProfile', { mid: '170001' })).toThrow();
  });

  it('converts the space notice string payload to its support model', () => {
    expect(user('SpaceNotice', 'A notice')).toEqual({ content: 'A notice' });
    expect(() => user('SpaceNotice', {})).toThrow();
  });

  it('normalizes guest navigation identity fields and retains authenticated IDs', () => {
    expect(login('Nav', { mid: 0, uname: ' ', face: '', isLogin: false })).toMatchObject({ mid: null, uname: null, face: null });
    expect(login('Nav', { mid: 170001, uname: 'User', isLogin: true })).toMatchObject({ mid: 170001, uname: 'User' });
  });

  it('flattens generated captcha fields for the login flow', () => {
    expect(login('Captcha', { token: 'tok', geetest: { gt: 'gt', challenge: 'c' } })).toEqual({ token: 'tok', gt: 'gt', challenge: 'c' });
  });

  it('normalizes alternate playback field names through cross-domain DASH models', () => {
    const stream = { id: 1, base_url: 'https://example.com/v', backup_url: [], mime_type: 'video/mp4', frame_rate: '60' };
    expect(cheese('PlayURL', { dash: { video: [stream], dolby: { type: 'NONE' } } })).toMatchObject({
      dash: { video: [{ baseUrl: 'https://example.com/v', backupUrl: [], mimeType: 'video/mp4', frameRate: '60' }], dolby: { type: 0 } },
    });
    expect(video('DASHStream', { ...stream, baseUrl: 'https://example.com/preferred', backupUrl: ['fallback'] })).toMatchObject({ baseUrl: 'https://example.com/preferred', backupUrl: ['fallback'] });
  });

  it('normalizes season statistic aliases only when canonical keys are absent', () => {
    expect(bangumi('Stat', { coin: 6, play: 99 })).toMatchObject({ coins: 6, views: 99 });
    expect(bangumi('Stat', { coins: 0, coin: 6, views: 0, play: 99 })).toMatchObject({ coins: 0, views: 0 });
  });

  it('normalizes collection pagination response aliases', () => {
    expect(video('CollectionPage', { page_num: 4, page_size: 20, total: 61 })).toEqual({ page: 4, size: 20, total: 61 });
    expect(video('CollectionPage', { num: 2, size: 30, total: 61 })).toEqual({ page: 2, size: 30, total: 61 });
  });

  it('validates every supplied collection pagination alias before selecting values', () => {
    expect(() => video('CollectionPage', { page_num: 1, num: 'wrong', page_size: 2 })).toThrow();
    expect(() => video('CollectionPage', { page_num: 1, page_size: 2, size: -1 })).toThrow();
  });

  it('normalizes historical dynamic IDs and null tombstones recursively', () => {
    expect(dynamic('Detail', { item: { id_str: 9007199254740993n, orig: { id_str: null } } })).toMatchObject({ item: { id_str: '9007199254740993', orig: { id_str: '' } } });
    expect(() => dynamic('DetailItem', { id_str: true })).toThrow();
  });

  it('normalizes dynamic numeric strings without rounding', () => {
    expect(dynamic('NavFeed', { update_num: '3', items: [{ rid: '18446744073709551615', author: { mid: '170001' } }] })).toMatchObject({ update_num: 3, items: [{ rid: 18446744073709551615n, author: { mid: 170001 } }] });
    expect(dynamic('MyInfo', { dyns: '2', following: null, mid: '-1' })).toMatchObject({ dyns: 2, following: 0, mid: -1 });
    expect(() => dynamic('Feed', { update_num: '1e3' })).toThrow();
  });

  it('keeps unknown lottery sections in the explicit extra field', () => {
    expect(live('LotteryInfo', { popularity_red_pocket: [], new_section: { n: 9007199254740993n } })).toMatchObject({ popularity_red_pocket: [], extra: { new_section: { n: 9007199254740993n } } });
  });

  it('parses split-layer JSON with exact integer preservation', () => {
    expect(webwidget('HeaderData', { split_layer: '{"version":"1","layers":[{"id":9007199254740993}]}' })).toMatchObject({ parsedSplitLayer: { version: '1', layers: [{ id: 9007199254740993n }] } });
    expect(() => webwidget('HeaderData', { split_layer: '{' })).toThrow();
  });

  it('ignores incoming fields excluded by Go json tags and computes them from wire data', () => {
    expect(webwidget('HeaderData', { split_layer: '', parsedSplitLayer: { version: 'injected' } })).toMatchObject({ parsedSplitLayer: null });
    expect(webwidget('HeaderData', { split_layer: '{"version":"wire"}', parsedSplitLayer: { version: 'injected' } })).toMatchObject({ parsedSplitLayer: { version: 'wire' } });
    expect(login('QRStatus', { cookies: { SESSDATA: 'injected' } })).toMatchObject({ cookies: null });
    expect(live('LotteryInfo', { new_section: { n: 1 }, extra: { injected: true } })).toMatchObject({ extra: { new_section: { n: 1 }, extra: { injected: true } } });
    expect(dynamic('Feed', { update_num: '7' })).toMatchObject({ update_num: 7 });
  });

  it('types article embed variants and preserves incompatible variants as raw data', () => {
    expect(article('CardData', { v: { aid: 170001, bvid: 'BV17x411w7KC', cid: 1 }, unknown: { new_kind: true }, bad: { aid: 0 } })).toMatchObject({ v: { video: { aid: 170001 } }, unknown: { raw: { new_kind: true } }, bad: { raw: { aid: 0 } } });
  });

  it('resolves generic and array model expressions and validates nested IDs', () => {
    expect(search('search.Data[[]search.Video]', { result: [{ aid: 170001, bvid: 'BV17x411w7KC' }] })).toMatchObject({ result: [{ aid: 170001, bvid: 'BV17x411w7KC' }] });
    expect(() => video('[]video.Page', [{ cid: 0 }])).toThrow();
  });

  it('retains anonymous struct fields in creator statistics', () => {
    expect(creativecenter('PlaySource', { page_source: { dynamic: 14, related_video: 9 }, play_proportion: { android: 23, ios: 11, h5: 7, pc: 5 } })).toMatchObject({ page_source: { dynamic: 14, related_video: 9 }, play_proportion: { android: 23, ios: 11, h5: 7, pc: 5 } });
  });

  it('rejects malformed playback alias fields even when canonical values are present', () => {
    expect(() => video('DASHStream', { baseUrl: 'https://example.com', base_url: 42 })).toThrow();
    expect(() => video('DASHStream', { backupUrl: [], backup_url: 'bad' })).toThrow();
  });

  it('rejects unsafe numbers in historical dynamic identifiers', () => {
    expect(() => dynamic('DetailItem', { id_str: Number.MAX_SAFE_INTEGER + 1 })).toThrow();
  });

  it.each([Infinity, -Infinity, NaN, 10n ** 400n])('rejects nonfinite float32 and float64 scores %s', (score) => {
    expect(() => search('MediaScore', { score })).toThrow();
    expect(() => bangumi('Rating', { score })).toThrow();
  });

  it('rounds float32 model fields while retaining float64 precision', () => {
    expect(danmaku('CommentMeta', { time: 0.1 })).toMatchObject({ time: 0.10000000149011612 });
    expect(search('MediaScore', { score: 0.1 })).toMatchObject({ score: 0.10000000149011612 });
    expect(bangumi('Rating', { score: 0.1 })).toMatchObject({ score: 0.1 });
  });

  it.each([1e39, -1e39, Infinity, NaN])('rejects float32 overflow %s', (time) => {
    expect(() => danmaku('CommentMeta', { time })).toThrow();
  });

  it('preserves finite floating point boundaries and negative zero', () => {
    expect(bangumi('Rating', { score: Number.MAX_VALUE })).toMatchObject({ score: Number.MAX_VALUE });
    expect(danmaku('CommentMeta', { time: 3.4028234663852886e38 })).toMatchObject({ time: 3.4028234663852886e38 });
    expect(danmaku('float32', -0)).toBe(-0);
  });
});
