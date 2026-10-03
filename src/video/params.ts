// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

export type VideoIdentifier = { aid: IntegerInput; bvid?: never } | { bvid: string; aid?: never };

/** Parameters for video.ai_summary. */
export type AISummaryParams = VideoIdentifier & {
  "cid": IntegerInput;
  "up_mid": IntegerInput;
};

/** Parameters for video.collection.home_seasons_series. */
export interface HomeSeasonsSeriesParams {
  "mid": IntegerInput;
  "page_num"?: IntegerInput;
  "page_size"?: IntegerInput;
}

/** Parameters for video.collection.seasons_archives_list. */
export interface SeasonsArchivesParams {
  "mid": IntegerInput;
  "season_id": IntegerInput;
  "page_num"?: IntegerInput;
  "page_size"?: IntegerInput;
  "sort_reverse"?: boolean | 0 | 1 | '0' | '1';
}

/** Parameters for video.collection.seasons_series_list. */
export interface SeasonsSeriesParams {
  "mid": IntegerInput;
  "page_num"?: IntegerInput;
  "page_size"?: IntegerInput;
}

/** Parameters for video.collection.series_archives. */
export interface SeriesArchivesParams {
  "mid": IntegerInput;
  "series_id": IntegerInput;
  "only_normal"?: boolean | 0 | 1 | '0' | '1';
  "sort"?: "asc" | "desc";
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for video.collection.series_info. */
export interface SeriesInfoParams {
  "series_id": IntegerInput;
}

/** Parameters for video.desc. */
export type DescParams = VideoIdentifier & {

};

/** Parameters for video.detail. */
export type DetailParams = VideoIdentifier & {
  "need_elec"?: boolean | 0 | 1 | '0' | '1';
};

/** Parameters for video.homepage_recommendations. */
export interface HomepageRecommendationsParams {
  "fresh_type"?: "4";
  "ps"?: IntegerInput;
  "fresh_idx"?: IntegerInput;
  "fresh_idx_1h"?: IntegerInput;
  "brush"?: IntegerInput;
  "fetch_row"?: IntegerInput;
}

/** Parameters for video.interactive_video_info. */
export type InteractiveInfoParams = VideoIdentifier & {
  "graph_version": IntegerInput;
  "edge_id"?: IntegerInput;
};

/** Parameters for video.online_total. */
export type OnlineTotalParams = VideoIdentifier & {
  "cid": IntegerInput;
};

/** Parameters for video.pagelist. */
export type PageListParams = VideoIdentifier & {

};

/** Parameters for video.play_url. */
export type PlayURLParams = VideoIdentifier & {
  "cid": IntegerInput;
  "qn"?: IntegerInput;
  "fnval"?: IntegerInput;
  "fnver"?: IntegerInput;
  "fourk"?: boolean | 0 | 1 | '0' | '1';
  "platform"?: string;
  "high_quality"?: boolean | 0 | 1 | '0' | '1';
  "try_look"?: boolean | 0 | 1 | '0' | '1';
};

/** Parameters for video.player_info_v2. */
export type PlayerInfoParams = VideoIdentifier & {
  "cid": IntegerInput;
  "season_id"?: IntegerInput;
  "ep_id"?: IntegerInput;
};

/** Parameters for video.related_videos. */
export type RelatedParams = VideoIdentifier & {

};

/** Parameters for video.tags. */
export type TagsParams = VideoIdentifier & {
  "cid"?: IntegerInput;
};

/** Parameters for video.view. */
export type ViewParams = VideoIdentifier & {

};
