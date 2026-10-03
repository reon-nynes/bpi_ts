// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class HistoryToViewClient extends DomainClient {

  /** historytoview.history_list */
  historyList(params: Params.ListParams = {}, options: CallOptions = {}): Promise<Models.HistoryList> {
    return this.invoke<Models.HistoryList>("historytoview.history_list", params, options, normalizePayload);
  }

  /** historytoview.history_shadow */
  historyShadow(options: CallOptions = {}): Promise<boolean> {
    return this.invoke<boolean>("historytoview.history_shadow", {}, options, normalizePayload);
  }

  /** historytoview.toview_list */
  toViewList(options: CallOptions = {}): Promise<Models.ToViewList> {
    return this.invoke<Models.ToViewList>("historytoview.toview_list", {}, options, normalizePayload);
  }
}
