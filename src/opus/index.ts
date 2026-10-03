// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
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
