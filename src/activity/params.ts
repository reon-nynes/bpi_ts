// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for activity.info. */
export interface InfoParams {
  "sid": IntegerInput;
  "bvid"?: string;
}

/** Parameters for activity.list. */
export interface ListParams {
  "plat"?: string;
  "mold"?: IntegerInput;
  "http"?: IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}
