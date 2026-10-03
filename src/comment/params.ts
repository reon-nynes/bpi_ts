// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for comment.read.count. */
export interface CountParams {
  "type": IntegerInput;
  "oid": IntegerInput;
}

/** Parameters for comment.read.hot. */
export interface HotParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "root": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for comment.read.list. */
export interface ListParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
  "sort"?: IntegerInput;
  "nohot"?: boolean | 0 | 1 | '0' | '1';
}

/** Parameters for comment.read.replies. */
export interface RepliesParams {
  "type": IntegerInput;
  "oid": IntegerInput;
  "root": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}
