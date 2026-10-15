// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';
import { MessageFlows } from './private.js';

export class MessageClient extends MessageFlows {

  /** message.reply_feed */
  replyFeed(params: Params.ReplyFeedParams = {}, options: CallOptions = {}): Promise<Models.ReplyFeed> {
    return this.invoke<Models.ReplyFeed>("message.reply_feed", params, options, normalizePayload);
  }

  /** message.session_messages */
  sessionMessages(params: Params.SessionMessagesParams, options: CallOptions = {}): Promise<Models.SessionMessages> {
    return this.invoke<Models.SessionMessages>("message.session_messages", params, options, normalizePayload);
  }

  /** message.sessions */
  sessions(params: Params.SessionsParams = {}, options: CallOptions = {}): Promise<Models.Sessions> {
    return this.invoke<Models.Sessions>("message.sessions", params, options, normalizePayload);
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
