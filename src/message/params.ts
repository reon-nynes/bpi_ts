// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for message.reply_feed. */
export interface ReplyFeedParams {
  "build"?: "0";
  "mobi_app"?: "web";
  "platform"?: "web";
  "web_location"?: string;
  "id"?: IntegerInput;
  "reply_time"?: IntegerInput;
}

/** Parameters for message.single_unread. */
export interface SingleUnreadParams {
  "build"?: "0";
  "mobi_app"?: "web";
  "show_dustbin"?: boolean | 0 | 1 | '0' | '1';
  "show_unfollow_list"?: boolean | 0 | 1 | '0' | '1';
  "unread_type"?: IntegerInput;
}

/** Parameters for message.unread_count. */
export interface UnreadCountParams {
  "build"?: string;
  "mobi_app"?: string;
}
