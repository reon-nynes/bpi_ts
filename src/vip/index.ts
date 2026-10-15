// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class VipClient extends DomainClient {

  /** vip.center_info */
  center(params: Params.CenterParams = {}, options: CallOptions = {}): Promise<Models.Center> {
    return this.invoke<Models.Center>("vip.center_info", params, options, normalizePayload);
  }
}
