// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for wallet.info. */
export interface InfoParams {
  "platformType"?: IntegerInput;
  "timestamp": IntegerInput;
  "traceId"?: IntegerInput;
  "version"?: string;
}
