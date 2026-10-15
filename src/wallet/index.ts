// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class WalletClient extends DomainClient {

  /** wallet.info */
  info(params: Params.InfoParams, options: CallOptions = {}): Promise<Models.Info> {
    return this.invoke<Models.Info>("wallet.info", params, options, normalizePayload);
  }
}
