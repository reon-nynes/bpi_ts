// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for electric.charge_follow_info. */
export interface UpMIDParams {
  "up_mid": IntegerInput;
}

/** Parameters for electric.charge_record. */
export interface ChargeRecordParams {
  "page": IntegerInput;
  "type": IntegerInput;
}

/** Parameters for electric.month_up_list. */
export interface MonthUpListParams {
  "up_mid": IntegerInput;
}

/** Parameters for electric.rank_recent. */
export interface PaginationParams {
  "pn": IntegerInput;
  "ps": IntegerInput;
}

/** Parameters for electric.recharge_list. */
export interface RechargeListParams {
  "customerId"?: "10026";
  "currentPage": IntegerInput;
  "pageSize": IntegerInput;
  "beginTime"?: string;
  "endTime"?: string;
}

/** Parameters for electric.remark_detail. */
export interface RemarkDetailParams {
  "id": IntegerInput;
}

/** Parameters for electric.remark_list. */
export interface RemarkListParams {
  "pn": IntegerInput;
  "ps": IntegerInput;
  "begin"?: string;
  "end"?: string;
}

/** Parameters for electric.upower_member_rank. */
export interface MemberRankParams {
  "up_mid": IntegerInput;
  "pn": IntegerInput;
  "ps": IntegerInput;
  "privilege_type"?: IntegerInput;
}

/** Parameters for electric.video_show. */
export interface VideoShowParams {
  "mid": IntegerInput;
  "aid"?: IntegerInput;
  "bvid"?: string;
}
