// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class BangumiClient extends DomainClient {

  /** bangumi.info.review_user */
  review(params: Params.InfoParams, options: CallOptions = {}): Promise<Models.Info> {
    return this.invoke<Models.Info>("bangumi.info.review_user", params, options, normalizePayload);
  }

  /** bangumi.info.season_detail_by_ep_id */
  episodeDetail(params: Params.EpisodeID, options: CallOptions = {}): Promise<Models.Detail> {
    return this.invoke<Models.Detail>("bangumi.info.season_detail_by_ep_id", params, options, normalizePayload);
  }

  /** bangumi.info.season_detail_by_season_id */
  seasonDetail(params: Params.SeasonID, options: CallOptions = {}): Promise<Models.Detail> {
    return this.invoke<Models.Detail>("bangumi.info.season_detail_by_season_id", params, options, normalizePayload);
  }

  /** bangumi.info.season_section */
  sections(params: Params.SectionsParams, options: CallOptions = {}): Promise<Models.Sections> {
    return this.invoke<Models.Sections>("bangumi.info.season_section", params, options, normalizePayload);
  }

  /** bangumi.playurl */
  playURL(params: Params.PlayURLParams = {}, options: CallOptions = {}): Promise<Models.PlayURL> {
    return this.invoke<Models.PlayURL>("bangumi.playurl", params, options, normalizePayload);
  }

  /** bangumi.timeline */
  timeline(params: Params.TimelineParams = {}, options: CallOptions = {}): Promise<Array<Models.TimelineDay>> {
    return this.invoke<Array<Models.TimelineDay>>("bangumi.timeline", params, options, normalizePayload);
  }
}
