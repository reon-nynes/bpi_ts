import { inflateRawSync } from 'node:zlib';
import type { XML, Comment, CommentMeta } from './models.js';

const DEFAULT_MAX_BYTES = 16 * 1024 * 1024;
const NAME = /^[\p{L}_:][\p{L}\p{N}_.:\-\u00b7\p{M}]*/u;
const XML_SPACE = /^[\t\n\r ]*$/;
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';

interface Element {
  qualifiedName: string;
  name: string;
  namespace: string;
  namespaces: Map<string, string>;
  attributes: Map<string, string>;
  text: string;
  children: Element[];
}

/** Decode a bounded raw-deflate XML response and its compact comment metadata. */
export function parseDeflateXML(body: Uint8Array, maxBytes = DEFAULT_MAX_BYTES): XML {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError('danmaku: maxBytes must be a positive safe integer');
  }
  let decoded: Uint8Array;
  try {
    decoded = inflateRawSync(body, { maxOutputLength: maxBytes });
  } catch (cause) {
    throw new Error('danmaku: decompress XML failed or exceeded the decompressed byte limit', { cause });
  }
  let root: Element;
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(decoded);
    root = parseXML(source);
    if (root.name !== 'i') throw new Error('expected the i root element');
  } catch (cause) {
    throw new Error('danmaku: decode XML', { cause });
  }

  const document: XML = {
    xmlName: { space: root.namespace, local: root.name },
    chatServer: '', chatID: '', mission: 0, maxLimit: 0, state: 0, realName: 0,
    source: '', comments: [],
  };
  try {
    for (const child of root.children) {
      switch (child.name) {
        case 'chatserver': document.chatServer = child.text; break;
        case 'chatid': document.chatID = child.text; break;
        case 'mission': document.mission = int32(child.text.trim() || '0'); break;
        case 'maxlimit': document.maxLimit = int32(child.text.trim() || '0'); break;
        case 'state': document.state = int32(child.text.trim() || '0'); break;
        case 'real_name': document.realName = int32(child.text.trim() || '0'); break;
        case 'source': document.source = child.text; break;
        case 'd': {
          const parameters = child.attributes.get('p') ?? '';
          let meta: CommentMeta;
          try {
            meta = parseCommentMeta(parameters);
          } catch (cause) {
            throw new Error(`danmaku: decode comment ${document.comments.length} metadata`, { cause });
          }
          const comment: Comment = { parameters, content: child.text, meta };
          document.comments.push(comment);
          break;
        }
      }
    }
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes('metadata')) throw cause;
    throw new Error('danmaku: decode XML numeric field', { cause });
  }
  return document;
}

function int32(value: string): number {
  const parsed = signedInteger(value, 32);
  return Number(parsed);
}

function signedInteger(value: string, bits: 32 | 64): bigint {
  if (!/^[+-]?\d+$/.test(value)) throw new Error('expected a decimal integer');
  const parsed = BigInt(value);
  const bound = 1n << BigInt(bits - 1);
  if (parsed < -bound || parsed >= bound) throw new Error(`integer exceeds signed ${bits}-bit range`);
  return parsed;
}

function int64(value: string): number | bigint {
  const parsed = signedInteger(value, 64);
  return parsed >= BigInt(Number.MIN_SAFE_INTEGER) && parsed <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(parsed) : parsed;
}

function parseCommentMeta(parameters: string): CommentMeta {
  const parts = parameters.split(',');
  if (parts.length < 9) throw new Error(`expected 9 fields, got ${parts.length}`);
  const timeText = parts[0]!;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(timeText)) {
    throw new Error('expected a finite timestamp');
  }
  const time = Math.fround(Number(timeText));
  if (!Number.isFinite(time)) throw new Error('timestamp exceeds float32 range');
  return {
    time, mode: int32(parts[1]!), fontSize: int32(parts[2]!), color: int32(parts[3]!),
    sentAt: int64(parts[4]!), pool: int32(parts[5]!), userHash: parts[6]!,
    id: int64(parts[7]!), blockLevel: int32(parts[8]!),
  };
}

/** A deliberately small XML 1.0 parser: no DTDs or user-defined entities. */
function parseXML(input: string): Element {
  const source = input.replace(/\r\n?/g, '\n');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(source)) {
    throw new Error('invalid XML character');
  }
  const stack: Element[] = [];
  let root: Element | undefined;
  let index = 0;
  const append = (text: string) => {
    const parent = stack.at(-1);
    if (parent) parent.text += text;
    else if (!XML_SPACE.test(text)) throw new Error('text outside the root element');
  };
  while (index < source.length) {
    if (source[index] !== '<') {
      const end = source.indexOf('<', index);
      const text = source.slice(index, end < 0 ? source.length : end);
      if (text.includes(']]>')) throw new Error('CDATA terminator in character data');
      append(decodeEntities(text));
      index = end < 0 ? source.length : end;
      continue;
    }
    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4);
      if (end < 0) throw new Error('unterminated XML comment');
      const comment = source.slice(index + 4, end);
      if (comment.includes('--') || comment.endsWith('-')) throw new Error('invalid XML comment');
      index = end + 3;
      continue;
    }
    if (source.startsWith('<![CDATA[', index)) {
      if (stack.length === 0) throw new Error('CDATA outside the root element');
      const end = source.indexOf(']]>', index + 9);
      if (end < 0) throw new Error('unterminated CDATA');
      append(source.slice(index + 9, end));
      index = end + 3;
      continue;
    }
    if (source.startsWith('<?', index)) {
      const end = source.indexOf('?>', index + 2);
      if (end < 0) throw new Error('unterminated XML processing instruction');
      const instruction = source.slice(index + 2, end);
      const target = instruction.match(NAME)?.[0];
      if (!target || (instruction.length > target.length && !/^\s/.test(instruction.slice(target.length)))) {
        throw new Error('invalid XML processing instruction');
      }
      if (target.toLowerCase() === 'xml') {
        if (target !== 'xml' || index !== 0 || !/^xml\s+version\s*=\s*(['"])1\.0\1(?:\s+encoding\s*=\s*(['"])(?:UTF-8|utf-8|US-ASCII)\2)?(?:\s+standalone\s*=\s*(['"])(?:yes|no)\3)?\s*$/.test(instruction)) {
          throw new Error('invalid or unsupported XML declaration');
        }
      }
      index = end + 2;
      continue;
    }
    if (source.startsWith('<!', index)) throw new Error('XML DOCTYPE and declarations are disallowed');
    if (source.startsWith('</', index)) {
      const end = source.indexOf('>', index + 2);
      if (end < 0) throw new Error('unterminated closing tag');
      const closing = source.slice(index + 2, end);
      const name = closing.match(NAME)?.[0];
      if (!name || !XML_SPACE.test(closing.slice(name.length))) throw new Error('invalid closing tag');
      const node = stack.pop();
      if (!node || node.qualifiedName !== name) throw new Error('mismatched closing tag');
      index = end + 1;
      continue;
    }
    const name = source.slice(index + 1).match(NAME)?.[0];
    if (!name) throw new Error('invalid element name');
    index += name.length + 1;
    const attributes = new Map<string, string>();
    let selfClosing = false;
    while (true) {
      const whitespace = source.slice(index).match(/^[\t\n ]*/)?.[0] ?? '';
      index += whitespace.length;
      if (source.startsWith('/>', index)) { selfClosing = true; index += 2; break; }
      if (source[index] === '>') { index++; break; }
      if (whitespace.length === 0) throw new Error('attributes must be separated by whitespace');
      const attribute = source.slice(index).match(NAME)?.[0];
      if (!attribute) throw new Error('invalid or unterminated start tag');
      if (attributes.has(attribute)) throw new Error('duplicate attribute');
      index += attribute.length;
      index += source.slice(index).match(/^[\t\n ]*/)?.[0].length ?? 0;
      if (source[index] !== '=') throw new Error('missing attribute equals sign');
      index++;
      index += source.slice(index).match(/^[\t\n ]*/)?.[0].length ?? 0;
      const quote = source[index];
      if (quote !== '"' && quote !== "'") throw new Error('attribute values must be quoted');
      const end = source.indexOf(quote, index + 1);
      if (end < 0) throw new Error('unterminated attribute value');
      const value = source.slice(index + 1, end);
      if (value.includes('<')) throw new Error('unescaped less-than in attribute value');
      attributes.set(attribute, decodeEntities(value.replace(/[\t\n]/g, ' ')));
      index = end + 1;
    }
    const parent = stack.at(-1);
    const namespaces = new Map(parent?.namespaces ?? [['xml', XML_NAMESPACE]]);
    for (const [key, value] of attributes) {
      const [attributePrefix, attributeName] = qualifiedParts(key);
      if (key === 'xmlns') {
        if (value === XML_NAMESPACE || value === XMLNS_NAMESPACE) throw new Error('invalid default XML namespace');
        namespaces.set('', value);
      } else if (attributePrefix === 'xmlns') {
        if (!value || attributeName === 'xmlns' || value === XMLNS_NAMESPACE ||
          (attributeName === 'xml' ? value !== XML_NAMESPACE : value === XML_NAMESPACE)) {
          throw new Error('invalid XML namespace declaration');
        }
        namespaces.set(attributeName, value);
      }
    }
    const expandedAttributes = new Set<string>();
    for (const key of attributes.keys()) {
      const [attributePrefix, attributeName] = qualifiedParts(key);
      if (key === 'xmlns' || attributePrefix === 'xmlns') continue;
      if (attributePrefix && !namespaces.has(attributePrefix)) throw new Error('undeclared XML attribute namespace');
      const namespace = attributePrefix ? namespaces.get(attributePrefix)! : '';
      const expandedName = JSON.stringify([namespace, attributeName]);
      if (expandedAttributes.has(expandedName)) throw new Error('duplicate expanded XML attribute name');
      expandedAttributes.add(expandedName);
    }
    const [prefix, localName] = qualifiedParts(name);
    if (prefix && !namespaces.has(prefix)) throw new Error('undeclared XML namespace prefix');
    const node: Element = { qualifiedName: name, name: localName, namespace: namespaces.get(prefix) ?? '', namespaces, attributes, text: '', children: [] };
    if (parent) parent.children.push(node);
    else if (root) throw new Error('multiple root elements');
    else root = node;
    if (!selfClosing) {
      if (stack.length >= 256) throw new Error('XML nesting limit exceeded');
      stack.push(node);
    }
  }
  if (stack.length !== 0) throw new Error('unclosed element');
  if (!root) throw new Error('missing root element');
  return root;
}

function qualifiedParts(name: string): [string, string] {
  const parts = name.split(':');
  if (parts.length > 2 || parts.some((part) => !part || part.match(NAME)?.[0] !== part)) {
    throw new Error('invalid qualified XML name');
  }
  return parts.length === 2 ? [parts[0]!, parts[1]!] : ['', parts[0]!];
}

function decodeEntities(value: string): string {
  return value.replace(/&([^;]*);|&/g, (entity, reference: string | undefined) => {
    switch (reference) {
      case 'amp': return '&';
      case 'lt': return '<';
      case 'gt': return '>';
      case 'quot': return '"';
      case 'apos': return "'";
    }
    if (reference !== undefined && /^#(?:[0-9]+|x[0-9a-fA-F]+)$/.test(reference)) {
      const point = reference[1] === 'x' ? Number.parseInt(reference.slice(2), 16) : Number.parseInt(reference.slice(1), 10);
      if (point === 9 || point === 10 || point === 13 || (point >= 0x20 && point <= 0xd7ff) || (point >= 0xe000 && point <= 0xfffd) || (point >= 0x10000 && point <= 0x10ffff)) {
        return String.fromCodePoint(point);
      }
    }
    throw new Error(`invalid XML entity ${entity}`);
  });
}
