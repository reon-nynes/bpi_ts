// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for misc.b23tv.short_link. */
export interface ShortLinkParams {
  "platform"?: string;
  "share_channel"?: string;
  "share_id"?: string;
  "share_mode"?: IntegerInput;
  "oid": IntegerInput;
  "buvid"?: string;
  "build"?: IntegerInput;
}
