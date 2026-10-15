// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class MiscClient extends DomainClient {

  /** misc.b23tv.short_link */
  shortLink(params: Params.ShortLinkParams, options: CallOptions = {}): Promise<Models.ShortLink> {
    return this.invoke<Models.ShortLink>("misc.b23tv.short_link", params, options, normalizePayload);
  }

  /** misc.bili_ticket */
  biliTicket(options: CallOptions = {}): Promise<Models.Ticket> {
    return this.invoke<Models.Ticket>("misc.bili_ticket", {}, options, normalizePayload);
  }

  /** misc.buvid */
  buvid(options: CallOptions = {}): Promise<Models.Buvid> {
    return this.invoke<Models.Buvid>("misc.buvid", {}, options, normalizePayload);
  }

  /** misc.buvid3 */
  buvid3(options: CallOptions = {}): Promise<Models.Buvid3> {
    return this.invoke<Models.Buvid3>("misc.buvid3", {}, options, normalizePayload);
  }

  async biliTicketString(options: CallOptions = {}): Promise<string> { return (await this.biliTicket(options)).ticket; }
}
