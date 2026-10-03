// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class ElectricClient extends DomainClient {

  /** electric.charge_follow_info */
  chargeFollowInfo(params: Params.UpMIDParams, options: CallOptions = {}): Promise<Models.FollowInfo> {
    return this.invoke<Models.FollowInfo>("electric.charge_follow_info", params, options, normalizePayload);
  }

  /** electric.charge_record */
  chargeRecord(params: Params.ChargeRecordParams, options: CallOptions = {}): Promise<Models.ChargeRecord> {
    return this.invoke<Models.ChargeRecord>("electric.charge_record", params, options, normalizePayload);
  }

  /** electric.month_up_list */
  monthUpList(params: Params.MonthUpListParams, options: CallOptions = {}): Promise<Models.MonthUpList> {
    return this.invoke<Models.MonthUpList>("electric.month_up_list", params, options, normalizePayload);
  }

  /** electric.rank_recent */
  rankRecent(params: Params.PaginationParams, options: CallOptions = {}): Promise<Models.RecentRank> {
    return this.invoke<Models.RecentRank>("electric.rank_recent", params, options, normalizePayload);
  }

  /** electric.recharge_list */
  rechargeList(params: Params.RechargeListParams, options: CallOptions = {}): Promise<Models.RechargeList> {
    return this.invoke<Models.RechargeList>("electric.recharge_list", params, options, normalizePayload);
  }

  /** electric.remark_detail */
  remarkDetail(params: Params.RemarkDetailParams, options: CallOptions = {}): Promise<Models.RemarkDetail> {
    return this.invoke<Models.RemarkDetail>("electric.remark_detail", params, options, normalizePayload);
  }

  /** electric.remark_list */
  remarkList(params: Params.RemarkListParams, options: CallOptions = {}): Promise<Models.RemarkList> {
    return this.invoke<Models.RemarkList>("electric.remark_list", params, options, normalizePayload);
  }

  /** electric.upower_item_detail */
  itemDetail(params: Params.UpMIDParams, options: CallOptions = {}): Promise<Models.ItemDetail> {
    return this.invoke<Models.ItemDetail>("electric.upower_item_detail", params, options, normalizePayload);
  }

  /** electric.upower_member_rank */
  memberRank(params: Params.MemberRankParams, options: CallOptions = {}): Promise<Models.MemberRank> {
    return this.invoke<Models.MemberRank>("electric.upower_member_rank", params, options, normalizePayload);
  }

  /** electric.video_show */
  videoShow(params: Params.VideoShowParams, options: CallOptions = {}): Promise<Models.VideoShow> {
    return this.invoke<Models.VideoShow>("electric.video_show", params, options, normalizePayload);
  }
}
