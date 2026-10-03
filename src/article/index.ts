// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class ArticleClient extends DomainClient {

  /** article.articles_info */
  articles(params: Params.ArticlesInfoParams, options: CallOptions = {}): Promise<Models.Articles> {
    return this.invoke<Models.Articles>("article.articles_info", params, options, normalizePayload);
  }

  /** article.cards */
  cards(params: Params.CardsParams, options: CallOptions = {}): Promise<Models.CardData> {
    return this.invoke<Models.CardData>("article.cards", params, options, normalizePayload);
  }

  /** article.info */
  info(params: Params.InfoParams, options: CallOptions = {}): Promise<Models.Info> {
    return this.invoke<Models.Info>("article.info", params, options, normalizePayload);
  }

  /** article.view */
  view(params: Params.ViewParams, options: CallOptions = {}): Promise<Models.View> {
    return this.invoke<Models.View>("article.view", params, options, normalizePayload);
  }
}
