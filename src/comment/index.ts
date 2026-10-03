// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class CommentClient extends DomainClient {

  /** comment.read.count */
  count(params: Params.CountParams, options: CallOptions = {}): Promise<Models.Count> {
    return this.invoke<Models.Count>("comment.read.count", params, options, normalizePayload);
  }

  /** comment.read.hot */
  hot(params: Params.HotParams, options: CallOptions = {}): Promise<Models.Hot | undefined> {
    return this.invoke<Models.Hot | undefined>("comment.read.hot", params, options, normalizePayload);
  }

  /** comment.read.list */
  list(params: Params.ListParams, options: CallOptions = {}): Promise<Models.List> {
    return this.invoke<Models.List>("comment.read.list", params, options, normalizePayload);
  }

  /** comment.read.replies */
  replies(params: Params.RepliesParams, options: CallOptions = {}): Promise<Models.List> {
    return this.invoke<Models.List>("comment.read.replies", params, options, normalizePayload);
  }
}
