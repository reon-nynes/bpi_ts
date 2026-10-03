// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for danmaku.adv.state. */
export interface AdvStateParams {
  "cid": IntegerInput;
  "mode"?: "sp";
}

/** Parameters for danmaku.history.dates. */
export interface HistoryDatesParams {
  "type"?: IntegerInput;
  "oid": IntegerInput;
  "month": string;
}

/** Parameters for danmaku.history.xml. */
export interface HistoryBytesParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "date": string;
}

/** Parameters for danmaku.mobile.seg. */
export interface SegmentParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "segment_index": IntegerInput;
  "pid"?: IntegerInput;
  "pull_mode"?: IntegerInput;
  "ps"?: IntegerInput;
  "pe"?: IntegerInput;
}

/** Parameters for danmaku.snapshot. */
export interface SnapshotParams {
  "aid": string;
}

/** Parameters for danmaku.thumbup.stats. */
export interface ThumbupStatsParams {
  "oid": IntegerInput;
  "ids": string;
}

/** Parameters for danmaku.web.view. */
export interface WebViewParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "pid"?: IntegerInput;
}

/** Parameters for danmaku.xml.comment_xml. */
export interface XMLListParams {
  "oid": IntegerInput;
}
