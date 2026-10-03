// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for cheese.info.ep_list. */
export interface EpisodeListParams {
  "season_id": IntegerInput;
  "ps"?: IntegerInput;
  "pn"?: IntegerInput;
}

/** Parameters for cheese.info.season_detail_by_ep_id. */
export interface EpisodeID {
  "ep_id": IntegerInput;
}

/** Parameters for cheese.info.season_detail_by_season_id. */
export interface SeasonID {
  "season_id": IntegerInput;
}

/** Parameters for cheese.playurl. */
export interface PlayURLParams {
  "avid": IntegerInput;
  "ep_id": IntegerInput;
  "cid": IntegerInput;
  "fnver"?: 0;
  "qn"?: IntegerInput;
  "fnval"?: IntegerInput;
  "fourk"?: boolean | 0 | 1 | '0' | '1';
}
