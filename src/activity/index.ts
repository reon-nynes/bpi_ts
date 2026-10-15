// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
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
