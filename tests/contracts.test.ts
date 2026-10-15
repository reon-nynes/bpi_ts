import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Client } from '../src/index.js';
import { endpoints } from '../src/internal/catalog.js';

interface Contract {
  name: string;
  request?: { url:string;method:string;query?:Record<string,string>;form?:Record<string,string>;body?:Record<string,unknown>;required_headers?:string[];headers?:Record<string,string> };
  cases?: {name:string;response:{fixture?:string;http_status?:number;api_code?:number|string;api_code_text?:string;error?:string}}[];
}
const fixtureRoot = join(process.cwd(),'tests','fixtures');
const load = (path:string) => JSON.parse(readFileSync(join(fixtureRoot,path),'utf8')) as Contract;
const replace = (value: unknown) => value === '${csrf}' || value === '{{csrf}}' ? 'test-csrf' : value;
const nav = {code:0,data:{wbi_img:{img_url:'https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png',sub_url:'https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png'}}};

describe('complete upstream API coverage', () => {
  it('exposes all 27 domains and 209 promoted operations', () => {
    const client = new Client();
    expect(new Set(endpoints.map(s=>s.domain)).size).toBe(27);
    expect(endpoints.length).toBe(209);
    for(const spec of endpoints) {
      const domain = (client as unknown as Record<string,Record<string,unknown>>)[spec.accessor];
      expect(typeof domain?.[spec.method],spec.contract).toBe('function');
    }
  });
});

for(const spec of endpoints) {
  const contract = load(spec.fixture);
  if(!contract.request) continue; // The QR composition has explicit protocol tests.
  for(const scenario of contract.cases ?? []) {
    if(!scenario.response.fixture) continue;
    it(`${spec.contract}: ${scenario.name}`, async () => {
      const reference = contract.request!;
      const path = join(fixtureRoot,dirname(spec.fixture),scenario.response.fixture!);
      const text = readFileSync(path,'utf8');
      const fixture = JSON.parse(text) as Record<string,unknown>;
      const bytes = typeof fixture.body_base64==='string' ? Buffer.from(fixture.body_base64,'base64') : Buffer.from(text);
      let captured: Request | undefined;
      const client = new Client({
        cookie:'DedeUserID=1; SESSDATA=test-session; bili_jct=test-csrf; buvid3=test-buvid',
        now:()=>new Date('2026-10-03T12:00:00Z'),
        fetch: async (input,init) => {
          const request = new Request(input,init);
          if(spec.wbi && new URL(request.url).pathname==='/x/web-interface/nav') return new Response(JSON.stringify(nav));
          captured = request;
          return new Response(bytes,{status:scenario.response.http_status ?? 200});
        },
      });
      const raw = {...reference.query,...reference.form,...reference.body};
      const params:Record<string,unknown> = {};
      for(const [key,value] of Object.entries(raw)) if(!['csrf','csrf_token','wts','w_rid'].includes(key)) params[key]=value;
      if(spec.pathID) params[spec.pathID] = new URL(reference.url).pathname.slice(1,-4);
      if(spec.headerOnly?.includes('room_id')) params.room_id=new URL(reference.headers!.referer!).pathname.slice(1);
      if(spec.ticket) for(const key of Object.keys(params)) delete params[key];
      if(spec.aidKey && params[spec.aidKey]!==undefined) {params.aid=params[spec.aidKey];delete params[spec.aidKey];}
      if(spec.special==='privateSend') {
        for(const key of Object.keys(params)) delete params[key];
        params.receiver_id=reference.form!['msg[receiver_id]'];
        params.receiver_type=Number(reference.form!['msg[receiver_type]']);
        params.text=(JSON.parse(reference.form!['msg[content]']!) as {content:string}).content;
      }
      const domain = (client as unknown as Record<string,Record<string,(...args:unknown[])=>Promise<unknown>>>)[spec.accessor]!;
      let result:unknown,error:unknown;
      try { result=await domain[spec.method]!(...(spec.paramType?[params]:[])); } catch(e) {error=e;}
      expect(captured, error instanceof Error ? error.message : spec.contract).toBeDefined();
      const request = captured!;
      const actual = new URL(request.url);
      const wanted = new URL(reference.url);
      expect(actual.origin+actual.pathname).toBe(wanted.origin+wanted.pathname);
      expect(request.method).toBe(reference.method);
      const form=reference.form ? new URLSearchParams(await request.text()) : undefined;
      const expected = (key:string,value:unknown) => {
        if(spec.special==='privateSend') {
          if(['w_sender_uid','msg[sender_uid]'].includes(key)) return '1';
          if(['w_dev_id','msg[dev_id]'].includes(key)) return form!.get('msg[dev_id]');
          if(key==='msg[timestamp]') return String(new Date('2026-10-03T12:00:00Z').getTime()/1000);
        }
        return String(replace(value));
      };
      for(const header of reference.required_headers ?? []) expect(request.headers.has(header),header).toBe(true);
      for(const [header,value] of Object.entries(reference.headers ?? {})) expect(request.headers.get(header)).toBe(value);
      for(const [key,value] of Object.entries(reference.query ?? {})) {
        if(['w_rid','wts','hexsign','context[ts]'].includes(key)||spec.ticket) continue;
        expect(actual.searchParams.get(key),key).toBe(expected(key,value));
      }
      if(reference.form) {
        for(const [key,value] of Object.entries(reference.form)) expect(form!.get(key),key).toBe(expected(key,value));
      }
      if(reference.body) {
        const body=await request.json() as Record<string,unknown>;
        for(const [key,value] of Object.entries(reference.body)) expect(body[key],key).toEqual(replace(value));
      }
      if(spec.wbi) expect(actual.searchParams.get('w_rid')).toMatch(/^[a-f0-9]{32}$/);
      const code=fixture.code ?? fixture.errno ?? 0;
      const missing = spec.mode==='payload' && !Object.hasOwn(fixture,'body_base64') && (fixture.data??fixture.result)==null;
      const failed = (scenario.response.http_status ?? 200)>=400 || code!==0 || missing || !!scenario.response.error && scenario.response.error!=='missing_model_fields';
      if(failed && spec.special!=='pollQR') expect(error).toBeDefined();
      else {
        expect(error).toBeUndefined();
        if(spec.mode==='raw') expect(result).toEqual(new Uint8Array(bytes));
        else if(spec.mode==='xml') expect((result as {comments:unknown[]}).comments.length).toBeGreaterThan(0);
        else if(spec.mode==='optional' && (fixture.data??fixture.result)==null) expect(result).toBeUndefined();
        else expect(result).toBeDefined();
      }
    });
  }
}
