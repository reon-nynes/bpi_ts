import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const domains = JSON.parse(readFileSync('scripts/upstream/domains.json','utf8'));
const { commit } = JSON.parse(readFileSync('scripts/upstream/provenance.json','utf8'));
const modelType = (value) => {
  value = value.replace(/^\*/, '');
  if (value === '[]byte') return 'Uint8Array';
  if (value.startsWith('[]')) return `Array<${modelType(value.slice(2))}>`;
  if (value === 'string') return 'string';
  if (/^(u?int\d*|float\d*)$/.test(value)) return 'number';
  if (value === 'bool') return 'boolean';
  const generic = value.indexOf('[');
  if (generic !== -1) return `${modelType(value.slice(0,generic))}<${modelType(value.slice(generic+1,-1))}>`;
  return 'Models.' + value.split('.').at(-1);
};
const classes = [];
for(const domain of domains) {
  const className = domain.specs[0].goMethod && domain.specs[0].accessor[0].toUpperCase()+domain.specs[0].accessor.slice(1)+'Client';
  classes.push({name:domain.name,className,accessor:domain.specs[0].accessor});
  mkdirSync(`src/${domain.name}`,{recursive:true});
  const params = new Map();
  for(const spec of domain.specs) if(spec.paramType && spec.special !== 'privateSend') {
    const existing = params.get(spec.paramType);
    if(existing) {
      for(const f of spec.fields) if(!existing.fields.find(p=>p.name===f.name)) existing.fields.push({...f});
    } else params.set(spec.paramType,structuredClone(spec));
  }
  let parameterText = `// API wire parameter names; derived from the pinned bpi-go encoders.\nimport type { IntegerInput } from '../internal/domain.js';\nexport type { IntegerInput } from '../internal/domain.js';\n`;
  if(domain.name==='video') parameterText += `\nexport type VideoIdentifier = { aid: IntegerInput; bvid?: never } | { bvid: string; aid?: never };\n`;
  if(domain.name==='message') parameterText += `\nexport type { SendParams, SendImage } from './private.js';\n`;
  for(const [name,spec] of params) {
    const fields = spec.fields.filter(f=>!spec.videoIdentifier||!['aid','bvid'].includes(f.name));
    const body = fields.map(f=>`  ${JSON.stringify(f.name)}${f.required && f.default===undefined?'':'?'}: ${f.fixed&&f.default!==undefined?JSON.stringify(f.default):f.enum?f.enum.map(v=>JSON.stringify(v)).join(' | '):f.type==='integer'?'IntegerInput':f.type==='boolean'?"boolean | 0 | 1 | '0' | '1'":'string'};`).join('\n');
    parameterText += `\n/** Parameters for ${spec.contract}. */\nexport ${spec.videoIdentifier?'type':'interface'} ${name}${spec.videoIdentifier?' = VideoIdentifier &':''} {\n${body}\n}${spec.videoIdentifier?';':''}\n`;
  }
  writeFileSync(`src/${domain.name}/params.ts`,parameterText);
  const login = domain.name==='login';
  let text = `// Endpoint methods ported from bpi-go ${commit}.\nimport { DomainClient, type CallOptions } from '../internal/domain.js';\nimport type * as Models from './models.js';\nimport { normalizePayload } from './models.js';\nimport type * as Params from './params.js';\nexport * from './models.js';\nexport * from './params.js';\n`;
  if(login) text += `import { LoginFlows } from './flows.js';\nimport type { CoreClient } from '../client/index.js';\nexport * from './flows.js';\n`;
  if(domain.name==='danmaku') text += `export { parseDeflateXML } from './xml.js';\n`;
  if(domain.name==='message') text += `import { MessageFlows } from './private.js';\n`;
  text += `\nexport class ${className} extends ${login?'LoginFlows':domain.name==='message'?'MessageFlows':'DomainClient'} {\n`;
  if(login) text += `  private readonly domain: LoginDomain;\n  constructor(core: CoreClient) { super(core); this.domain = new LoginDomain(core); }\n`;
  for(const s of domain.specs) {
    if(s.special) continue;
    const allOptional = !s.videoIdentifier && s.fields.every(f=>!f.required||f.default!==undefined);
    const param = s.paramType ? `params: Params.${s.paramType}${allOptional?' = {}':''}, `:'';
    const returns = modelType(s.model)+(s.mode==='optional'?' | undefined':'');
    text += `\n  /** ${s.contract} */\n  ${s.method}(${param}options: CallOptions = {}): Promise<${returns}> {\n    return this.${login?'domain.call':'invoke'}<${returns}>(${JSON.stringify(s.contract)}, ${s.paramType?'params':'{}'}, options, normalizePayload);\n  }\n`;
  }
  if(domain.name==='activity') text += `\n  listDefault(options: CallOptions = {}): Promise<Models.ListPage> { return this.list({},options); }\n`;
  if(domain.name==='misc') text += `\n  async biliTicketString(options: CallOptions = {}): Promise<string> { return (await this.biliTicket(options)).ticket; }\n`;
  text += '}\n';
  if(login) text += `\nclass LoginDomain extends DomainClient {\n  call<T>(contract: string,params:object,options:CallOptions,normalize:(model:string,payload:unknown)=>unknown):Promise<T> { return this.invoke(contract,params,options,normalize); }\n}\n`;
  writeFileSync(`src/${domain.name}/index.ts`,text);
}
mkdirSync('src/internal',{recursive:true});
writeFileSync('src/internal/catalog.ts',`// Generated from scripts/upstream/domains.json.\nimport type { EndpointSpec } from './domain.js';\nexport const endpoints: readonly EndpointSpec[] = ${JSON.stringify(domains.flatMap(d=>d.specs),null,2)};\n`);
let root = `import { CoreClient, type ClientOptions } from './client/index.js';\nexport * from './client/index.js';\nexport * as ids from './ids/index.js';\nexport type { CallOptions, IntegerInput } from './internal/domain.js';\n`;
for(const c of classes) root += `import { ${c.className} } from './${c.name}/index.js';\nexport { ${c.className} } from './${c.name}/index.js';\nexport * as ${c.accessor} from './${c.name}/index.js';\n`;
root += `\n/** Root SDK. All domain views share this client's isolated session and transport. */\nexport class Client extends CoreClient {\n`;
for(const c of classes) root += `  readonly ${c.accessor}: ${c.className};\n`;
root += `\n  constructor(options: ClientOptions = {}) {\n    super(options);\n`;
for(const c of classes) root += `    this.${c.accessor} = new ${c.className}(this);\n`;
root += `  }\n}\n\nexport function createClient(options: ClientOptions = {}): Client { return new Client(options); }\n`;
writeFileSync('src/index.ts',root);
const docs = ['# API coverage','', `Ported from bpi-go commit \`${commit}\`.`, '', '| Contract | TypeScript method | Parameters | Response |','| --- | --- | --- | --- |'];
for(const d of domains) for(const s of d.specs) docs.push(`| ${s.contract} | client.${s.accessor}.${s.method} | ${s.paramType??'none'} | ${s.model} |`);
writeFileSync('docs/api.md',docs.join('\n')+'\n');
console.log(`Generated ${classes.length} domain clients with ${domains.flatMap(d=>d.specs).length} mapped methods.`);
