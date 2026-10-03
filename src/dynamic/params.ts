// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for dynamic.detail. */
export interface DetailParams {
  "id": IntegerInput;
  "features"?: string;
}

/** Parameters for dynamic.detail_forward. */
export interface OffsetParams {
  "id": IntegerInput;
  "offset"?: string;
}

/** Parameters for dynamic.detail_forward_item. */
export interface ItemParams {
  "id": IntegerInput;
}

/** Parameters for dynamic.feed_all. */
export interface AllParams {
  "features"?: string;
  "web_location"?: string;
  "host_mid"?: IntegerInput;
  "offset"?: string;
  "update_baseline"?: string;
}

/** Parameters for dynamic.feed_all_update. */
export interface CheckNewParams {
  "update_baseline": string;
  "type"?: string;
}

/** Parameters for dynamic.feed_nav. */
export interface NavFeedParams {
  "update_baseline"?: string;
  "offset"?: string;
}

/** Parameters for dynamic.live_users. */
export interface LiveUsersParams {
  "size"?: IntegerInput;
}

/** Parameters for dynamic.lottery_notice. */
export interface LotteryNoticeParams {
  "business_id": IntegerInput;
  "business_type"?: "1";
}

/** Parameters for dynamic.up_users. */
export interface UpUsersParams {
  "teenagers_mode"?: boolean | 0 | 1 | '0' | '1';
}
