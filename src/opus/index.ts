// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class OpusClient extends DomainClient {

  /** opus.space_feed */
  spaceFeed(params: Params.SpaceFeedParams, options: CallOptions = {}): Promise<Models.SpaceFeed> {
    return this.invoke<Models.SpaceFeed>("opus.space_feed", params, options, normalizePayload);
  }
}
