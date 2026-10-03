// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class FavClient extends DomainClient {

  /** fav.collected_list */
  collectedList(params: Params.CollectedListParams, options: CallOptions = {}): Promise<Models.CollectedList> {
    return this.invoke<Models.CollectedList>("fav.collected_list", params, options, normalizePayload);
  }

  /** fav.created_list */
  createdList(params: Params.CreatedListParams, options: CallOptions = {}): Promise<Models.CreatedList> {
    return this.invoke<Models.CreatedList>("fav.created_list", params, options, normalizePayload);
  }

  /** fav.folder_info */
  folderInfo(params: Params.FolderInfoParams, options: CallOptions = {}): Promise<Models.FolderInfo> {
    return this.invoke<Models.FolderInfo>("fav.folder_info", params, options, normalizePayload);
  }

  /** fav.list_detail */
  listDetail(params: Params.ListDetailParams, options: CallOptions = {}): Promise<Models.ListDetail> {
    return this.invoke<Models.ListDetail>("fav.list_detail", params, options, normalizePayload);
  }

  /** fav.resource_ids */
  resourceIDs(params: Params.ResourceIDsParams, options: CallOptions = {}): Promise<Array<Models.ResourceID>> {
    return this.invoke<Array<Models.ResourceID>>("fav.resource_ids", params, options, normalizePayload);
  }

  /** fav.resource_infos */
  resourceInfos(params: Params.ResourceInfosParams, options: CallOptions = {}): Promise<Array<Models.ResourceInfo>> {
    return this.invoke<Array<Models.ResourceInfo>>("fav.resource_infos", params, options, normalizePayload);
  }
}
