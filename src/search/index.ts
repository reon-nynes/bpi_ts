// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class SearchClient extends DomainClient {

  /** search.article */
  article(params: Params.ArticleParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.Article>>> {
    return this.invoke<Models.Data<Array<Models.Article>>>("search.article", params, options, normalizePayload);
  }

  /** search.bangumi */
  bangumi(params: Params.BangumiParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.Bangumi>>> {
    return this.invoke<Models.Data<Array<Models.Bangumi>>>("search.bangumi", params, options, normalizePayload);
  }

  /** search.bili_user */
  users(params: Params.UserParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.User>>> {
    return this.invoke<Models.Data<Array<Models.User>>>("search.bili_user", params, options, normalizePayload);
  }

  /** search.default */
  default(options: CallOptions = {}): Promise<Models.Default> {
    return this.invoke<Models.Default>("search.default", {}, options, normalizePayload);
  }

  /** search.hotwords */
  hotWords(options: CallOptions = {}): Promise<Models.HotWords> {
    return this.invoke<Models.HotWords>("search.hotwords", {}, options, normalizePayload);
  }

  /** search.live */
  live(params: Params.LiveParams, options: CallOptions = {}): Promise<Models.Data<Models.LiveData>> {
    return this.invoke<Models.Data<Models.LiveData>>("search.live", params, options, normalizePayload);
  }

  /** search.live_room */
  liveRooms(params: Params.LiveRoomParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.LiveRoom>>> {
    return this.invoke<Models.Data<Array<Models.LiveRoom>>>("search.live_room", params, options, normalizePayload);
  }

  /** search.live_user */
  liveUsers(params: Params.LiveUserParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.LiveUser>>> {
    return this.invoke<Models.Data<Array<Models.LiveUser>>>("search.live_user", params, options, normalizePayload);
  }

  /** search.movie */
  movies(params: Params.MovieParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.Movie>>> {
    return this.invoke<Models.Data<Array<Models.Movie>>>("search.movie", params, options, normalizePayload);
  }

  /** search.suggest */
  suggest(params: Params.SuggestParams, options: CallOptions = {}): Promise<Models.Suggest> {
    return this.invoke<Models.Suggest>("search.suggest", params, options, normalizePayload);
  }

  /** search.video */
  videos(params: Params.VideoParams, options: CallOptions = {}): Promise<Models.Data<Array<Models.Video>>> {
    return this.invoke<Models.Data<Array<Models.Video>>>("search.video", params, options, normalizePayload);
  }
}
