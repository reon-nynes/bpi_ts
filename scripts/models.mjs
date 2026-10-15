import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { commit } = JSON.parse(await readFile(path.join(root, 'scripts/upstream/provenance.json'), 'utf8'));
const domains = 'activity article audio bangumi cheese clientinfo comment creativecenter danmaku dynamic electric fav historytoview live login manga message misc note opus search user video videoranking vip wallet webwidget'.split(' ');
const snapshotPath = path.join(root, 'scripts', 'models-source.json');
const customJSON = {
  'article.CardItem': 'Choose VideoCard by aid, LiveCard by room_id, ArticleCard by id; preserve incompatible or unknown objects in raw.',
  'bangumi.Stat': 'Use coin/play aliases only when coins/views are absent.',
  'dynamic.Feed': 'Decode update_num as quoted or numeric uint64; null and missing are zero.',
  'dynamic.DetailItem': 'Convert numeric id_str to exact text and null/missing tombstones to empty text; recurse into orig.',
  'dynamic.NavAuthor': 'Decode mid as quoted or numeric uint64.',
  'dynamic.NavItem': 'Decode rid as quoted or numeric uint64.',
  'dynamic.NavFeed': 'Decode update_num as quoted or numeric uint64.',
  'dynamic.MyInfo': 'Decode dyns/following/mid as quoted or numeric int64.',
  'live.LotteryInfo': 'Retain undocumented top-level lottery sections in extra.',
  'login.Nav': 'Convert guest zero mid and blank uname/face to null; validate nonzero member IDs.',
  'message.Sessions': 'Require non-null page flags; missing or null session_list remains null.',
  'message.Session': 'Require session identity, timestamps, counters and flags; last_msg may be missing or null.',
  'message.SessionMessages': 'Require non-null page flags and sequence boundaries; missing or null messages remains null.',
  'message.PrivateMessage': 'Require message identity, content, sequence, timestamp, status, source and notify_code; preserve unknown message kinds.',
  'user.CardSummary': 'Accept either quoted or numeric member IDs with full uint64 validation.',
  'user.SpaceNotice': 'Wrap the API string payload as content.',
  'user.NameToUIDItem': 'Accept either quoted or numeric uid with full uint64 validation.',
  'user.flexibleMID': 'Shared quoted/numeric MID decoder used by CardSummary and NameToUIDItem.',
  'video.DASHDolby': 'Use zero for nonnumeric or invalid uint8 Dolby type markers.',
  'video.DASHStream': 'Read base_url/backup_url/mime_type/frame_rate aliases when camelCase values are empty or null.',
  'video.CollectionPage': 'Read page_num/page_size with fallback to num/size.',
  'webwidget.HeaderData': 'Parse nonblank split_layer JSON into parsedSplitLayer using the lossless decoder.',
};

/** Tokenize Go while retaining field/declaration line boundaries. Strings and
 * comments are tokens so braces inside either never affect balanced parsing. */
function tokenize(source) {
  const pattern = /\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|`[^`]*`|"(?:\\.|[^"\\])*"|\r?\n|[ \t\r]+|[A-Za-z_][A-Za-z_0-9]*|[0-9][0-9A-Za-z_.]*|<<|>>|[^\s]/gy;
  const tokens = [];
  let match;
  while ((match = pattern.exec(source))) {
    const value = match[0];
    if (/^[ \t\r]+$/.test(value) || value.startsWith('//')) continue;
    if (value.startsWith('/*')) {
      for (const _ of value.matchAll(/\n/g)) tokens.push('\n');
    } else tokens.push(value === '\r\n' ? '\n' : value);
  }
  if (pattern.lastIndex && pattern.lastIndex !== source.length) throw new Error('incomplete Go tokenization');
  return tokens;
}

class Parser {
  constructor(tokens) { this.tokens = tokens; this.i = 0; }
  peek() { return this.tokens[this.i]; }
  take(value) {
    const got = this.tokens[this.i++];
    if (value !== undefined && got !== value) throw new Error(`expected ${value}, got ${got} at token ${this.i}`);
    return got;
  }
  newline() { while (this.peek() === '\n' || this.peek() === ';') this.i++; }
  type() {
    const first = this.take();
    if (first === '*') return { kind: 'pointer', value: this.type() };
    if (first === '[') {
      const length = this.peek() === ']' ? null : this.take();
      this.take(']');
      return { kind: 'array', length, value: this.type() };
    }
    if (first === 'map') {
      this.take('['); const key = this.type(); this.take(']');
      return { kind: 'map', key, value: this.type() };
    }
    if (first === 'struct') {
      this.take('{'); this.newline();
      const fields = [];
      while (this.peek() !== '}') {
        const start = this.i;
        let names = [];
        if (/^[A-Za-z_]/.test(this.peek()) && this.tokens[this.i + 1] !== '.' && !['\n', '}', ';'].includes(this.tokens[this.i + 1]) && !this.tokens[this.i + 1]?.startsWith('`')) {
          names.push(this.take());
          while (this.peek() === ',') { this.take(','); names.push(this.take()); }
        }
        const value = this.type();
        const tag = this.peek()?.startsWith('`') ? this.take().slice(1, -1) : '';
        fields.push({ names, value, tag });
        if (this.i === start) throw new Error('no progress parsing field');
        if (!['\n', ';', '}'].includes(this.peek())) throw new Error(`unexpected field token ${this.peek()}`);
        this.newline();
      }
      this.take('}'); return { kind: 'struct', fields };
    }
    if (first === 'interface') { this.take('{'); this.take('}'); return { kind: 'unknown' }; }
    let name = first;
    if (this.peek() === '.') { this.take('.'); name += '.' + this.take(); }
    const args = [];
    if (this.peek() === '[') {
      this.take('[');
      while (this.peek() !== ']') { args.push(this.type()); if (this.peek() === ',') this.take(','); else break; }
      this.take(']');
    }
    return { kind: 'named', name, args };
  }
  definition(file) {
    const name = this.take();
    const generic = [];
    if (this.peek() === '[') {
      this.take('[');
      while (this.peek() !== ']') {
        generic.push(this.take()); this.type();
        if (this.peek() === ',') this.take(',');
      }
      this.take(']');
    }
    if (this.peek() === '=') this.take('=');
    const value = this.type();
    return { name, generic, value, file };
  }
}

function parseSource(source, file) {
  const parser = new Parser(tokenize(source));
  const types = [];
  const constants = [];
  let depth = 0;
  while (parser.i < parser.tokens.length) {
    const token = parser.take();
    if (token === '{') depth++;
    if (token === '}') depth--;
    if (depth !== 0) continue;
    if (token === 'type') {
      if (parser.peek() === '(') {
        parser.take('('); parser.newline();
        while (parser.peek() !== ')') { types.push(parser.definition(file)); parser.newline(); }
        parser.take(')');
      } else types.push(parser.definition(file));
    }
    if (token === 'const') {
      const grouped = parser.peek() === '(';
      if (grouped) { parser.take('('); parser.newline(); }
      let prior = null;
      let ordinal = 0;
      do {
        const spec = [];
        while (parser.i < parser.tokens.length && parser.peek() !== '\n' && parser.peek() !== ')' && parser.peek() !== ';') {
          if (parser.peek() === '(') {
            let nesting = 0;
            do { const t = parser.take(); spec.push(t); if (t === '(') nesting++; if (t === ')') nesting--; } while (nesting > 0);
          } else spec.push(parser.take());
        }
        if (spec.length) {
          const name = spec.shift();
          const eq = spec.indexOf('=');
          const explicit = eq >= 0 ? { type: spec.slice(0, eq).join(''), expression: spec.slice(eq + 1) } : prior;
          if (!explicit) throw new Error(`constant ${name} has no value in ${file}`);
          constants.push({ name, ...explicit, ordinal, file }); prior = explicit; ordinal++;
        }
        parser.newline();
      } while (grouped && parser.peek() !== ')');
      if (grouped) parser.take(')');
    }
  }
  return { types, constants };
}

function evaluateConstant(spec, values) {
  let tokens = spec.expression.filter(t => t !== '\n');
  if (tokens.length === 1 && tokens[0].startsWith('"')) return JSON.parse(tokens[0]);
  const qualified = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i + 1] === '.') { qualified.push(tokens[i] + '.' + tokens[i + 2]); i += 2; }
    else qualified.push(tokens[i]);
  }
  tokens = qualified;
  tokens = tokens.map(t => t === 'iota' ? String(spec.ordinal) : values.has(t) ? JSON.stringify(values.get(t)) : t);
  let expression = tokens.join(' ').replace(/\b(?:u?int(?:8|16|32|64)?|float(?:32|64))\s*\(/g, '(').replace(/(?<=\d)_(?=\d)/g, '');
  if (!/^[\d\s()+\-*/%<>&|^.]+$/.test(expression)) throw new Error(`unsupported Go constant ${spec.name}: ${expression}`);
  const value = Function(`"use strict";return (${expression});`)();
  if (!Number.isSafeInteger(value)) throw new Error(`constant ${spec.name} requires exact bigint evaluation`);
  return value;
}

function camel(name) {
  if (/^[A-Z]+$/.test(name)) return name.toLowerCase();
  return name.replace(/^[A-Z]+(?=[A-Z][a-z])|^[A-Z]/, match => match.toLowerCase());
}

const customFields = {
  'dynamic.Feed.UpdateNum': 'update_num', 'dynamic.NavFeed.UpdateNum': 'update_num',
  'dynamic.NavAuthor.MID': 'mid', 'dynamic.NavItem.RID': 'rid',
  'dynamic.MyInfo.Dynamics': 'dyns', 'dynamic.MyInfo.Following': 'following', 'dynamic.MyInfo.MID': 'mid',
};

function fieldsFor(domain, definition) {
  const fields = [];
  for (const field of definition.value.fields) {
    if (!field.names.length) { fields.push({ ...field, embed: true }); continue; }
    for (const name of field.names) {
      if (!/^[A-Z]/.test(name)) continue;
      const match = field.tag.match(/json:"([^"]*)"/);
      const jsonName = match?.[1].split(',')[0];
      const override = customFields[`${domain}.${definition.name}.${name}`];
      fields.push({ ...field, names: [name], name: override ?? (jsonName && jsonName !== '-' ? jsonName : camel(name)),
        optional: field.value.kind === 'pointer' || jsonName === '-' || /,omitempty/.test(match?.[1] ?? ''),
        derived: jsonName === '-' && override === undefined });
    }
  }
  return fields;
}

function modelSchema(domain, name, value) {
  if (value.kind === 'struct') return { kind: 'struct', fields: fieldsFor(domain, { name, value }).map(field => ({
    names: field.names, tag: field.tag, value: modelSchema(domain, '', field.value),
    ...(field.embed ? { embed: true } : { name: field.name, optional: field.optional, ...(field.derived ? { derived: true } : {}) }),
  })) };
  if (value.kind === 'array' || value.kind === 'pointer') return { ...value, value: modelSchema(domain, '', value.value) };
  if (value.kind === 'map') return { ...value, value: modelSchema(domain, '', value.value) };
  return value;
}

function renderType(type, imports) {
  if (type.kind === 'unknown') return 'unknown';
  if (type.kind === 'pointer') return `${renderType(type.value, imports)} | null`;
  if (type.kind === 'array') return `Array<${renderType(type.value, imports)}> | null`;
  if (type.kind === 'map') return `Record<string, ${renderType(type.value, imports)}> | null`;
  if (type.kind === 'struct') {
    const definition = { name: '', value: type };
    return '{ ' + fieldsFor('', definition).map(field => {
      if (field.embed) throw new Error('unsupported anonymous inline embed');
      return `${JSON.stringify(field.name)}${field.optional ? '?' : ''}: ${renderType(field.value, imports)};`;
    }).join(' ') + ' }';
  }
  const { name, args } = type;
  if (['int64', 'uint64', 'int', 'uint'].includes(name)) return 'number | bigint';
  if (/^(?:u?int(?:8|16|32)|float(?:32|64)|byte|rune)$/.test(name)) return 'number';
  if (name === 'bool') return 'boolean';
  if (name === 'string') return 'string';
  if (name === 'any') return 'unknown';
  if (name === 'json.RawMessage') return 'JSONValue';
  if (name === 'xml.Name') return '{ space: string; local: string }';
  if (name === 'time.Duration') return 'number | bigint';
  if (name.startsWith('ids.')) { const local = name.slice(4); imports.ids.add(local); return local; }
  if (name.includes('.')) { const [domain, local] = name.split('.'); imports.domains.add(domain); return `${domain}.${local}${args.length ? `<${args.map(arg => renderType(arg, imports)).join(', ')}>` : ''}`; }
  return name + (args.length ? `<${args.map(arg => renderType(arg, imports)).join(', ')}>` : '');
}

const xmlOverrides = {
  XML: 'export interface XML { xmlName: { space: string; local: string }; chatServer: string; chatID: string; mission: number; maxLimit: number; state: number; realName: number; source: string; comments: Comment[]; }',
  Comment: 'export interface Comment { parameters: string; content: string; meta: CommentMeta; }',
  CommentMeta: 'export interface CommentMeta { time: number; mode: number; fontSize: number; color: number; sentAt: number | bigint; pool: number; userHash: string; id: number | bigint; blockLevel: number; }',
};

function renderDomain(domain, data) {
  const imports = { ids: new Set(), domains: new Set() };
  const blocks = [];
  for (const definition of data.types) {
    if (domain === 'danmaku' && xmlOverrides[definition.name]) { blocks.push(xmlOverrides[definition.name]); continue; }
    const generic = definition.generic.length ? '<' + definition.generic.map(name => `${name} = unknown`).join(', ') + '>' : '';
    if (definition.value.kind !== 'struct') {
      blocks.push(`/** Ported from ${definition.file}. */\nexport type ${definition.name}${generic} = ${renderType(definition.value, imports)};`);
      continue;
    }
    const fields = fieldsFor(domain, definition);
    const embeds = fields.filter(field => field.embed).map(field => renderType(field.value, imports));
    const properties = fields.filter(field => !field.embed).map(field => `  ${JSON.stringify(field.name)}${field.optional ? '?' : ''}: ${renderType(field.value, imports)};`);
    blocks.push(`/** Ported from ${definition.file}. */\nexport interface ${definition.name}${generic}${embeds.length ? ' extends ' + embeds.join(', ') : ''} {\n${properties.join('\n')}\n}`);
  }
  for (const constant of data.constants) {
    const type = constant.type ? renderType({ kind: 'named', name: constant.type, args: [] }, imports) : '';
    // Preserve session-category literals for the request parameter union.
    if (domain === 'message' && constant.type === 'SessionListType') blocks.push(`export const ${constant.name} = ${JSON.stringify(constant.value)} satisfies ${type};`);
    else blocks.push(`export const ${constant.name}${type ? ': ' + type : ''} = ${JSON.stringify(constant.value)};`);
  }
  const header = [`// Generated by scripts/models.mjs from bpi-go ${commit}. Do not edit.`,
    '/** JSON data preserves integer precision through bigint for values outside the safe number range. */',
    'export type JSONValue = null | boolean | number | bigint | string | JSONValue[] | { [key: string]: JSONValue };'];
  if (imports.ids.size) header.push(`import type { ${[...imports.ids].sort().join(', ')} } from '../ids/index.js';`);
  for (const other of [...imports.domains].sort()) header.push(`import * as ${other} from '../${other}/models.js';`);
  header.push("import { createModelNormalizer, type ModelDefinition } from '../internal/models.js';");
  const definitions = Object.fromEntries(data.types.map(definition => [definition.name, { generic: definition.generic,
    value: modelSchema(domain, definition.name, definition.value) }]));
  const schema = `const modelDefinitions: Record<string, ModelDefinition> = ${JSON.stringify(definitions)};`;
  const dependencies = [...imports.domains].sort().map(other => `${JSON.stringify(other)}: (name: string, payload: unknown) => ${other}.normalizePayload(name, payload)`);
  const normalizer = `/** Decode a Go model expression using the ported response semantics. */\nexport const normalizePayload = createModelNormalizer(${JSON.stringify(domain)}, modelDefinitions, { ${dependencies.join(', ')} });`;
  return header.join('\n') + '\n\n' + blocks.join('\n\n') + '\n\n' + schema + '\n\n' + normalizer + '\n';
}

const sourceFlag = process.argv.indexOf('--source');
let snapshot;
if (sourceFlag >= 0) {
  const upstream = path.resolve(process.argv[sourceFlag + 1]);
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim();
  if (sourceCommit !== commit) throw new Error(`model source is ${sourceCommit}; expected pinned upstream ${commit}`);
  snapshot = { schema_version: 1, upstream: 'https://github.com/Yuelioi/bpi-go', commit, custom_json: customJSON, domains: {}, files: [], excluded_types: [] };
  const packageValues = new Map();
  for (const domain of domains) {
    const data = { types: [], constants: [] };
    const values = new Map(packageValues);
    for (const file of (await readdir(path.join(upstream, domain))).filter(file => file.endsWith('.go') && !file.endsWith('_test.go')).sort()) {
      const relative = `${domain}/${file}`;
      const source = await readFile(path.join(upstream, relative), 'utf8');
      snapshot.files.push({ path: relative, sha256: createHash('sha256').update(source).digest('hex') });
      const parsed = parseSource(source, relative);
      for (const type of parsed.types) {
        const reason = !/^[A-Z]/.test(type.name) ? 'unexported implementation helper' : type.name.endsWith('Params') ? 'request parameter type owned by domain params generator' : type.name === 'Client' ? 'domain client owned by endpoint generator' : type.value.kind === 'struct' && !type.value.fields.some(field => field.names.some(name => /^[A-Z]/.test(name)) || !field.names.length) ? 'request helper with no exported response fields' : null;
        if (reason) snapshot.excluded_types.push({ name: `${domain}.${type.name}`, file: relative, reason });
        else data.types.push(type);
      }
      for (const spec of parsed.constants) {
        const value = evaluateConstant(spec, values); values.set(spec.name, value); packageValues.set(`${domain}.${spec.name}`, value);
        if (/^[A-Z]/.test(spec.name)) data.constants.push({ name: spec.name, type: spec.type, value, file: relative });
      }
    }
    snapshot.domains[domain] = data;
  }
  const parity = JSON.parse(await readFile(path.join(upstream, 'parity', 'implemented.json'), 'utf8'));
  snapshot.promoted_models = parity.mappings.map(mapping => ({ contract: mapping.contract, model: mapping.model }));
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
} else snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
if (snapshot.commit !== commit) throw new Error(`model snapshot is ${snapshot.commit}; expected pinned upstream ${commit}`);

for (const mapping of snapshot.promoted_models ?? []) {
  for (const match of mapping.model.matchAll(/([a-z]+)\.([A-Z][A-Za-z0-9_]*)/g)) {
    if (!snapshot.domains[match[1]]?.types.some(type => type.name === match[2])) throw new Error(`unresolved promoted response model ${match[0]} for ${mapping.contract}`);
  }
}

for (const domain of domains) {
  await mkdir(path.join(root, 'src', domain), { recursive: true });
  await writeFile(path.join(root, 'src', domain, 'models.ts'), renderDomain(domain, snapshot.domains[domain]));
}
await mkdir(path.join(root, 'src', 'internal'), { recursive: true });
await writeFile(path.join(root, 'src', 'internal', 'models.ts'), await readFile(path.join(root, 'scripts', 'models-runtime.ts'), 'utf8'));
console.log(JSON.stringify({ commit, domains: domains.length, types: Object.values(snapshot.domains).reduce((n, d) => n + d.types.length, 0), constants: Object.values(snapshot.domains).reduce((n, d) => n + d.constants.length, 0), files: snapshot.files.length }));
