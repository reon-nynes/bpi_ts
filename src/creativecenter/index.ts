// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class CreativeCenterClient extends DomainClient {

  /** creativecenter.railgun.electromagnetic_info */
  electromagneticInfo(options: CallOptions = {}): Promise<Models.ElectromagneticInfo> {
    return this.invoke<Models.ElectromagneticInfo>("creativecenter.railgun.electromagnetic_info", {}, options, normalizePayload);
  }

  /** creativecenter.season.aid */
  seasonByAID(params: Params.SeasonByAIDParams, options: CallOptions = {}): Promise<Models.Season> {
    return this.invoke<Models.Season>("creativecenter.season.aid", params, options, normalizePayload);
  }

  /** creativecenter.season.info */
  seasonInfo(params: Params.SeasonInfoParams, options: CallOptions = {}): Promise<Models.SeasonInfo> {
    return this.invoke<Models.SeasonInfo>("creativecenter.season.info", params, options, normalizePayload);
  }

  /** creativecenter.season.list */
  seasonList(params: Params.SeasonListParams, options: CallOptions = {}): Promise<Models.SeasonList> {
    return this.invoke<Models.SeasonList>("creativecenter.season.list", params, options, normalizePayload);
  }

  /** creativecenter.season.section */
  seasonSection(params: Params.SectionParams, options: CallOptions = {}): Promise<Models.SectionEpisodes> {
    return this.invoke<Models.SectionEpisodes>("creativecenter.season.section", params, options, normalizePayload);
  }

  /** creativecenter.statistics.archive_compare */
  archiveCompare(params: Params.ArchiveCompareParams = {}, options: CallOptions = {}): Promise<Models.ArchiveCompare> {
    return this.invoke<Models.ArchiveCompare>("creativecenter.statistics.archive_compare", params, options, normalizePayload);
  }

  /** creativecenter.statistics.article_stat */
  articleStat(options: CallOptions = {}): Promise<Models.ArticleStat> {
    return this.invoke<Models.ArticleStat>("creativecenter.statistics.article_stat", {}, options, normalizePayload);
  }

  /** creativecenter.statistics.article_trend */
  articleTrend(params: Params.ArticleTrendParams, options: CallOptions = {}): Promise<Array<Models.Trend>> {
    return this.invoke<Array<Models.Trend>>("creativecenter.statistics.article_trend", params, options, normalizePayload);
  }

  /** creativecenter.statistics.play_source */
  playSource(options: CallOptions = {}): Promise<Models.PlaySource> {
    return this.invoke<Models.PlaySource>("creativecenter.statistics.play_source", {}, options, normalizePayload);
  }

  /** creativecenter.statistics.up_stat */
  upStat(options: CallOptions = {}): Promise<Models.UpStat> {
    return this.invoke<Models.UpStat>("creativecenter.statistics.up_stat", {}, options, normalizePayload);
  }

  /** creativecenter.statistics.video_trend */
  videoTrend(params: Params.VideoTrendParams, options: CallOptions = {}): Promise<Array<Models.Trend>> {
    return this.invoke<Array<Models.Trend>>("creativecenter.statistics.video_trend", params, options, normalizePayload);
  }

  /** creativecenter.statistics.viewer_data */
  viewerData(options: CallOptions = {}): Promise<Models.ViewerData> {
    return this.invoke<Models.ViewerData>("creativecenter.statistics.viewer_data", {}, options, normalizePayload);
  }

  /** creativecenter.videos.archive_videos */
  archiveVideos(params: Params.ArchiveVideosParams, options: CallOptions = {}): Promise<Models.ArchiveVideos> {
    return this.invoke<Models.ArchiveVideos>("creativecenter.videos.archive_videos", params, options, normalizePayload);
  }

  /** creativecenter.videos.archives_list */
  archivesList(params: Params.ArchivesListParams, options: CallOptions = {}): Promise<Models.ArchivesList> {
    return this.invoke<Models.ArchivesList>("creativecenter.videos.archives_list", params, options, normalizePayload);
  }
}
