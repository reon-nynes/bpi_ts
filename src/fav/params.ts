// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for fav.collected_list. */
export interface CollectedListParams {
  "up_mid": IntegerInput;
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
  "platform"?: string;
}

/** Parameters for fav.created_list. */
export interface CreatedListParams {
  "up_mid": IntegerInput;
  "web_location"?: string;
  "type"?: IntegerInput;
  "rid"?: IntegerInput;
}

/** Parameters for fav.folder_info. */
export interface FolderInfoParams {
  "media_id": IntegerInput;
}

/** Parameters for fav.list_detail. */
export interface ListDetailParams {
  "media_id": IntegerInput;
  "platform"?: "web";
  "ps"?: IntegerInput;
  "tid"?: IntegerInput;
  "keyword"?: string;
  "order"?: string;
  "type"?: IntegerInput;
  "pn"?: IntegerInput;
}

/** Parameters for fav.resource_ids. */
export interface ResourceIDsParams {
  "media_id": IntegerInput;
  "platform"?: "web";
}

/** Parameters for fav.resource_infos. */
export interface ResourceInfosParams {
  "resources": string;
  "platform"?: string;
}
