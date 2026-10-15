// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class UserClient extends DomainClient {

  /** user.album_count */
  albumCount(params: Params.AlbumCountParams, options: CallOptions = {}): Promise<Models.AlbumCount> {
    return this.invoke<Models.AlbumCount>("user.album_count", params, options, normalizePayload);
  }

  /** user.bangumi_follow_list */
  bangumiFollowList(params: Params.BangumiFollowListParams, options: CallOptions = {}): Promise<Models.BangumiFollowList> {
    return this.invoke<Models.BangumiFollowList>("user.bangumi_follow_list", params, options, normalizePayload);
  }

  /** user.card */
  card(params: Params.CardParams, options: CallOptions = {}): Promise<Models.CardProfile> {
    return this.invoke<Models.CardProfile>("user.card", params, options, normalizePayload);
  }

  /** user.cards */
  cards(params: Params.CardsParams, options: CallOptions = {}): Promise<Array<Models.BatchCard>> {
    return this.invoke<Array<Models.BatchCard>>("user.cards", params, options, normalizePayload);
  }

  /** user.follow_tags */
  followTags(options: CallOptions = {}): Promise<Array<Models.FollowTag>> {
    return this.invoke<Array<Models.FollowTag>>("user.follow_tags", {}, options, normalizePayload);
  }

  /** user.followers */
  followers(params: Params.FollowersParams, options: CallOptions = {}): Promise<Models.Followers> {
    return this.invoke<Models.Followers>("user.followers", params, options, normalizePayload);
  }

  /** user.followings */
  followings(params: Params.FollowingsParams, options: CallOptions = {}): Promise<Models.Followings> {
    return this.invoke<Models.Followings>("user.followings", params, options, normalizePayload);
  }

  /** user.infos */
  infos(params: Params.InfosParams, options: CallOptions = {}): Promise<Array<Models.BatchInfo>> {
    return this.invoke<Array<Models.BatchInfo>>("user.infos", params, options, normalizePayload);
  }

  /** user.medal_wall */
  medalWall(params: Params.MedalWallParams, options: CallOptions = {}): Promise<Models.MedalWall> {
    return this.invoke<Models.MedalWall>("user.medal_wall", params, options, normalizePayload);
  }

  /** user.name_to_uid */
  nameToUID(params: Params.NameToUIDParams, options: CallOptions = {}): Promise<Models.NameToUID> {
    return this.invoke<Models.NameToUID>("user.name_to_uid", params, options, normalizePayload);
  }

  /** user.nav_stat */
  navStat(params: Params.NavStatParams, options: CallOptions = {}): Promise<Models.NavStat> {
    return this.invoke<Models.NavStat>("user.nav_stat", params, options, normalizePayload);
  }

  /** user.relation_stat */
  relationStat(params: Params.RelationStatParams, options: CallOptions = {}): Promise<Models.RelationStat> {
    return this.invoke<Models.RelationStat>("user.relation_stat", params, options, normalizePayload);
  }

  /** user.space_info */
  spaceInfo(params: Params.SpaceParams, options: CallOptions = {}): Promise<Models.SpaceProfile> {
    return this.invoke<Models.SpaceProfile>("user.space_info", params, options, normalizePayload);
  }

  /** user.space_notice */
  spaceNotice(params: Params.SpaceNoticeParams, options: CallOptions = {}): Promise<Models.SpaceNotice> {
    return this.invoke<Models.SpaceNotice>("user.space_notice", params, options, normalizePayload);
  }

  /** user.up_stat */
  upStat(params: Params.UpStatParams, options: CallOptions = {}): Promise<Models.UpStat> {
    return this.invoke<Models.UpStat>("user.up_stat", params, options, normalizePayload);
  }

  /** user.uploaded_videos */
  uploadedVideos(params: Params.UploadedVideosParams, options: CallOptions = {}): Promise<Models.UploadedVideos> {
    return this.invoke<Models.UploadedVideos>("user.uploaded_videos", params, options, normalizePayload);
  }
}
