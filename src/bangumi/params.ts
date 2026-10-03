// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for bangumi.info.review_user. */
export interface InfoParams {
  "media_id": IntegerInput;
}

/** Parameters for bangumi.info.season_detail_by_ep_id. */
export interface EpisodeID {
  "ep_id": IntegerInput;
}

/** Parameters for bangumi.info.season_detail_by_season_id. */
export interface SeasonID {
  "season_id": IntegerInput;
}

/** Parameters for bangumi.info.season_section. */
export interface SectionsParams {
  "season_id": IntegerInput;
}

/** Parameters for bangumi.playurl. */
export interface PlayURLParams {
  "fnver"?: 0;
  "ep_id"?: IntegerInput;
  "cid"?: IntegerInput;
  "qn"?: IntegerInput;
  "fnval"?: IntegerInput;
  "fourk"?: boolean | 0 | 1 | '0' | '1';
}

/** Parameters for bangumi.timeline. */
export interface TimelineParams {
  "types"?: 1 | 3 | 4;
  "before"?: IntegerInput;
  "after"?: IntegerInput;
}
