// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for manga.coupons. */
export interface CouponsParams {
  "pageNum"?: IntegerInput;
  "pageSize"?: IntegerInput;
  "notExpired"?: true;
  "tabType"?: 1;
  "type"?: 0;
}
