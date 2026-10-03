import { describe,it,expect } from 'vitest';
import { Client,ParameterError } from '../src/index.js';

describe('upstream omitted fields and constructor defaults',()=>{
  it('omits optional ranking, collection, card and live query fields',async()=>{
    const requests:URL[]=[];
    const client=new Client({fetch:async(input,init)=>{
      requests.push(new URL(new Request(input,init).url));
      return new Response('{"code":0,"data":{}}');
    }});
    // Payload shape is immaterial here; assertions exercise the serialized request.
    const calls=[
      ()=>client.videoRanking.popularList(),
      ()=>client.videoRanking.rankingList(),
      ()=>client.video.seriesArchives({mid:1,series_id:2}),
      ()=>client.user.card({mid:1}),
      ()=>client.live.followUpList(),
      ()=>client.live.followUpWebList(),
    ];
    for(const call of calls) try{await call();}catch{ /* empty fake model may reject */ }
    expect(requests.map(url=>Object.fromEntries(url.searchParams))).toEqual([
      {},{},{mid:'1',series_id:'2'},{mid:'1'},{},{},
    ]);
  });

  it('rejects unsupported timeline types and missing region identifiers',async()=>{
    let calls=0;
    const client=new Client({fetch:async()=>{calls++;return new Response('{"code":0,"data":[]}');}});
    await expect(client.bangumi.timeline({types:2} as never)).rejects.toBeInstanceOf(ParameterError);
    await expect(client.videoRanking.regionDynamic({} as never)).rejects.toBeInstanceOf(ParameterError);
    await expect(client.videoRanking.regionTagDynamic({rid:1} as never)).rejects.toBeInstanceOf(ParameterError);
    expect(calls).toBe(0);
  });

  it('uses the dynamic teenager-mode default and encodes its enabled branch',async()=>{
    const queries:Record<string,string>[]=[];
    const client=new Client({fetch:async(input,init)=>{
      queries.push(Object.fromEntries(new URL(new Request(input,init).url).searchParams));
      return new Response('{"code":0,"data":{}}');
    }});
    await client.dynamic.upUsers();
    await client.dynamic.upUsers({teenagers_mode:true});
    expect(queries).toEqual([{teenagers_mode:'0'},{teenagers_mode:'1'}]);
  });

  it('derives bangumi fourk from the DASH fnval flag and uses numeric fnver zero',async()=>{
    const queries:Record<string,string>[]=[];
    const client=new Client({fetch:async(input,init)=>{
      queries.push(Object.fromEntries(new URL(new Request(input,init).url).searchParams));
      return new Response('{"code":0,"data":{}}');
    }});
    await client.bangumi.playURL({ep_id:1,fnval:128});
    await client.bangumi.playURL({cid:2,fnval:16,fourk:true});
    expect(queries[0]).toMatchObject({ep_id:'1',fnver:'0',fnval:'128',fourk:'1'});
    expect(queries[1]).toMatchObject({cid:'2',fnver:'0',fnval:'16'});
    expect(queries[1]).not.toHaveProperty('fourk');
  });

  it('defaults absent captcha fields through the source payload model',async()=>{
    const client=new Client({fetch:async()=>new Response('{"code":0,"data":{}}')});
    await expect(client.login.generateCaptcha()).resolves.toEqual({token:'',gt:'',challenge:''});
  });

  it('rejects fixed protocol overrides and source integer overflows before fetching',async()=>{
    let calls=0;
    const client=new Client({fetch:async()=>{calls++;return new Response('{"code":0,"data":{}}');}});
    const cases=[
      ()=>client.manga.coupons({notExpired:false} as never),
      ()=>client.bangumi.playURL({ep_id:1,fnver:1} as never),
      ()=>client.activity.list({pn:4294967296n}),
      ()=>client.comment.hot({type:2147483648n,oid:1,root:1}),
      ()=>client.comment.hot({type:1,oid:9223372036854775808n,root:1}),
    ];
    for(const call of cases) await expect(call()).rejects.toBeInstanceOf(ParameterError);
    expect(calls).toBe(0);
  });

  it('accepts large hot-comment page sizes while enforcing list page size bounds',async()=>{
    let query:URLSearchParams|undefined;
    const client=new Client({fetch:async(input,init)=>{
      query=new URL(new Request(input,init).url).searchParams;
      return new Response('{"code":0,"data":{}}');
    }});
    await client.comment.hot({type:1,oid:1,root:1,ps:21});
    expect(query?.get('ps')).toBe('21');
    await expect(client.comment.list({type:1,oid:1,ps:21})).rejects.toBeInstanceOf(ParameterError);
  });
});
