// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class MangaClient extends DomainClient {

  /** manga.clock_in_info */
  clockInInfo(options: CallOptions = {}): Promise<Models.ClockInInfo> {
    return this.invoke<Models.ClockInInfo>("manga.clock_in_info", {}, options, normalizePayload);
  }

  /** manga.coupons */
  coupons(params: Params.CouponsParams = {}, options: CallOptions = {}): Promise<Models.Coupons> {
    return this.invoke<Models.Coupons>("manga.coupons", params, options, normalizePayload);
  }

  /** manga.point_products */
  pointProducts(options: CallOptions = {}): Promise<Array<Models.Product>> {
    return this.invoke<Array<Models.Product>>("manga.point_products", {}, options, normalizePayload);
  }

  /** manga.season_info */
  seasonInfo(options: CallOptions = {}): Promise<Models.SeasonInfo> {
    return this.invoke<Models.SeasonInfo>("manga.season_info", {}, options, normalizePayload);
  }

  /** manga.user_point */
  userPoint(options: CallOptions = {}): Promise<Models.UserPoint> {
    return this.invoke<Models.UserPoint>("manga.user_point", {}, options, normalizePayload);
  }
}
