import { ParameterError } from './errors.js';

/** JSON integers outside JavaScript's safe range are represented as bigint. */
export type JSONValue = null | boolean | string | number | bigint | JSONValue[] | { [key: string]: JSONValue };

/** Parse JSON without rounding large integer tokens or changing quoted strings. */
export function parseJSON(text: string): JSONValue {
  // Validate the full JSON grammar first; diagnostics are wrapped by callers.
  JSON.parse(text);
  let position = 0;
  const skip = () => { while (/\s/.test(text[position] ?? '') && position < text.length) position++; };
  const parse = (): JSONValue => {
    skip();
    const first = text[position];
    if (first === '"') {
      const start = position++;
      while (position < text.length) {
        const character = text[position++];
        if (character === '\\') position++;
        else if (character === '"') break;
      }
      return JSON.parse(text.slice(start, position)) as string;
    }
    if (first === '[') {
      position++; skip();
      const array: JSONValue[] = [];
      if (text[position] === ']') { position++; return array; }
      for (;;) { array.push(parse()); skip(); if (text[position++] === ']') return array; }
    }
    if (first === '{') {
      position++; skip();
      const object: { [key: string]: JSONValue } = {};
      if (text[position] === '}') { position++; return object; }
      for (;;) {
        const key = parse() as string; skip(); position++;
        const value = parse();
        // Define rather than assign so a JSON __proto__ key stays ordinary data.
        Object.defineProperty(object, key, { value, enumerable: true, writable: true, configurable: true });
        skip(); if (text[position++] === '}') return object;
      }
    }
    for (const [token, value] of [['null', null], ['true', true], ['false', false]] as const) {
      if (text.startsWith(token, position)) { position += token.length; return value; }
    }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(position))!;
    const token = match[0]; position += token.length;
    if (!/[.eE]/.test(token)) {
      const integer = BigInt(token);
      if (integer > BigInt(Number.MAX_SAFE_INTEGER) || integer < BigInt(Number.MIN_SAFE_INTEGER)) return integer;
    }
    const number = Number(token);
    if (!Number.isFinite(number)) throw new SyntaxError('JSON number is outside the finite numeric range');
    return number;
  };
  return parse();
}

/** Encode bigint fields as JSON numbers, retaining their exact decimal digits. */
export function stringifyJSON(value: unknown): string {
  const ancestors = new Set<object>();
  const encode = (current: unknown, key: string): string | undefined => {
    if (current && typeof current === 'object' && 'toJSON' in current && typeof current.toJSON === 'function') current = current.toJSON(key);
    if (typeof current === 'bigint') return current.toString();
    if (typeof current === 'number') {
      if (Number.isInteger(current) && !Number.isSafeInteger(current)) throw new ParameterError('json_body', 'integer numbers must be safe; use bigint or a string');
      return Number.isFinite(current) ? String(current) : 'null';
    }
    if (current === null || typeof current === 'string' || typeof current === 'boolean') return JSON.stringify(current);
    if (typeof current !== 'object') return undefined;
    if (ancestors.has(current)) throw new ParameterError('json_body', 'request body cannot be encoded as JSON');
    ancestors.add(current);
    let result: string;
    if (Array.isArray(current)) result = `[${Array.from({ length: current.length }, (_, index) => encode(current[index], String(index)) ?? 'null').join(',')}]`;
    else result = `{${Object.keys(current).flatMap(key => {
      const encoded = encode((current as Record<string, unknown>)[key], key);
      return encoded === undefined ? [] : [`${JSON.stringify(key)}:${encoded}`];
    }).join(',')}}`;
    ancestors.delete(current); return result;
  };
  const result = encode(value, '');
  if (result === undefined) throw new ParameterError('json_body', 'request body cannot be encoded as JSON');
  return result;
}
