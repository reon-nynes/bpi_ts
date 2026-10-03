// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for opus.space_feed. */
export interface SpaceFeedParams {
  "host_mid": IntegerInput;
  "page"?: IntegerInput;
  "type"?: "all" | "article" | "dynamic";
  "web_location"?: "333.1387";
  "offset"?: string;
}
