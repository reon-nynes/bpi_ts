// Endpoint methods ported from bpi-go 471c3b2b7a8207d51024f15f7117b92f6ebad2aa.
import { DomainClient, type CallOptions } from '../internal/domain.js';
import type * as Models from './models.js';
import { normalizePayload } from './models.js';
import type * as Params from './params.js';
export * from './models.js';
export * from './params.js';
export { parseDeflateXML } from './xml.js';

export class DanmakuClient extends DomainClient {

  /** danmaku.adv.state */
  advState(params: Params.AdvStateParams, options: CallOptions = {}): Promise<Models.AdvState> {
    return this.invoke<Models.AdvState>("danmaku.adv.state", params, options, normalizePayload);
  }

  /** danmaku.history.dates */
  historyDates(params: Params.HistoryDatesParams, options: CallOptions = {}): Promise<Array<string> | undefined> {
    return this.invoke<Array<string> | undefined>("danmaku.history.dates", params, options, normalizePayload);
  }

  /** danmaku.history.xml */
  historyXMLBytes(params: Params.HistoryBytesParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.history.xml", params, options, normalizePayload);
  }

  /** danmaku.mobile.seg */
  mobileSegment(params: Params.SegmentParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.mobile.seg", params, options, normalizePayload);
  }

  /** danmaku.snapshot */
  snapshot(params: Params.SnapshotParams, options: CallOptions = {}): Promise<Array<string>> {
    return this.invoke<Array<string>>("danmaku.snapshot", params, options, normalizePayload);
  }

  /** danmaku.thumbup.stats */
  thumbupStats(params: Params.ThumbupStatsParams, options: CallOptions = {}): Promise<Models.ThumbupStats> {
    return this.invoke<Models.ThumbupStats>("danmaku.thumbup.stats", params, options, normalizePayload);
  }

  /** danmaku.web.history_seg */
  webHistorySegment(params: Params.HistoryBytesParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.web.history_seg", params, options, normalizePayload);
  }

  /** danmaku.web.seg */
  webSegment(params: Params.SegmentParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.web.seg", params, options, normalizePayload);
  }

  /** danmaku.web.seg_wbi */
  webSegmentWBI(params: Params.SegmentParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.web.seg_wbi", params, options, normalizePayload);
  }

  /** danmaku.web.view */
  webView(params: Params.WebViewParams, options: CallOptions = {}): Promise<Uint8Array> {
    return this.invoke<Uint8Array>("danmaku.web.view", params, options, normalizePayload);
  }

  /** danmaku.xml.comment_xml */
  xmlList(params: Params.XMLListParams, options: CallOptions = {}): Promise<Models.XML> {
    return this.invoke<Models.XML>("danmaku.xml.comment_xml", params, options, normalizePayload);
  }

  /** danmaku.xml.list_so */
  xmlListSO(params: Params.XMLListParams, options: CallOptions = {}): Promise<Models.XML> {
    return this.invoke<Models.XML>("danmaku.xml.list_so", params, options, normalizePayload);
  }
}
