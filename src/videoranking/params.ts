// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for video_ranking.popular_list. */
export interface PopularListParams {
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for video_ranking.popular_series_one. */
export interface PopularSeriesParams {
  "number": IntegerInput;
}

/** Parameters for video_ranking.ranking_list. */
export interface RankingListParams {
  "rid"?: IntegerInput;
  "type"?: "all" | "rookie" | "origin";
}

/** Parameters for video_ranking.region_dynamic. */
export interface RegionDynamicParams {
  "rid": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for video_ranking.region_newlist. */
export interface RegionNewListParams {
  "rid": IntegerInput;
  "type"?: IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for video_ranking.region_newlist_rank. */
export interface RegionNewListRankParams {
  "search_type"?: "video";
  "view_type"?: "hot_rank";
  "cate_id": IntegerInput;
  "pagesize": IntegerInput;
  "time_from": string;
  "time_to": string;
  "order"?: "click" | "scores" | "pubdate";
  "page"?: IntegerInput;
}

/** Parameters for video_ranking.region_tag_dynamic. */
export interface RegionTagDynamicParams {
  "rid": IntegerInput;
  "tag_id": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}
