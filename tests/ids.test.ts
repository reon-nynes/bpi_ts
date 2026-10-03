import { describe, expect, it } from 'vitest';
import * as ids from '../src/ids/index.js';

const numericParsers = [
  ['aid', ids.parseAID], ['sid', ids.parseAudioID], ['cid', ids.parseCID],
  ['mid', ids.parseMID], ['mid', ids.parseUID], ['room_id', ids.parseRoomID],
  ['media_id', ids.parseMediaID], ['season_id', ids.parseSeasonID],
  ['ep_id', ids.parseEpisodeID], ['note_id', ids.parseNoteID], ['cvid', ids.parseCVID],
] as const;

describe('validated numeric identifiers', () => {
  it.each(numericParsers)('rejects zero and reports the %s field', (field, parse) => {
    for (const input of [0, 0n, '0']) {
      try {
        parse(input);
        expect.fail('zero identifier accepted');
      } catch (error) {
        expect(error).toBeInstanceOf(ids.InvalidError);
        expect(error).toMatchObject({ field });
      }
    }
  });

  it.each(numericParsers)('preserves the uint64 range for %s', (_, parse) => {
    expect(parse(170001)).toBe(170001);
    expect(parse('000170001')).toBe(170001);
    expect(parse(170001n)).toBe(170001);
    expect(parse('9007199254740993')).toBe(9007199254740993n);
    expect(parse('18446744073709551615')).toBe(18446744073709551615n);
    expect(String(parse(18446744073709551615n))).toBe('18446744073709551615');
  });

  it.each(numericParsers)('rejects malformed or imprecise %s inputs', (_, parse) => {
    for (const input of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1,
      -1n, 18446744073709551616n, '', ' ', '1.0', '1e3', '+1', '-1',
      '18446744073709551616', '1_000', '0x10']) {
      expect(() => parse(input)).toThrow(ids.InvalidError);
    }
  });
});

describe('validated textual identifiers', () => {
  it('accepts the upstream BVID vectors and longer ASCII identifiers', () => {
    expect(ids.parseBVID('BV17x411w7KC')).toBe('BV17x411w7KC');
    expect(ids.parseBVID('BV17x411w7KCextra')).toBe('BV17x411w7KCextra');
  });

  it.each(['', 'bv17x411w7KC', 'AV170001', 'BV17x411w7K', 'BV17x411w7K_', 'BV17x411w7K中', ' BV17x411w7KC'])
    ('rejects invalid BVID shape %j', (input) => {
      expect(() => ids.parseBVID(input)).toThrow(ids.InvalidError);
    });

  it('preserves nonblank dynamic identifiers exactly', () => {
    expect(ids.parseDynamicID('636417238732554242')).toBe('636417238732554242');
    expect(ids.parseDynamicID(' historical-token ')).toBe(' historical-token ');
  });

  it.each(['', ' ', '\t\r\n'])('rejects blank dynamic identifiers %j', (input) => {
    expect(() => ids.parseDynamicID(input)).toThrow(ids.InvalidError);
  });
});
