// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for search.article. */
export interface ArticleParams {
  "search_type"?: "article";
  "keyword": string;
  "page"?: IntegerInput;
  "order"?: "totalrank" | "click" | "pubdate" | "dm" | "stow" | "scores" | "attention" | "online" | "live_time" | "0" | "fans" | "level";
  "category_id"?: 0 | 1 | 2 | 3 | 16 | 17 | 28 | 29;
}

/** Parameters for search.bangumi. */
export interface BangumiParams {
  "search_type"?: "media_bangumi";
  "keyword": string;
  "page"?: IntegerInput;
}

/** Parameters for search.bili_user. */
export interface UserParams {
  "search_type"?: "bili_user";
  "keyword": string;
  "page"?: IntegerInput;
  "order_sort"?: IntegerInput;
  "user_type"?: IntegerInput;
}

/** Parameters for search.live. */
export interface LiveParams {
  "search_type"?: "live";
  "keyword": string;
  "page"?: IntegerInput;
}

/** Parameters for search.live_room. */
export interface LiveRoomParams {
  "search_type"?: "live_room";
  "keyword": string;
  "page"?: IntegerInput;
  "order"?: "totalrank" | "click" | "pubdate" | "dm" | "stow" | "scores" | "attention" | "online" | "live_time" | "0" | "fans" | "level";
}

/** Parameters for search.live_user. */
export interface LiveUserParams {
  "search_type"?: "live_user";
  "keyword": string;
  "page"?: IntegerInput;
  "order_sort"?: IntegerInput;
  "user_type"?: IntegerInput;
}

/** Parameters for search.movie. */
export interface MovieParams {
  "search_type"?: "media_ft";
  "keyword": string;
  "page"?: IntegerInput;
}

/** Parameters for search.suggest. */
export interface SuggestParams {
  "term": string;
}

/** Parameters for search.video. */
export interface VideoParams {
  "search_type"?: "video";
  "keyword": string;
  "page"?: IntegerInput;
  "order"?: "totalrank" | "click" | "pubdate" | "dm" | "stow" | "scores" | "attention" | "online" | "live_time" | "0" | "fans" | "level";
  "duration"?: IntegerInput;
  "tids"?: IntegerInput;
}
