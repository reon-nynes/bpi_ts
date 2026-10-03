// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for web_widget.header_page. */
export interface HeaderPageParams {
  "resource_id"?: IntegerInput;
}

/** Parameters for web_widget.region_banner. */
export interface RegionBannerParams {
  "region_id": IntegerInput;
}
