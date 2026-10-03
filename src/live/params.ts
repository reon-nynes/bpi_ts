// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for live.banned_users. */
export interface BannedUsersParams {
  "anchor_id": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
  "mobi_app"?: "android";
  "platform"?: "android";
  "spmid"?: "444.8.0.0";
  "visit_id"?: "";
  "room_id": IntegerInput;
}

/** Parameters for live.blind_gift_info. */
export interface BlindGiftInfoParams {
  "gift_id": IntegerInput;
}

/** Parameters for live.danmu_info. */
export interface DanmuInfoParams {
  "id": IntegerInput;
  "type"?: IntegerInput;
}

/** Parameters for live.emoticons. */
export interface EmoticonsParams {
  "room_id": IntegerInput;
  "platform"?: string;
}

/** Parameters for live.follow_up_list. */
export interface FollowUpListParams {
  "page"?: IntegerInput;
  "page_size"?: IntegerInput;
  "ignoreRecord"?: boolean | 0 | 1 | '0' | '1';
  "hit_ab"?: boolean | 0 | 1 | '0' | '1';
}

/** Parameters for live.follow_up_web_list. */
export interface FollowUpWebListParams {
  "hit_ab"?: boolean | 0 | 1 | '0' | '1';
}

/** Parameters for live.guard_list. */
export interface GuardListParams {
  "roomid": IntegerInput;
  "ruid": IntegerInput;
  "page"?: IntegerInput;
  "page_size"?: IntegerInput;
  "typ"?: IntegerInput;
}

/** Parameters for live.lottery_info. */
export interface LotteryInfoParams {
  "roomid": IntegerInput;
}

/** Parameters for live.my_medals. */
export interface MyMedalsParams {
  "page"?: IntegerInput;
  "page_size"?: IntegerInput;
}

/** Parameters for live.replay_list. */
export interface ReplayListParams {
  "page"?: IntegerInput;
  "page_size"?: IntegerInput;
}

/** Parameters for live.room_gift_list. */
export interface RoomGiftListParams {
  "room_id": IntegerInput;
  "platform"?: "web";
  "area_parent_id"?: IntegerInput;
  "area_id"?: IntegerInput;
}

/** Parameters for live.room_info. */
export interface RoomInfoParams {
  "room_id": IntegerInput;
}

/** Parameters for live.shield_keywords. */
export interface ShieldKeywordsParams {
  "room_id": IntegerInput;
  "spmid"?: "444.8.0.0";
  "visit_id"?: "";
  "mobi_app"?: "android";
  "platform"?: "android";
}

/** Parameters for live.silent_users. */
export interface SilentUsersParams {
  "room_id": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for live.stream. */
export interface StreamParams {
  "cid": IntegerInput;
  "platform"?: string;
  "quality"?: IntegerInput;
  "qn"?: IntegerInput;
}

/** Parameters for live.web_heart_beat. */
export interface WebHeartBeatParams {
  "hb": string;
  "pf"?: string;
}
