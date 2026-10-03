// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class CheeseClient extends DomainClient {

  /** cheese.info.ep_list */
  episodeList(params: Params.EpisodeListParams, options: CallOptions = {}): Promise<Models.EpisodeList> {
    return this.invoke<Models.EpisodeList>("cheese.info.ep_list", params, options, normalizePayload);
  }

  /** cheese.info.season_detail_by_ep_id */
  episodeDetail(params: Params.EpisodeID, options: CallOptions = {}): Promise<Models.Course> {
    return this.invoke<Models.Course>("cheese.info.season_detail_by_ep_id", params, options, normalizePayload);
  }

  /** cheese.info.season_detail_by_season_id */
  seasonDetail(params: Params.SeasonID, options: CallOptions = {}): Promise<Models.Course> {
    return this.invoke<Models.Course>("cheese.info.season_detail_by_season_id", params, options, normalizePayload);
  }

  /** cheese.playurl */
  playURL(params: Params.PlayURLParams, options: CallOptions = {}): Promise<Models.PlayURL> {
    return this.invoke<Models.PlayURL>("cheese.playurl", params, options, normalizePayload);
  }
}
