// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class ActivityClient extends DomainClient {

  /** activity.info */
  info(params: Params.InfoParams, options: CallOptions = {}): Promise<Models.Info> {
    return this.invoke<Models.Info>("activity.info", params, options, normalizePayload);
  }

  /** activity.list */
  list(params: Params.ListParams = {}, options: CallOptions = {}): Promise<Models.ListPage> {
    return this.invoke<Models.ListPage>("activity.list", params, options, normalizePayload);
  }

  listDefault(options: CallOptions = {}): Promise<Models.ListPage> { return this.list({},options); }
}
