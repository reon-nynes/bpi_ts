// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class VideoClient extends DomainClient {

  /** video.ai_summary */
  aiSummary(params: Params.AISummaryParams, options: CallOptions = {}): Promise<Models.AISummary> {
    return this.invoke<Models.AISummary>("video.ai_summary", params, options, normalizePayload);
  }

  /** video.collection.home_seasons_series */
  homeSeasonsSeries(params: Params.HomeSeasonsSeriesParams, options: CallOptions = {}): Promise<Models.SeasonsSeries> {
    return this.invoke<Models.SeasonsSeries>("video.collection.home_seasons_series", params, options, normalizePayload);
  }

  /** video.collection.seasons_archives_list */
  seasonsArchives(params: Params.SeasonsArchivesParams, options: CallOptions = {}): Promise<Models.SeasonsArchives> {
    return this.invoke<Models.SeasonsArchives>("video.collection.seasons_archives_list", params, options, normalizePayload);
  }

  /** video.collection.seasons_series_list */
  seasonsSeries(params: Params.SeasonsSeriesParams, options: CallOptions = {}): Promise<Models.SeasonsSeries> {
    return this.invoke<Models.SeasonsSeries>("video.collection.seasons_series_list", params, options, normalizePayload);
  }

  /** video.collection.series_archives */
  seriesArchives(params: Params.SeriesArchivesParams, options: CallOptions = {}): Promise<Models.SeriesArchives> {
    return this.invoke<Models.SeriesArchives>("video.collection.series_archives", params, options, normalizePayload);
  }

  /** video.collection.series_info */
  seriesInfo(params: Params.SeriesInfoParams, options: CallOptions = {}): Promise<Models.SeriesInfo> {
    return this.invoke<Models.SeriesInfo>("video.collection.series_info", params, options, normalizePayload);
  }

  /** video.desc */
  desc(params: Params.DescParams, options: CallOptions = {}): Promise<string> {
    return this.invoke<string>("video.desc", params, options, normalizePayload);
  }

  /** video.detail */
  detail(params: Params.DetailParams, options: CallOptions = {}): Promise<Models.Detail> {
    return this.invoke<Models.Detail>("video.detail", params, options, normalizePayload);
  }

  /** video.homepage_recommendations */
  homepageRecommendations(params: Params.HomepageRecommendationsParams = {}, options: CallOptions = {}): Promise<Models.HomepageRecommendations> {
    return this.invoke<Models.HomepageRecommendations>("video.homepage_recommendations", params, options, normalizePayload);
  }

  /** video.interactive_video_info */
  interactiveVideoInfo(params: Params.InteractiveInfoParams, options: CallOptions = {}): Promise<Models.InteractiveInfo> {
    return this.invoke<Models.InteractiveInfo>("video.interactive_video_info", params, options, normalizePayload);
  }

  /** video.online_total */
  onlineTotal(params: Params.OnlineTotalParams, options: CallOptions = {}): Promise<Models.OnlineTotal> {
    return this.invoke<Models.OnlineTotal>("video.online_total", params, options, normalizePayload);
  }

  /** video.pagelist */
  pageList(params: Params.PageListParams, options: CallOptions = {}): Promise<Array<Models.Page>> {
    return this.invoke<Array<Models.Page>>("video.pagelist", params, options, normalizePayload);
  }

  /** video.play_url */
  playURL(params: Params.PlayURLParams, options: CallOptions = {}): Promise<Models.PlayURL> {
    return this.invoke<Models.PlayURL>("video.play_url", params, options, normalizePayload);
  }

  /** video.player_info_v2 */
  playerInfoV2(params: Params.PlayerInfoParams, options: CallOptions = {}): Promise<Models.PlayerInfo> {
    return this.invoke<Models.PlayerInfo>("video.player_info_v2", params, options, normalizePayload);
  }

  /** video.related_videos */
  relatedVideos(params: Params.RelatedParams, options: CallOptions = {}): Promise<Array<Models.RelatedVideo>> {
    return this.invoke<Array<Models.RelatedVideo>>("video.related_videos", params, options, normalizePayload);
  }

  /** video.tags */
  tags(params: Params.TagsParams, options: CallOptions = {}): Promise<Array<Models.VideoTag>> {
    return this.invoke<Array<Models.VideoTag>>("video.tags", params, options, normalizePayload);
  }

  /** video.view */
  view(params: Params.ViewParams, options: CallOptions = {}): Promise<Models.View> {
    return this.invoke<Models.View>("video.view", params, options, normalizePayload);
  }
}
