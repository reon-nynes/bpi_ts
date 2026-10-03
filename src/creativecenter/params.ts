// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for creativecenter.season.aid. */
export interface SeasonByAIDParams {
  "id": IntegerInput;
}

/** Parameters for creativecenter.season.info. */
export interface SeasonInfoParams {
  "id": IntegerInput;
}

/** Parameters for creativecenter.season.list. */
export interface SeasonListParams {
  "pn": IntegerInput;
  "ps": IntegerInput;
  "order"?: string;
  "sort"?: string;
}

/** Parameters for creativecenter.season.section. */
export interface SectionParams {
  "id": IntegerInput;
}

/** Parameters for creativecenter.statistics.archive_compare. */
export interface ArchiveCompareParams {
  "t"?: IntegerInput;
  "size"?: IntegerInput;
}

/** Parameters for creativecenter.statistics.article_trend. */
export interface ArticleTrendParams {
  "type": IntegerInput;
}

/** Parameters for creativecenter.statistics.video_trend. */
export interface VideoTrendParams {
  "type": IntegerInput;
}

/** Parameters for creativecenter.videos.archive_videos. */
export interface ArchiveVideosParams {
  "aid": IntegerInput;
}

/** Parameters for creativecenter.videos.archives_list. */
export interface ArchivesListParams {
  "pn": IntegerInput;
  "ps": IntegerInput;
}
