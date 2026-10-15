import { randomUUID } from 'node:crypto';
import { decodeEnvelope, ErrAuthenticationRequired, ParameterError, ResponseDecodeError, stringifyJSON } from '../client/index.js';
import { DomainClient, integer, type CallOptions, type IntegerInput } from '../internal/domain.js';
import { normalizePayload, type Image, type SendResult } from './models.js';

export type SendImage = Omit<Image, 'height' | 'width' | 'original'> & {
  height: IntegerInput;
  width: IntegerInput;
  original?: IntegerInput | null;
};

/** Supply exactly one text or image payload. Sender and device fields are derived. */
export type SendParams = { receiver_id: IntegerInput; receiver_type?: 1 | 2 } & (
  | { text: string; image?: never }
  | { image: SendImage; text?: never }
);

function uint64(name: string, value: unknown, min = 0): number | bigint | string {
  return integer({ name, type: 'integer', required: true, min }, value);
}

function encodeContent(params: SendParams): { kind: number; content: string } {
  if ((params.text !== undefined) === (params.image !== undefined)) throw new ParameterError('message', 'supply exactly one text or image payload');
  if (params.text !== undefined) {
    const text = params.text;
    // Go strings.TrimSpace uses Unicode White_Space, including U+0085 but not U+FEFF.
    if (typeof text !== 'string' || /^\p{White_Space}*$/u.test(text) || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)) {
      throw new ParameterError('message', 'text must be valid nonblank UTF-8');
    }
    const content = JSON.stringify({ content: text });
    if (Buffer.byteLength(content, 'utf8') > 2000) throw new ParameterError('message', 'encoded text exceeds 2000 bytes');
    return { kind: 1, content };
  }
  const image = params.image;
  if (!image || typeof image !== 'object' || Array.isArray(image)) throw new ParameterError('image', 'image must be an object');
  const wire = {
    ...image,
    height: BigInt(uint64('height', image.height ?? 0)),
    width: BigInt(uint64('width', image.width ?? 0)),
    original: image.original == null ? null : BigInt(uint64('original', image.original)),
  };
  let normalized: unknown;
  try { normalized = normalizePayload('Image', wire); }
  catch { throw new ParameterError('image', 'image fields must match the upstream Image model'); }
  // Go json.Marshal escapes HTML and Unicode separators for image payloads.
  const content = stringifyJSON(normalized).replace(/[<>&\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return { kind: 2, content };
}

/** Private sending needs a signed query and a separate form body. */
export class MessageFlows extends DomainClient {
  /** Send once without retrying. A missing or zero msg_key does not confirm delivery. */
  async send(params: SendParams, options: CallOptions = {}): Promise<SendResult> {
    if (!params || typeof params !== 'object' || Array.isArray(params)) throw new ParameterError('params', 'parameters must be an object');
    for (const key of Object.keys(params)) if (!['receiver_id', 'receiver_type', 'text', 'image'].includes(key)) throw new ParameterError(key, 'unsupported parameter');
    const receiver = String(BigInt(uint64('receiver_id', params.receiver_id, 1)));
    const receiverType = integer({ name: 'receiver_type', type: 'integer', required: false, min: 1, max: 2 }, params.receiver_type ?? 1);
    const { kind, content } = encodeContent(params);
    const csrf = this.core.csrf();
    const account = this.core.account();
    if (!account) throw ErrAuthenticationRequired;
    const device = randomUUID();
    const response = await this.core.do('https://api.vc.bilibili.com/web_im/v1/web_im/send_msg', {
      ...options, method: 'POST', operation: 'message.private.send', wbi: true,
      query: { w_sender_uid: account.dedeUserID, w_receiver_id: receiver, w_dev_id: device },
      bodyType: 'form',
      body: {
        'msg[sender_uid]': account.dedeUserID, 'msg[receiver_id]': receiver, 'msg[receiver_type]': receiverType,
        'msg[msg_type]': kind, 'msg[msg_status]': '0', 'msg[dev_id]': device,
        'msg[timestamp]': Math.floor(this.core.now().getTime() / 1000), 'msg[new_face_version]': '1',
        'msg[content]': content, csrf, csrf_token: csrf, mobi_app: 'web', build: '0',
      },
    });
    const payload = decodeEnvelope(response.body).intoPayload();
    try { return normalizePayload('SendResult', payload) as SendResult; }
    catch (error) { throw new ResponseDecodeError(error, response.body); }
  }
}
