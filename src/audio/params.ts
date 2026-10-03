// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for audio.coin_count. */
export interface SongParams {
  "sid": IntegerInput;
}

/** Parameters for audio.collection_info. */
export interface CollectionInfoParams {
  "sid": IntegerInput;
}

/** Parameters for audio.collections_list. */
export interface PageParams {
  "pn": IntegerInput;
  "ps": IntegerInput;
}

/** Parameters for audio.rank_detail. */
export interface RankListParams {
  "list_id": IntegerInput;
}

/** Parameters for audio.rank_period. */
export interface RankPeriodParams {
  "list_type": IntegerInput;
}

/** Parameters for audio.stream_url. */
export interface StreamURLParams {
  "songid": IntegerInput;
  "quality": IntegerInput;
  "privilege"?: IntegerInput;
  "mid"?: IntegerInput;
  "platform"?: string;
}

/** Parameters for audio.stream_url_web. */
export interface StreamURLWebParams {
  "sid": IntegerInput;
  "quality"?: IntegerInput;
  "privilege"?: IntegerInput;
}
