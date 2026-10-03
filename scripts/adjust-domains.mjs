// Audited protocol decisions that cannot be inferred from Go query literals.
import { readFileSync, writeFileSync } from 'node:fs';
const domains = JSON.parse(readFileSync('scripts/upstream/domains.json', 'utf8'));
const specs = domains.flatMap((d) => d.specs);
const select = (name) => { name = name.replace(/^videoranking\./, 'video_ranking.'); const s = specs.find((s) => s.contract === name); if (!s) throw new Error(name); return s; };
function set(name, key, patch) {
  const spec = select(name);
  let field = spec.fields.find((f) => f.name === key);
  if (!field) { field = { name: key, type: 'string', required: false }; spec.fields.push(field); }
  Object.assign(field, patch);
}
function defaults(name, values) {
  for (const [key, value] of Object.entries(values)) {
    const type = typeof value === 'number' ? 'integer' : typeof value;
    set(name, key, { default: value, required: false, type });
  }
}
const stringNames = new Set(['bvid','features','offset','update_baseline','ids','uids','names','resources','hb','qrcode_key','keyword','term','platform','mobi_app','spmid','visit_id','web_location','jsonp','version','buvid','share_channel','share_id','order','order_type','business','type']);
for (const spec of specs) {
  for (const field of spec.fields) {
    if (stringNames.has(field.name) && !['type'].includes(field.name)) field.type = 'string';
    if (['aid','avid','cid','oid','id','mid','uid','up_mid','host_mid','vmid','target_id','root','room_id','roomid','ruid','anchor_id','media_id','season_id','ep_id','series_id','note_id','cvid','gift_id','business_id','list_id','number','resource_id','region_id','cate_id','tag_id'].includes(field.name)) { field.type = 'integer'; field.min = 1; }
    if (['pn','ps','page','page_size','page_num','pageSize','pageNum','pagesize','currentPage'].includes(field.name)) { field.type = 'integer'; field.min = 1; }
    if (field.default !== undefined && field.type === 'integer' && typeof field.default === 'string' && /^\d+$/.test(field.default)) field.default = Number(field.default);
    if (field.format === 'bvid') { field.type = 'string'; delete field.min; }
  }
  if (spec.domain === 'video' && spec.fields.some((f) => f.name === 'aid') && spec.fields.some((f) => f.name === 'bvid')) {
    spec.videoIdentifier = true;
    for (const field of spec.fields.filter((f) => ['aid','bvid','avid'].includes(f.name))) field.required = false;
    if (spec.method === 'playURL') { spec.aidKey = 'avid'; spec.fields = spec.fields.filter((f) => f.name !== 'avid'); }
  }
  if (spec.domain === 'search' && spec.fields.some((f) => f.name === 'search_type')) {
    defaults(spec.contract, { search_type: {article:'article',bangumi:'media_bangumi',users:'bili_user',live:'live',liveRooms:'live_room',liveUsers:'live_user',movies:'media_ft',videos:'video'}[spec.method], page: 1 });
  }
  if (['audio.rank_period','audio.rank_detail','audio.rank_music_list'].includes(spec.contract)) spec.csrf = 'optional';
}
defaults('activity.list', { mold: 0, http: 3 });
defaults('audio.stream_url_web', { quality: 2 });
defaults('bangumi.timeline', { types: 1, before: 6, after: 6 });
for (const k of ['types','before','after']) set('bangumi.timeline', k, {type:'integer', min:0});
set('bangumi.timeline','types',{min:1,max:5});
set('bangumi.timeline','types',{enum:[1,3,4]});
defaults('bangumi.playurl', { fnver:0 });
select('bangumi.playurl').oneOf = ['ep_id','cid'];
for (const k of ['ep_id','cid']) set('bangumi.playurl',k,{required:false});
set('clientinfo.ip','ip',{required:false,type:'string',format:'ip'});
defaults('dynamic.feed_banner', { web_location:'333.1365' });
// The local encoder variable has two branches, rather than a fixed literal.
set('dynamic.up_users', 'teenagers_mode', { type:'boolean', default:false, required:false, fixed:false });
defaults('live.danmu_info', { type:0 });
for (const name of ['live.follow_up_list','live.follow_up_web_list']) delete select(name).fields.find(f=>f.name==='hit_ab').default;
defaults('message.reply_feed',{web_location:''});
defaults('message.single_unread',{show_dustbin:false,show_unfollow_list:false,unread_type:0});
set('message.single_unread','unread_type',{type:'integer',min:0});
for (const k of ['show_dustbin','show_unfollow_list']) set('message.single_unread',k,{type:'boolean'});
defaults('misc.b23tv.short_link',{build:6114514});
select('misc.bili_ticket').fields = [];
select('misc.bili_ticket').ticket = true;
defaults('manga.coupons',{pageNum:1,pageSize:20,notExpired:true,tabType:1,type:0});
set('manga.coupons','pageSize',{max:100});
set('manga.coupons','notExpired',{type:'boolean'});
for(const k of ['tabType','type']) set('manga.coupons',k,{type:'integer',min:0});
defaults('note.public_archive_list',{pn:1,ps:10,oid_type:0});
set('note.public_archive_list','oid',{required:true});
defaults('opus.space_feed',{page:0,type:'all',web_location:'333.1387'});
set('opus.space_feed','page',{min:0});
set('opus.space_feed','type',{type:'string',enum:['all','article','dynamic']});
delete select('user.card').fields.find(f=>f.name==='photo').default;
set('user.card','photo',{type:'boolean'});
defaults('user.uploaded_videos',{tid:0});
set('user.uploaded_videos','tid',{min:0});
for (const name of ['video.player_info_v2','video.ai_summary','video.online_total']) set(name,'cid',{required:true});
set('video.ai_summary','up_mid',{required:true});
set('video.interactive_video_info','graph_version',{required:true,type:'integer',min:1});
defaults('video.homepage_recommendations',{fresh_idx:1,fresh_idx_1h:1,brush:1});
set('video.homepage_recommendations','ps',{max:30});
for (const k of ['fresh_idx','fresh_idx_1h','brush']) set('video.homepage_recommendations',k,{type:'integer',min:1});
defaults('video.collection.seasons_series_list',{page_num:1,page_size:20});
for (const key of ['pn','ps','only_normal','sort']) {
  const field = select('video.collection.series_archives').fields.find(f=>f.name===key);
  delete field.default; field.required=false;
}
set('video.collection.series_archives','only_normal',{type:'boolean'});
defaults('video.collection.seasons_archives_list',{page_num:1,page_size:20});
defaults('video.collection.home_seasons_series',{page_num:1,page_size:20});
for(const name of ['videoranking.popular_list','videoranking.ranking_list','videoranking.region_dynamic','videoranking.region_tag_dynamic','videoranking.region_newlist']) {
  for(const f of select(name).fields) if(['pn','ps','rid','type'].includes(f.name)) {delete f.default;f.required=false;}
  if(name.includes('region_')) set(name,'rid',{type:'integer',required:true,min:1});
}
set('videoranking.region_tag_dynamic','tag_id',{type:'integer',required:true,min:1});
defaults('vip.center_info',{build:0});
select('wallet.info').fields = [
  {name:'platformType',type:'integer',required:false,default:3,min:1},
  {name:'timestamp',type:'integer',required:true,min:1},
  {name:'traceId',type:'integer',required:false,min:1},
  {name:'version',type:'string',required:false,default:'1.0'},
];
select('wallet.info').csrf = 'required';
for (const s of specs.filter((s) => s.domain === 'danmaku')) {
  if (s.fields.find((f) => f.name === 'date')) set(s.contract,'date',{format:'date'});
  if (s.fields.find((f) => f.name === 'month')) set(s.contract,'month',{format:'month'});
  for (const k of ['type','segment_index','pull_mode','ps','pe']) if (s.fields.find((f)=>f.name===k)) set(s.contract,k,{type:'integer',min:['ps','pe','pull_mode'].includes(k)?0:1});
}
for(const s of specs.filter((s)=>s.domain==='search')) {
  for (const k of ['order_sort','user_type','duration','category_id','tids']) if(s.fields.find(f=>f.name===k)) set(s.contract,k,{type:'integer',min:0});
  if(s.fields.find(f=>f.name==='order_sort')) set(s.contract,'order_sort',{max:1});
  if(s.fields.find(f=>f.name==='user_type')) set(s.contract,'user_type',{max:3});
  if(s.fields.find(f=>f.name==='duration')) set(s.contract,'duration',{max:4});
}
for(const s of specs.filter(s=>s.domain==='comment')) {
  if(s.fields.find(f=>f.name==='ps')) set(s.contract,'ps',{max:20});
  if(s.fields.find(f=>f.name==='root')) set(s.contract,'root',{required:true});
  if(s.fields.find(f=>f.name==='sort')) set(s.contract,'sort',{type:'integer',min:0,max:2});
}
select('danmaku.xml.comment_xml').pathID = 'oid';
select('login.qr.flow').special = 'qrFlow';
select('login.qr_poll').special = 'pollQR';
select('login.captcha_generate').transform = 'captcha';
select('misc.b23tv.short_link').transform = 'shortLink';
for (const name of ['live.banned_users','live.shield_keywords','live.silent_users']) select(name).roomHeaders = 'room_id';
set('live.banned_users','room_id',{type:'integer',required:true,min:1});
select('live.banned_users').headerOnly = ['room_id'];
for(const name of ['live.shield_keywords','live.silent_users']) select(name).csrfBoth = true;
select('live.banned_users').csrfBoth = true;
// Specific helpers encode these numeric flags as literal 0/1, never true/false.
for(const s of specs) for(const f of s.fields) if(['nohot','fourk','high_quality','try_look','need_elec','sort_reverse','ignoreRecord','hit_ab'].includes(f.name)) f.type='boolean';
for(const s of specs) for(const f of s.fields) if(['photo','sort_reverse','only_normal','hit_ab'].includes(f.name)) f.booleanEncoding='literal';
set('danmaku.snapshot','aid',{type:'string',format:'bvid'});
// Additional source parity checks cover omitted values, enum bounds and fixed fields.
defaults('web_widget.header_page',{resource_id:142});
defaults('user.bangumi_follow_list',{type:1});
set('user.bangumi_follow_list','type',{type:'integer',enum:[1,2]});
set('user.bangumi_follow_list','ps',{max:30});
for(const name of ['audio.stream_url','audio.stream_url_web']) set(name,'quality',{type:'integer',min:0,max:3});
set('creativecenter.statistics.video_trend','type',{type:'integer',min:1,max:8});
set('creativecenter.statistics.article_trend','type',{type:'integer',min:1,max:6});
set('search.article','category_id',{enum:[0,1,2,3,16,17,28,29]});
for(const name of ['search.article','search.video','search.live_room']) set(name,'order',{enum:['totalrank','click','pubdate','dm','stow','scores','attention','online','live_time','0','fans','level']});
set('user.uploaded_videos','order',{enum:['pubdate','click','stow']});
set('video.collection.series_archives','sort',{enum:['asc','desc']});
set('video_ranking.ranking_list','type',{type:'string',enum:['all','rookie','origin']});
set('video_ranking.region_newlist_rank','order',{enum:['click','scores','pubdate']});
for(const s of specs.filter(s=>s.domain==='comment')) {
  set(s.contract,'type',{type:'integer',min:1,max:'2147483647'});
  for(const key of ['oid','root']) if(s.fields.find(f=>f.name===key)) set(s.contract,key,{max:'9223372036854775807'});
  if(s.method!=='list'&&s.fields.find(f=>f.name==='ps')) set(s.contract,'ps',{max:'4294967295'});
}
for(const key of ['t','size']) set('creativecenter.statistics.archive_compare',key,{type:'integer',min:1});
set('fav.created_list','rid',{min:1});
for(const key of ['quality','qn']) set('live.stream',key,{type:'integer',min:1,max:'4294967295'});
for(const key of ['area_parent_id','area_id']) set('live.room_gift_list',key,{type:'integer',min:1,max:'4294967295'});
set('live.guard_list','typ',{type:'integer',min:1,max:'4294967295'});
for(const name of ['bangumi.playurl','cheese.playurl']) {select(name).deriveFourK=true;set(name,'fnver',{fixed:true,default:0});}
for(const s of specs) for(const f of s.fields) {
  if(['search_type','oid_type'].includes(f.name)) f.fixed=true;
  if(['keyword','term'].includes(f.name)) f.trim=true;
}
for(const key of ['notExpired','tabType','type']) set('manga.coupons',key,{fixed:true});
for(const key of ['timestamp','traceId']) set('wallet.info',key,{max:'9223372036854775807'});
for(const s of specs.filter(s=>s.domain==='danmaku')) {
  for(const key of ['segment_index','pull_mode','ps','pe']) if(s.fields.find(f=>f.name===key)) set(s.contract,key,{max:'4294967295'});
  if(s.fields.find(f=>f.name==='type')) set(s.contract,'type',{max:255});
}
set('live.danmu_info','type',{type:'integer',max:255});
writeFileSync('scripts/upstream/domains.json', JSON.stringify(domains,null,2)+'\n');
console.log('Applied audited source adjustments');
