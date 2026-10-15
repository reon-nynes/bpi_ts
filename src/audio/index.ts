// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class AudioClient extends DomainClient {

  /** audio.coin_count */
  coinCount(params: Params.SongParams, options: CallOptions = {}): Promise<number> {
    return this.invoke<number>("audio.coin_count", params, options, normalizePayload);
  }

  /** audio.collection_info */
  collectionInfo(params: Params.CollectionInfoParams, options: CallOptions = {}): Promise<Models.Collection> {
    return this.invoke<Models.Collection>("audio.collection_info", params, options, normalizePayload);
  }

  /** audio.collection_status */
  collectionStatus(params: Params.SongParams, options: CallOptions = {}): Promise<boolean> {
    return this.invoke<boolean>("audio.collection_status", params, options, normalizePayload);
  }

  /** audio.collections_list */
  collectionsList(params: Params.PageParams, options: CallOptions = {}): Promise<Models.Page<Models.Collection>> {
    return this.invoke<Models.Page<Models.Collection>>("audio.collections_list", params, options, normalizePayload);
  }

  /** audio.hot_menu */
  hotMenu(params: Params.PageParams, options: CallOptions = {}): Promise<Models.Page<Models.HotMenu>> {
    return this.invoke<Models.Page<Models.HotMenu>>("audio.hot_menu", params, options, normalizePayload);
  }

  /** audio.info */
  info(params: Params.SongParams, options: CallOptions = {}): Promise<Models.Info> {
    return this.invoke<Models.Info>("audio.info", params, options, normalizePayload);
  }

  /** audio.lyric */
  lyric(params: Params.SongParams, options: CallOptions = {}): Promise<string> {
    return this.invoke<string>("audio.lyric", params, options, normalizePayload);
  }

  /** audio.members */
  members(params: Params.SongParams, options: CallOptions = {}): Promise<Array<Models.MemberGroup>> {
    return this.invoke<Array<Models.MemberGroup>>("audio.members", params, options, normalizePayload);
  }

  /** audio.rank_detail */
  rankDetail(params: Params.RankListParams, options: CallOptions = {}): Promise<Models.RankDetail> {
    return this.invoke<Models.RankDetail>("audio.rank_detail", params, options, normalizePayload);
  }

  /** audio.rank_menu */
  rankMenu(params: Params.PageParams, options: CallOptions = {}): Promise<Models.Page<Models.RankMenu>> {
    return this.invoke<Models.Page<Models.RankMenu>>("audio.rank_menu", params, options, normalizePayload);
  }

  /** audio.rank_music_list */
  rankMusicList(params: Params.RankListParams, options: CallOptions = {}): Promise<Models.RankMusicList> {
    return this.invoke<Models.RankMusicList>("audio.rank_music_list", params, options, normalizePayload);
  }

  /** audio.rank_period */
  rankPeriod(params: Params.RankPeriodParams, options: CallOptions = {}): Promise<Models.RankPeriods> {
    return this.invoke<Models.RankPeriods>("audio.rank_period", params, options, normalizePayload);
  }

  /** audio.status_number */
  statusNumber(params: Params.SongParams, options: CallOptions = {}): Promise<Models.StatusNumber> {
    return this.invoke<Models.StatusNumber>("audio.status_number", params, options, normalizePayload);
  }

  /** audio.stream_url */
  streamURL(params: Params.StreamURLParams, options: CallOptions = {}): Promise<Models.StreamURL> {
    return this.invoke<Models.StreamURL>("audio.stream_url", params, options, normalizePayload);
  }

  /** audio.stream_url_web */
  streamURLWeb(params: Params.StreamURLWebParams, options: CallOptions = {}): Promise<Models.StreamURLWeb> {
    return this.invoke<Models.StreamURLWeb>("audio.stream_url_web", params, options, normalizePayload);
  }

  /** audio.tags */
  tags(params: Params.SongParams, options: CallOptions = {}): Promise<Array<Models.Tag>> {
    return this.invoke<Array<Models.Tag>>("audio.tags", params, options, normalizePayload);
  }
}
