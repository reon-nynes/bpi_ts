// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for login.log. */
export interface LogParams {
  "jsonp"?: string;
  "web_location"?: string;
}

/** Parameters for login.notice. */
export interface NoticeParams {
  "mid": IntegerInput;
  "buvid"?: string;
}

/** Parameters for login.qr_poll. */
export interface QRPollParams {
  "qrcode_key": string;
}
