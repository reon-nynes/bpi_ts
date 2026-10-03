// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';
import { LoginFlows } from './flows.js';
import type { CoreClient } from '../client/index.js';
export * from './flows.js';

export class LoginClient extends LoginFlows {
  private readonly domain: LoginDomain;
  constructor(core: CoreClient) { super(core); this.domain = new LoginDomain(core); }

  /** login.account_info */
  accountInfo(options: CallOptions = {}): Promise<Models.AccountInfo> {
    return this.domain.call<Models.AccountInfo>("login.account_info", {}, options, normalizePayload);
  }

  /** login.captcha_generate */
  generateCaptcha(options: CallOptions = {}): Promise<Models.Captcha> {
    return this.domain.call<Models.Captcha>("login.captcha_generate", {}, options, normalizePayload);
  }

  /** login.coin */
  coin(options: CallOptions = {}): Promise<Models.CoinBalance> {
    return this.domain.call<Models.CoinBalance>("login.coin", {}, options, normalizePayload);
  }

  /** login.daily_reward */
  dailyReward(options: CallOptions = {}): Promise<Models.DailyReward> {
    return this.domain.call<Models.DailyReward>("login.daily_reward", {}, options, normalizePayload);
  }

  /** login.log */
  log(params: Params.LogParams = {}, options: CallOptions = {}): Promise<Models.Log> {
    return this.domain.call<Models.Log>("login.log", params, options, normalizePayload);
  }

  /** login.nav */
  nav(options: CallOptions = {}): Promise<Models.Nav> {
    return this.domain.call<Models.Nav>("login.nav", {}, options, normalizePayload);
  }

  /** login.notice */
  notice(params: Params.NoticeParams, options: CallOptions = {}): Promise<Models.Notice> {
    return this.domain.call<Models.Notice>("login.notice", params, options, normalizePayload);
  }

  /** login.qr_generate */
  generateQR(options: CallOptions = {}): Promise<Models.QRGenerate> {
    return this.domain.call<Models.QRGenerate>("login.qr_generate", {}, options, normalizePayload);
  }

  /** login.stat */
  stat(options: CallOptions = {}): Promise<Models.Stats> {
    return this.domain.call<Models.Stats>("login.stat", {}, options, normalizePayload);
  }

  /** login.today_coin_exp */
  todayCoinExp(options: CallOptions = {}): Promise<Models.TodayCoinExp> {
    return this.domain.call<Models.TodayCoinExp>("login.today_coin_exp", {}, options, normalizePayload);
  }

  /** login.vip_info */
  vipInfo(options: CallOptions = {}): Promise<Models.VIPInfo> {
    return this.domain.call<Models.VIPInfo>("login.vip_info", {}, options, normalizePayload);
  }
}

class LoginDomain extends DomainClient {
  call<T>(contract: string,params:object,options:CallOptions,normalize:(model:string,payload:unknown)=>unknown):Promise<T> { return this.invoke(contract,params,options,normalize); }
}
