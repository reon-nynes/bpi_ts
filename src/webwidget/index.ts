// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
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
