// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for note.archive_list. */
export interface ArchiveListParams {
  "oid": IntegerInput;
  "oid_type"?: "0";
}

/** Parameters for note.is_forbid. */
export interface IsForbidParams {
  "aid": IntegerInput;
}

/** Parameters for note.private_info. */
export interface PrivateInfoParams {
  "oid": IntegerInput;
  "oid_type"?: "0";
  "note_id": IntegerInput;
}

/** Parameters for note.public_archive_list. */
export interface PublicArchiveListParams {
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
  "oid": IntegerInput;
  "oid_type"?: 0;
}

/** Parameters for note.public_info. */
export interface PublicInfoParams {
  "cvid": IntegerInput;
}

/** Parameters for note.user_private_list. */
export interface Pagination {
  "pn"?: IntegerInput;
  "ps"?: IntegerInput;
}
