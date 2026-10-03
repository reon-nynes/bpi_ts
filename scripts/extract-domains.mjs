// Extract endpoint/query metadata from a pinned local bpi-go checkout.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const upstream = process.argv[2];
if (!upstream) throw new Error('Usage: node scripts/extract-domains.mjs <bpi-go checkout>');
const revision = 'add0ff775ef4caff2203d169d15e0d9afe9fb996';
const actualRevision = execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (actualRevision !== revision) throw new Error(`Expected upstream revision ${revision}, received ${actualRevision}`);
const json = (file) => JSON.parse(readFileSync(join(upstream, file), 'utf8'));
const mappings = json('parity/implemented.json').mappings;
const source = json('parity/source.json');

function closing(text, start, open = '{', close = '}') {
  let depth = 0, quote = '', comment = '';
  for (let i = start; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (comment === '//') { if (c === '\n') comment = ''; continue; }
    if (comment === '/*') { if (c === '*' && next === '/') { comment = ''; i++; } continue; }
    if (quote) { if (c === '\\' && quote !== '`') { i++; continue; } if (c === quote) quote = ''; continue; }
    if (c === '/' && (next === '/' || next === '*')) { comment = '/' + next; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === open) depth++;
    if (c === close && --depth === 0) return i;
    if (c !== close) { /* depth changes only for delimiters */ }
  }
  throw new Error('Unbalanced Go source');
}

function functions(text) {
  const result = [];
  const pattern = /^func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)[^\n{]*\{/gm;
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[0].length - 1;
    result.push({ receiver: match[2], name: match[3], header: match[0], body: text.slice(start + 1, closing(text, start)) });
  }
  return result;
}

const literal = (expression, constants) => {
  expression = expression.trim();
  if (/^".*"$/.test(expression)) return JSON.parse(expression);
  if (/^\d+$/.test(expression)) return Number(expression);
  if (constants[expression] !== undefined) return constants[expression];
  const cast = expression.match(/^(?:u?int\d*|string)\((.*)\)$/);
  return cast ? literal(cast[1], constants) : undefined;
};

const domains = [];
for (const domain of source.domains) {
  const name = domain.name === 'video_ranking' ? 'videoranking' : domain.name === 'web_widget' ? 'webwidget' : domain.name;
  const text = readdirSync(join(upstream, name)).filter((n) => n.endsWith('.go') && !n.endsWith('_test.go'))
    .map((n) => readFileSync(join(upstream, name, n), 'utf8')).join('\n');
  const fns = functions(text);
  const constants = {};
  const constantText = [...text.matchAll(/\bconst\s*\(/g)].map((m) => {
    const start = m.index + m[0].length - 1;
    return text.slice(start + 1, closing(text, start, '(', ')'));
  }).join('\n') + '\n' + [...text.matchAll(/^const\s+([^\n(]+)$/gm)].map((m) => m[1]).join('\n');
  for (const m of constantText.matchAll(/^\s*(\w+)\s+(?:\w+\s+)?=\s*("[^"\n]*"|\d+|(?:u?int\d*)\(\d+\))\s*$/gm)) constants[m[1]] = literal(m[2], {});
  const structs = {};
  for (const m of text.matchAll(/\btype\s+(\w+)\s+struct\s*\{/g)) {
    const start = m.index + m[0].length - 1;
    const body = text.slice(start + 1, closing(text, start));
    structs[m[1]] = Object.fromEntries([...body.matchAll(/(?:^|[\n;])\s*(\w+(?:\s*,\s*\w+)*)\s+(\*?(?:\[\])?[\w.]+)/g)].flatMap((x) => x[1].split(',').map(n=>[n.trim(),x[2]])));
  }
  const aliases = Object.fromEntries([...text.matchAll(/\btype\s+(\w+Params)\s+(?:=\s+)?(\w+Params)\b/g)].map((m) => [m[1], m[2]]));
  const expand = (fn, seen = new Set()) => {
    if (!fn || seen.has(fn)) return '';
    seen.add(fn);
    let body = fn.body;
    for (const m of fn.body.matchAll(/(?:\b(\w+)\s*\(|\b(\w+)\.(\w+)\s*\()/g)) {
      if (m[1]) body += '\n' + expand(fns.find((f) => !f.receiver && f.name === m[1]), seen);
      else {
        const fieldType = structs[fn.receiver]?.[m[2]]?.replace(/^\*/, '');
        const target = m[2] === 'p' ? fn.receiver : fieldType;
        if (target) body += '\n' + expand(fns.find((f) => f.receiver === target && f.name === m[3]), seen);
      }
    }
    // Embedded common/id/pagination encoders invoked as p.field.method().
    for (const m of fn.body.matchAll(/\bp\.(\w+)\.(\w+)\s*\(/g)) {
      const target = structs[fn.receiver]?.[m[1]]?.replace(/^\*/, '');
      body += '\n' + expand(fns.find((f) => f.receiver === target && f.name === m[2]), seen);
    }
    // Named conversion to a shared underlying Params type.
    for (const m of fn.body.matchAll(/(\w+Params)\(p\)\.(\w+)\(/g)) body += '\n' + expand(fns.find((f) => f.receiver === m[1] && f.name === m[2]), seen);
    return body;
  };
  const specs = [];
  for (const contract of domain.contracts) {
    const mapping = mappings.find((m) => m.contract === contract.name);
    if (!mapping) throw new Error('Unmapped ' + contract.name);
    const goMethod = mapping.method.split('.').at(-1);
    const method = goMethod.replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, (s) => s.toLowerCase());
    const fn = fns.find((f) => f.receiver === 'Client' && f.name === goMethod);
    if (!fn && !['QRFlow'].includes(goMethod)) throw new Error('Missing method ' + mapping.method);
    const fixturePath = contract.source_path.replace(/^tests\//, 'testdata/');
    const fixture = json(fixturePath);
    fixture.request ??= fixture.steps?.[0]?.contract?.request;
    if (!fixture.request) throw new Error('No request in ' + contract.name);
    let paramType = mapping.params === 'none' ? undefined : mapping.params.split('.').at(-1);
    const originalParamType = paramType;
    while (aliases[paramType]) paramType = aliases[paramType];
    const encoder = fns.find((f) => f.receiver === paramType && ['EncodeQuery', 'EncodeForm', 'RequestBody'].includes(f.name));
    let expanded = expand(encoder);
    const methodExpanded = expand(fn);
    // Params builders validate on construction; include their validations too.
    const validation = fns.filter((f) => f.receiver === paramType || f.body.includes(`return ${paramType}{`)).map((f) => f.body).join('\n');
    const fields = new Map();
    const add = (key, expression, required) => {
      if (['w_rid', 'wts', 'csrf', 'csrf_token'].includes(key)) return;
      let type = /(?:FormatUint|FormatInt|Itoa|boolValue|boolString)/.test(expression) ? 'integer' : 'string';
      if (/"[01]"/.test(expression) && /p\.\w+/.test(expression)) type = 'boolean';
      const value = literal(expression, constants);
      if (typeof value === 'number') type = 'integer';
      const field = fields.get(key) ?? { name: key, type, required };
      if (value !== undefined && required) { field.default = value; field.required = false; field.fixed = true; }
      if (type === 'integer') field.min = /FormatInt/.test(expression) ? 0 : 0;
      if (/\.String\(\)/.test(expression) && key !== 'bvid' && key !== 'dynamic_id' && !key.includes('dyn')) { field.type = 'integer'; field.min = 1; }
      if (key === 'bvid') field.format = 'bvid';
      if (/\.Format\(time.DateOnly\)/.test(expression)) field.format = 'date';
      if (/\.Format\("2006-01"\)/.test(expression)) field.format = 'month';
      fields.set(key, field);
    };
    // Values literals, followed by Set/Add calls for optional fields.
    for (const m of expanded.matchAll(/"([\w.-]+)"\s*:\s*\{([^{}\n]+)\}/g)) add(m[1], m[2], true);
    for (const m of expanded.matchAll(/\.Set\("([\w.-]+)",\s*([^\n]+)\)/g)) add(m[1], m[2], false);
    for (const m of expanded.matchAll(/singleMIDQuery\("(\w+)"/g)) add(m[1], 'p.mid.String()', true);
    // Dynamic query keys used by shared UID helper.
    for (const m of encoder?.body.matchAll(/singleMIDQuery\("(\w+)"/g) ?? []) add(m[1], 'p.mid.String()', true);
    const querySample = fixture.request.query ?? {};
    const bodySample = fixture.request.body ?? fixture.request.form ?? {};
    for (const [key, val] of Object.entries({ ...querySample, ...(typeof bodySample === 'object' ? bodySample : {}) })) {
      if (!fields.has(key) && !['w_rid', 'wts', 'csrf', 'csrf_token'].includes(key)) {
        add(key, typeof val === 'string' ? 'sample' : '0', !!paramType);
        // A sample establishes a field's existence, never a fixed protocol value.
        delete fields.get(key).fixed;
        delete fields.get(key).default;
      }
    }
    // Locate exact defaults from local effective-value assignments and constructors.
    const localDefaults = {};
    for (const m of expanded.matchAll(/(\w+)\s*=\s*(default\w+|"[^"\n]*"|\d+)/g)) {
      const val = literal(m[2], constants); if (val !== undefined) localDefaults[m[1]] = val;
    }
    const constructor = fns.find((f) => !f.receiver && f.name === `New${paramType}`);
    for (const [fieldName, field] of fields) {
      const emissions = [...expanded.matchAll(new RegExp(`(?:"${fieldName}"\\s*:\\s*\\{([^}]+)\\}|\\.Set\\("${fieldName}",\\s*([^\\n]+)\\))`, 'g'))].map((m) => m[1] ?? m[2]);
      for (const expr of emissions) {
        const privateName = expr.match(/p\.(\w+)/)?.[1];
        const local = expr.match(/^(\w+)$/)?.[1] ?? expr.match(/uint\d*\((\w+)\)/)?.[1];
        if (local && localDefaults[local] !== undefined) { field.default = localDefaults[local]; field.required = false; }
        const findType = (struct,name,seen=new Set()) => {
          if(seen.has(struct))return;seen.add(struct);
          if(structs[struct]?.[name])return structs[struct][name];
          for(const type of Object.values(structs[struct]??{})) {const found=findType(type.replace(/^\*/,''),name,seen);if(found)return found;}
        };
        let declared = findType(paramType,privateName);
        if(!declared&&local) {
          const assigned=expanded.match(new RegExp(`\\b${local}\\s*:?=\\s*p\\.(\\w+)`));
          if(assigned)declared=findType(paramType,assigned[1]);
        }
        if(declared) {
          const declaredName = declared.replace(/^\*/, '').replaceAll('.', '\\.');
          const underlying=text.match(new RegExp(`\\btype\\s+${declaredName}\\s+(u?int\\d+)`))?.[1]??declared.replace(/^\*/,'');
          const width=underlying.match(/^(u?)int(8|16|32|64)$/);
          if(width && field.type==='integer') {
            field.max=(2n**BigInt(Number(width[2])-(width[1]?0:1))-1n).toString();
          }
        }
        if (declared?.includes('bool')) field.type = 'boolean';
        if(/FormatBool/.test(expr)) field.booleanEncoding='literal';
        if (constructor && privateName) {
          const init = constructor.body.match(new RegExp(`\\b${privateName}:\\s*("[^"\\n]*"|\\w+|\\d+)`));
          const val = init ? literal(init[1], constants) : undefined;
          if (val !== undefined) { field.default = val; field.required = false; }
        }
      }
      const errors = [...validation.matchAll(new RegExp(`Field:\\s*"${fieldName}"[^}]*Message:\\s*"([^"]+)"`, 'g'))].map((m) => m[1]);
      for (const error of errors) {
        if (/non-zero|at least 1|greater than zero|between 1 and/.test(error) && field.type === 'integer') field.min = 1;
        const range = error.match(/between (\d+) and (\d+)/); if (range && field.type === 'integer') { field.min = +range[1]; field.max = +range[2]; }
      }
    }
    // Effective fixed query defaults from no-params domain methods.
    if (!paramType) for (const m of methodExpanded.matchAll(/"([\w.-]+)"\s*:\s*\{"([^"\n]*)"\}/g)) {
      fields.set(m[1], { name: m[1], type: 'string', required: false, default: m[2] });
    }
    const request = fixture.request;
    const format = /NewJSONRequest/.test(methodExpanded) ? 'json' : /NewFormRequest/.test(methodExpanded) ? 'form' : undefined;
    const body = fn?.body ?? '';
    const wbi = /WBI/.test(body) || /sendLivePayload/.test(body) && /, true\)/.test(body) || /sendDanmakuRaw/.test(body) && /, true\)/.test(body);
    let mode = 'payload';
    if (mapping.model === '[]byte') mode = 'raw';
    if (/SendOptionalPayload|IntoOptionalPayload/.test(body)) mode = 'optional';
    if (/IntoData/.test(body)) mode = 'data';
    if (name === 'search' && method === 'hotWords') mode = 'json';
    if (mapping.model === 'danmaku.XML') mode = 'xml';
    specs.push({ contract: contract.name, domain: name, accessor: mapping.domain_accessor.split('.').at(-1).replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, (s) => s.toLowerCase()), method, goMethod, paramType: originalParamType, model: mapping.model, url: request.url, httpMethod: request.method, ...(format && { bodyType: format }), wbi, mode, fields: [...fields.values()], fixture: fixturePath.replace(/^testdata\//, ''), ...( /EncodeQuery\(csrf\)|optionalLiveCSRF|EncodeForm\(optionalLiveCSRF/.test(body) ? { csrf: 'optional' } : {} ) });
  }
  domains.push({ name, specs });
}
mkdirSync('scripts/upstream', { recursive: true });
writeFileSync('scripts/upstream/domains.json', JSON.stringify(domains, null, 2) + '\n');
cpSync(join(upstream, 'testdata/contracts'), 'tests/fixtures/contracts', { recursive: true });
cpSync(join(upstream, 'LICENSE'), 'LICENSE');
writeFileSync('scripts/upstream/provenance.json', JSON.stringify({ repository: 'https://github.com/Yuelioi/bpi-go', commit: 'add0ff775ef4caff2203d169d15e0d9afe9fb996', contracts: mappings.length, domains: domains.length }, null, 2) + '\n');
console.log(`Extracted ${domains.length} domains and ${mappings.length} contracts`);
console.log(domains.flatMap((d) => d.specs).filter((s) => s.paramType && !s.fields.length).map((s) => `${s.contract}: no fields`).join('\n'));
