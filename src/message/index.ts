// Endpoint methods ported from bpi-go add0ff775ef4caff2203d169d15e0d9afe9fb996.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';

export class MessageClient extends DomainClient {

  /** message.reply_feed */
  replyFeed(params: Params.ReplyFeedParams = {}, options: CallOptions = {}): Promise<Models.ReplyFeed> {
    return this.invoke<Models.ReplyFeed>("message.reply_feed", params, options, normalizePayload);
  }

  /** message.single_unread */
  singleUnread(params: Params.SingleUnreadParams = {}, options: CallOptions = {}): Promise<Models.SingleUnread> {
    return this.invoke<Models.SingleUnread>("message.single_unread", params, options, normalizePayload);
  }

  /** message.unread_count */
  unreadCount(params: Params.UnreadCountParams = {}, options: CallOptions = {}): Promise<Models.UnreadCount> {
    return this.invoke<Models.UnreadCount>("message.unread_count", params, options, normalizePayload);
  }
}
