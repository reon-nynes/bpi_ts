// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class DynamicClient extends DomainClient {

  /** dynamic.detail */
  detail(params: Params.DetailParams, options: CallOptions = {}): Promise<Models.Detail> {
    return this.invoke<Models.Detail>("dynamic.detail", params, options, normalizePayload);
  }

  /** dynamic.detail_forward */
  forwards(params: Params.OffsetParams, options: CallOptions = {}): Promise<Models.Forwards> {
    return this.invoke<Models.Forwards>("dynamic.detail_forward", params, options, normalizePayload);
  }

  /** dynamic.detail_forward_item */
  forwardItem(params: Params.ItemParams, options: CallOptions = {}): Promise<Models.ForwardInfo> {
    return this.invoke<Models.ForwardInfo>("dynamic.detail_forward_item", params, options, normalizePayload);
  }

  /** dynamic.detail_pic */
  pictures(params: Params.ItemParams, options: CallOptions = {}): Promise<Array<Models.Picture>> {
    return this.invoke<Array<Models.Picture>>("dynamic.detail_pic", params, options, normalizePayload);
  }

  /** dynamic.detail_reaction */
  reactions(params: Params.OffsetParams, options: CallOptions = {}): Promise<Models.Reactions> {
    return this.invoke<Models.Reactions>("dynamic.detail_reaction", params, options, normalizePayload);
  }

  /** dynamic.feed_all */
  all(params: Params.AllParams = {}, options: CallOptions = {}): Promise<Models.Feed> {
    return this.invoke<Models.Feed>("dynamic.feed_all", params, options, normalizePayload);
  }

  /** dynamic.feed_all_update */
  checkNew(params: Params.CheckNewParams, options: CallOptions = {}): Promise<Models.Update> {
    return this.invoke<Models.Update>("dynamic.feed_all_update", params, options, normalizePayload);
  }

  /** dynamic.feed_banner */
  feedBanner(options: CallOptions = {}): Promise<Models.BannerFeed> {
    return this.invoke<Models.BannerFeed>("dynamic.feed_banner", {}, options, normalizePayload);
  }

  /** dynamic.feed_nav */
  navFeed(params: Params.NavFeedParams = {}, options: CallOptions = {}): Promise<Models.NavFeed> {
    return this.invoke<Models.NavFeed>("dynamic.feed_nav", params, options, normalizePayload);
  }

  /** dynamic.live_users */
  liveUsers(params: Params.LiveUsersParams = {}, options: CallOptions = {}): Promise<Models.LiveUsers> {
    return this.invoke<Models.LiveUsers>("dynamic.live_users", params, options, normalizePayload);
  }

  /** dynamic.lottery_notice */
  lotteryNotice(params: Params.LotteryNoticeParams, options: CallOptions = {}): Promise<Models.LotteryNotice> {
    return this.invoke<Models.LotteryNotice>("dynamic.lottery_notice", params, options, normalizePayload);
  }

  /** dynamic.recent_up */
  recentUp(options: CallOptions = {}): Promise<Models.RecentUp> {
    return this.invoke<Models.RecentUp>("dynamic.recent_up", {}, options, normalizePayload);
  }

  /** dynamic.up_users */
  upUsers(params: Params.UpUsersParams = {}, options: CallOptions = {}): Promise<Models.UpUsers> {
    return this.invoke<Models.UpUsers>("dynamic.up_users", params, options, normalizePayload);
  }
}
