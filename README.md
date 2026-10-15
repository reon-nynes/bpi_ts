# bpi-ts

A typed Node.js SDK for the Bilibili HTTP API, ported from
[Yuelioi/bpi-go](https://github.com/Yuelioi/bpi-go/tree/471c3b2b7a8207d51024f15f7117b92f6ebad2aa).
It implements all **209 promoted API contracts across 27 domains**, with 519
response and supporting types and 127 model constants from upstream v0.3.1.

Requires **Node.js 22.12 or later**. The package has no runtime dependencies and
ships ESM, CommonJS, TypeScript declarations, and domain subpath exports.

## Build and install locally

```sh
npm ci
npm run check
npm pack
```

Install the generated archive into another project:

```sh
npm install /path/to/bpi-ts-0.1.0.tgz
```

The package name is `bpi-ts`; publishing and an npm namespace can be configured
when choosing a distribution destination.

## Read a video

```ts
import { Client } from 'bpi-ts';

const client = new Client();
const video = await client.video.view({ bvid: 'BV1xx411c7mD' });
console.log(video.title, video.owner.name);
```

Use exactly one `aid` or `bvid` for methods that accept a video identifier.
Method names use camelCase. Parameter objects and response models retain the
API's wire field names: `page_size`, `qrcode_key`, `isLogin`, and similar names
are intentional. See the [complete method inventory](docs/api.md) for every
upstream contract's TypeScript equivalent.

## Credentials and cancellation

Credentials are supplied explicitly. Constructing a client performs no network
requests and reads no files, browser profiles, or environment variables.

```ts
import { Client } from 'bpi-ts';

const cookie = process.env.BILIBILI_COOKIE;
const client = new Client({
  ...(cookie ? { cookie } : {}),
  timeout: 10_000,
  maxResponseBytes: 16 * 1024 * 1024,
});

const nav = await client.login.nav({ signal: AbortSignal.timeout(5_000) });
console.log(nav.isLogin);
```

Alternatively, pass an `account` object with `dedeUserID`, `sessdata`, `biliJct`,
and `buvid3` fields. The `cookie` and `account` options are mutually exclusive.
Use `setCookie()`, `setAccount()`, and `clearAccount()` to replace a session;
`account()` returns a detached copy and its default inspection is redacted.

All domain methods accept an optional final `{ signal }` argument. Timeouts are
in milliseconds; the default is 10 seconds. The default response limit is
16 MiB. Credentials and automatic response cookie updates are confined to
trusted HTTPS Bilibili hosts. Each request captures its own session, so a
pending response cannot overwrite a newly selected or cleared account.

WBI signatures, hourly key caching, CSRF fields, and `Set-Cookie` updates are
handled by the shared client. RSA-based refresh-token renewal is outside the
pinned upstream implementation.

## Large identifiers and JSON

Supply safe integer numbers, bigint values, or decimal integer strings for
integer parameters. Unsafe JavaScript number inputs fail before a request is
sent. Decoded integers outside the safe-number range become bigint values;
64-bit model fields therefore use `number | bigint`.

```ts
import { ids, parseJSON, stringifyJSON } from 'bpi-ts';

const mid = ids.parseMID('9007199254740993'); // bigint
const value = parseJSON('{"mid":9007199254740993}');
const text = stringifyJSON(value); // emits the integer without rounding
console.log(mid, text);
```

Native `JSON.stringify()` cannot serialize bigint. Use the exported
`stringifyJSON()` when retaining numeric JSON tokens is necessary. Response
normalizers implement Go zero values, integer bounds, float32 rounding, and
the upstream custom decoders for mixed wire representations.

## Use individual domains

```ts
import { CoreClient } from 'bpi-ts/client';
import { VideoClient, type View } from 'bpi-ts/video';

const videos = new VideoClient(new CoreClient());
const view: View = await videos.view({ aid: 170001 });
```

The root exposes `activity`, `article`, `audio`, `bangumi`, `cheese`, `clientInfo`,
`comment`, `creativeCenter`, `danmaku`, `dynamic`, `electric`, `fav`,
`historyToView`, `live`, `login`, `manga`, `message`, `misc`, `note`, `opus`,
`search`, `user`, `video`, `videoRanking`, `vip`, `wallet`, and `webWidget`.

Import paths use lowercase source directory names, such as
`bpi-ts/clientinfo`, `bpi-ts/creativecenter`, `bpi-ts/historytoview`,
`bpi-ts/videoranking`, and `bpi-ts/webwidget`. CommonJS is also supported:

```js
const { Client } = require('bpi-ts');
const client = new Client();
```

## QR login and danmaku

```ts
const challenge = await client.login.generateQR();
// Present challenge.url using your application's QR renderer.
const status = await client.login.pollQR({ qrcode_key: challenge.qrcode_key });
console.log(status.code, status.message);
```

Polling is explicit. Waiting, scanned, expired, and success codes in the QR
payload are returned to the caller; an unsuccessful outer API envelope throws.
On success, response cookies update the client's session. `qr()` / `qrFlow()`
generate a challenge and perform its first poll. `navState()` provides the
special guest navigation-data behavior; `nav()` checks API success normally.

`client.danmaku.xmlList({ oid: 170001 })` returns parsed compressed XML with
typed comments. `parseDeflateXML()` is exported from `bpi-ts/danmaku` for direct
bounded decoding. Protobuf endpoints return `Uint8Array` for the caller's
chosen protobuf decoder.

## Private messages

```ts
import { SessionUserAndSystem } from 'bpi-ts/message';

const sessions = await client.message.sessions({ session_type: SessionUserAndSystem });
const history = await client.message.sessionMessages({ talker_id: 1000001, size: 20 });
const sent = await client.message.send({ receiver_id: 1000001, text: 'Hello' });
console.log(sessions.has_more, history.min_seqno, sent.msg_key);
```

Reads do not mark messages as read. Session lists default to type 4 and 100
items. For history pagination, upstream recommends querying types 1 and 2
separately and detecting repeated cursors because type 4 can ignore `end_ts`.
Session timestamps use microseconds; message-history cursors use sequence
numbers. A session's `last_msg` may be null or absent on the wire.

Sending requires a complete account and CSRF token. Supply exactly one `text`
or `image` field. Images use the exported `SendImage` shape with `url`, `height`,
`width`, and `size`; the SDK does not upload images. `receiver_type` defaults
to 1 and also accepts 2. The client generates a UUIDv4, signs the query with
WBI, and sends a separate form body. Text preserves whitespace and must fit
within 2000 UTF-8 bytes after JSON encoding. Sends are not retried. Check for a
nonzero `msg_key` before treating a response as confirmed delivery.

## Errors and custom transport

`ParameterError` reports invalid input. `APIError` exposes `code` and
`apiMessage`; `requiresLogin()`, `requiresVIP()`, `isPermissionError()`, and
`isRiskControl()` classify upstream API codes. `HTTPError`, `TransportError`,
`ResponseDecodeError`, and `ResponseTooLargeError` distinguish other failures.

```ts
import { APIError, requiresLogin } from 'bpi-ts';

try {
  await client.login.nav();
} catch (error) {
  if (error instanceof APIError && requiresLogin(error)) {
    console.log('A logged-in session is required.');
  } else {
    throw error;
  }
}
```

`new Client({ fetch })` accepts a Fetch-compatible transport for tests or a
custom network stack. `logger` receives structured events with sensitive URL
parameters redacted. The lower-level `CoreClient.request()`, `requestRaw()`,
and `do()` expose envelope, byte, and HTTP-response handling.

## Development and provenance

```sh
npm run typecheck
npm test
npm run build
npm run test:package
```

`npm run check` runs all four. Tests use the upstream sanitized fixtures and
controlled local transports; no live authenticated API calls are required.
Package checks install the actual tarball in a temporary project and verify
both module formats, every public subpath, shared error identities, and typed
consumer imports. CI runs the same checks on Linux and Windows, Node.js 22/24.

Source is organized under `src/client`, `src/ids`, `src/internal`, and one
directory per domain. Tests and fixtures live under `tests`; extraction and
reproducible generation scripts live under `scripts`. Read
[porting and regeneration notes](docs/porting.md) before changing generated
files, and [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.

Upstream revision: `471c3b2b7a8207d51024f15f7117b92f6ebad2aa`.
The MIT license and original attribution are preserved in [LICENSE](LICENSE)
and [NOTICE](NOTICE).
