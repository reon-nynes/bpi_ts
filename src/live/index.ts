// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class LiveClient extends DomainClient {

  /** live.area_list */
  areaList(options: CallOptions = {}): Promise<Array<Models.ParentArea>> {
    return this.invoke<Array<Models.ParentArea>>("live.area_list", {}, options, normalizePayload);
  }

  /** live.banned_users */
  bannedUsers(params: Params.BannedUsersParams, options: CallOptions = {}): Promise<Models.BannedUsers> {
    return this.invoke<Models.BannedUsers>("live.banned_users", params, options, normalizePayload);
  }

  /** live.blind_gift_info */
  blindGiftInfo(params: Params.BlindGiftInfoParams, options: CallOptions = {}): Promise<Models.BlindGiftInfo> {
    return this.invoke<Models.BlindGiftInfo>("live.blind_gift_info", params, options, normalizePayload);
  }

  /** live.danmu_info */
  danmuInfo(params: Params.DanmuInfoParams, options: CallOptions = {}): Promise<Models.DanmuInfo> {
    return this.invoke<Models.DanmuInfo>("live.danmu_info", params, options, normalizePayload);
  }

  /** live.emoticons */
  emoticons(params: Params.EmoticonsParams, options: CallOptions = {}): Promise<Models.EmoticonData> {
    return this.invoke<Models.EmoticonData>("live.emoticons", params, options, normalizePayload);
  }

  /** live.follow_up_list */
  followUpList(params: Params.FollowUpListParams = {}, options: CallOptions = {}): Promise<Models.FollowUpList> {
    return this.invoke<Models.FollowUpList>("live.follow_up_list", params, options, normalizePayload);
  }

  /** live.follow_up_web_list */
  followUpWebList(params: Params.FollowUpWebListParams = {}, options: CallOptions = {}): Promise<Models.FollowUpWebList> {
    return this.invoke<Models.FollowUpWebList>("live.follow_up_web_list", params, options, normalizePayload);
  }

  /** live.gift_types */
  giftTypes(options: CallOptions = {}): Promise<Array<Models.GiftType>> {
    return this.invoke<Array<Models.GiftType>>("live.gift_types", {}, options, normalizePayload);
  }

  /** live.guard_list */
  guardList(params: Params.GuardListParams, options: CallOptions = {}): Promise<Models.GuardList> {
    return this.invoke<Models.GuardList>("live.guard_list", params, options, normalizePayload);
  }

  /** live.lottery_info */
  lotteryInfo(params: Params.LotteryInfoParams, options: CallOptions = {}): Promise<Models.LotteryInfo> {
    return this.invoke<Models.LotteryInfo>("live.lottery_info", params, options, normalizePayload);
  }

  /** live.my_medals */
  myMedals(params: Params.MyMedalsParams = {}, options: CallOptions = {}): Promise<Models.MyMedals> {
    return this.invoke<Models.MyMedals>("live.my_medals", params, options, normalizePayload);
  }

  /** live.recommend */
  recommend(options: CallOptions = {}): Promise<Models.Recommend> {
    return this.invoke<Models.Recommend>("live.recommend", {}, options, normalizePayload);
  }

  /** live.replay_list */
  replayList(params: Params.ReplayListParams = {}, options: CallOptions = {}): Promise<Models.ReplayList> {
    return this.invoke<Models.ReplayList>("live.replay_list", params, options, normalizePayload);
  }

  /** live.room_gift_list */
  roomGiftList(params: Params.RoomGiftListParams, options: CallOptions = {}): Promise<Models.RoomGiftList> {
    return this.invoke<Models.RoomGiftList>("live.room_gift_list", params, options, normalizePayload);
  }

  /** live.room_info */
  roomInfo(params: Params.RoomInfoParams, options: CallOptions = {}): Promise<Models.RoomInfo> {
    return this.invoke<Models.RoomInfo>("live.room_info", params, options, normalizePayload);
  }

  /** live.shield_keywords */
  shieldKeywords(params: Params.ShieldKeywordsParams, options: CallOptions = {}): Promise<Models.ShieldKeywords> {
    return this.invoke<Models.ShieldKeywords>("live.shield_keywords", params, options, normalizePayload);
  }

  /** live.silent_users */
  silentUsers(params: Params.SilentUsersParams, options: CallOptions = {}): Promise<Models.SilentUsers> {
    return this.invoke<Models.SilentUsers>("live.silent_users", params, options, normalizePayload);
  }

  /** live.stream */
  stream(params: Params.StreamParams, options: CallOptions = {}): Promise<Models.Stream> {
    return this.invoke<Models.Stream>("live.stream", params, options, normalizePayload);
  }

  /** live.version */
  version(options: CallOptions = {}): Promise<Models.Version> {
    return this.invoke<Models.Version>("live.version", {}, options, normalizePayload);
  }

  /** live.web_heart_beat */
  webHeartBeat(params: Params.WebHeartBeatParams, options: CallOptions = {}): Promise<Models.HeartBeat> {
    return this.invoke<Models.HeartBeat>("live.web_heart_beat", params, options, normalizePayload);
  }
}
