// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class NoteClient extends DomainClient {

  /** note.archive_list */
  archiveList(params: Params.ArchiveListParams, options: CallOptions = {}): Promise<Models.ArchiveList> {
    return this.invoke<Models.ArchiveList>("note.archive_list", params, options, normalizePayload);
  }

  /** note.is_forbid */
  isForbid(params: Params.IsForbidParams, options: CallOptions = {}): Promise<Models.IsForbid> {
    return this.invoke<Models.IsForbid>("note.is_forbid", params, options, normalizePayload);
  }

  /** note.private_info */
  privateInfo(params: Params.PrivateInfoParams, options: CallOptions = {}): Promise<Models.PrivateInfo> {
    return this.invoke<Models.PrivateInfo>("note.private_info", params, options, normalizePayload);
  }

  /** note.public_archive_list */
  publicArchiveList(params: Params.PublicArchiveListParams, options: CallOptions = {}): Promise<Models.PublicArchiveList> {
    return this.invoke<Models.PublicArchiveList>("note.public_archive_list", params, options, normalizePayload);
  }

  /** note.public_info */
  publicInfo(params: Params.PublicInfoParams, options: CallOptions = {}): Promise<Models.PublicInfo> {
    return this.invoke<Models.PublicInfo>("note.public_info", params, options, normalizePayload);
  }

  /** note.user_private_list */
  userPrivateList(params: Params.Pagination = {}, options: CallOptions = {}): Promise<Models.PrivateList> {
    return this.invoke<Models.PrivateList>("note.user_private_list", params, options, normalizePayload);
  }

  /** note.user_public_list */
  userPublicList(params: Params.Pagination = {}, options: CallOptions = {}): Promise<Models.PublicUserList> {
    return this.invoke<Models.PublicUserList>("note.user_public_list", params, options, normalizePayload);
  }
}
