// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class WebWidgetClient extends DomainClient {

  /** web_widget.header_page */
  headerPage(params: Params.HeaderPageParams = {}, options: CallOptions = {}): Promise<Models.HeaderData> {
    return this.invoke<Models.HeaderData>("web_widget.header_page", params, options, normalizePayload);
  }

  /** web_widget.online */
  online(options: CallOptions = {}): Promise<Models.OnlineData> {
    return this.invoke<Models.OnlineData>("web_widget.online", {}, options, normalizePayload);
  }

  /** web_widget.region_banner */
  regionBanner(params: Params.RegionBannerParams, options: CallOptions = {}): Promise<Models.RegionBannerData> {
    return this.invoke<Models.RegionBannerData>("web_widget.region_banner", params, options, normalizePayload);
  }
}
