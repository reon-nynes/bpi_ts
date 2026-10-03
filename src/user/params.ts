// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for user.album_count. */
export interface AlbumCountParams {
  "uid": IntegerInput;
}

/** Parameters for user.bangumi_follow_list. */
export interface BangumiFollowListParams {
  "vmid": IntegerInput;
  "type"?: 1 | 2;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}

/** Parameters for user.card. */
export interface CardParams {
  "photo"?: boolean | 0 | 1 | '0' | '1';
  "mid": IntegerInput;
}

/** Parameters for user.cards. */
export interface CardsParams {
  "uids": string;
}

/** Parameters for user.followers. */
export interface FollowersParams {
  "ps"?: IntegerInput;
  "pn"?: IntegerInput;
  "offset"?: string;
  "last_access_ts"?: IntegerInput;
  "from"?: string;
  "vmid": IntegerInput;
}

/** Parameters for user.followings. */
export interface FollowingsParams {
  "order_type"?: string;
  "ps"?: IntegerInput;
  "pn"?: IntegerInput;
  "vmid": IntegerInput;
}

/** Parameters for user.infos. */
export interface InfosParams {
  "uids": string;
}

/** Parameters for user.medal_wall. */
export interface MedalWallParams {
  "target_id": IntegerInput;
}

/** Parameters for user.name_to_uid. */
export interface NameToUIDParams {
  "names": string;
}

/** Parameters for user.nav_stat. */
export interface NavStatParams {
  "mid": IntegerInput;
}

/** Parameters for user.relation_stat. */
export interface RelationStatParams {
  "vmid": IntegerInput;
}

/** Parameters for user.space_info. */
export interface SpaceParams {
  "mid": IntegerInput;
}

/** Parameters for user.space_notice. */
export interface SpaceNoticeParams {
  "mid": IntegerInput;
}

/** Parameters for user.up_stat. */
export interface UpStatParams {
  "mid": IntegerInput;
}

/** Parameters for user.uploaded_videos. */
export interface UploadedVideosParams {
  "mid": IntegerInput;
  "order"?: "pubdate" | "click" | "stow";
  "tid"?: IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
  "keyword"?: string;
}
