// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for historytoview.history_list. */
export interface ListParams {
  "max"?: IntegerInput;
  "business"?: string;
  "view_at"?: IntegerInput;
  "type"?: string;
  "ps"?: IntegerInput;
}
