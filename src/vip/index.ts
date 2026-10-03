// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
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
