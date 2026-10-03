// API wire parameter names; derived from the pinned bpi-go encoders.
import type { IntegerInput } from '../internal/domain.js';
export type { IntegerInput } from '../internal/domain.js';

/** Parameters for article.articles_info. */
export interface ArticlesInfoParams {
  "id": IntegerInput;
}

/** Parameters for article.cards. */
export interface CardsParams {
  "ids": string;
  "web_location"?: string;
}

/** Parameters for article.info. */
export interface InfoParams {
  "id": IntegerInput;
}

/** Parameters for article.view. */
export interface ViewParams {
  "id": IntegerInput;
  "gaia_source"?: string;
}
