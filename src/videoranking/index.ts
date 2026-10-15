// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class VideoRankingClient extends DomainClient {

  /** video_ranking.popular_list */
  popularList(params: Params.PopularListParams = {}, options: CallOptions = {}): Promise<Models.PopularList> {
    return this.invoke<Models.PopularList>("video_ranking.popular_list", params, options, normalizePayload);
  }

  /** video_ranking.popular_precious */
  precious(options: CallOptions = {}): Promise<Models.PreciousVideos> {
    return this.invoke<Models.PreciousVideos>("video_ranking.popular_precious", {}, options, normalizePayload);
  }

  /** video_ranking.popular_series_list */
  popularSeriesList(options: CallOptions = {}): Promise<Models.PopularSeriesList> {
    return this.invoke<Models.PopularSeriesList>("video_ranking.popular_series_list", {}, options, normalizePayload);
  }

  /** video_ranking.popular_series_one */
  popularSeries(params: Params.PopularSeriesParams, options: CallOptions = {}): Promise<Models.PopularSeries> {
    return this.invoke<Models.PopularSeries>("video_ranking.popular_series_one", params, options, normalizePayload);
  }

  /** video_ranking.ranking_list */
  rankingList(params: Params.RankingListParams = {}, options: CallOptions = {}): Promise<Models.RankingList> {
    return this.invoke<Models.RankingList>("video_ranking.ranking_list", params, options, normalizePayload);
  }

  /** video_ranking.region_dynamic */
  regionDynamic(params: Params.RegionDynamicParams, options: CallOptions = {}): Promise<Models.RegionArchives> {
    return this.invoke<Models.RegionArchives>("video_ranking.region_dynamic", params, options, normalizePayload);
  }

  /** video_ranking.region_newlist */
  regionNewList(params: Params.RegionNewListParams, options: CallOptions = {}): Promise<Models.RegionArchives> {
    return this.invoke<Models.RegionArchives>("video_ranking.region_newlist", params, options, normalizePayload);
  }

  /** video_ranking.region_newlist_rank */
  regionNewListRank(params: Params.RegionNewListRankParams, options: CallOptions = {}): Promise<Models.NewListRank> {
    return this.invoke<Models.NewListRank>("video_ranking.region_newlist_rank", params, options, normalizePayload);
  }

  /** video_ranking.region_tag_dynamic */
  regionTagDynamic(params: Params.RegionTagDynamicParams, options: CallOptions = {}): Promise<Models.RegionArchives> {
    return this.invoke<Models.RegionArchives>("video_ranking.region_tag_dynamic", params, options, normalizePayload);
  }
}
