# Porting and source provenance

This package ports the promoted surface of
[bpi-go at add0ff775ef4caff2203d169d15e0d9afe9fb996](https://github.com/Yuelioi/bpi-go/tree/add0ff775ef4caff2203d169d15e0d9afe9fb996):
27 domains and 206 API contracts. The [API inventory](api.md) maps each contract
to its TypeScript method. All mapped methods execute a request and decode its
response; the inventory is also checked by the tests.

## TypeScript adaptations

| Go surface | TypeScript surface |
| --- | --- |
| Root client and domain accessors | `new Client(options)` with readonly domain properties |
| Fluent parameter builders | Typed parameter objects using the API wire names |
| `context.Context` | Final optional `{ signal: AbortSignal }` call argument |
| `(T, error)` | `Promise<T>` with typed thrown errors |
| Optional pointer payload | `T \| undefined` |
| Signed/unsigned 64-bit model integer | `number \| bigint`, retaining exact values |
| Validated ID wrapper | Branded types and parsers in `bpi-ts/ids` |
| Raw byte/protobuf payload | `Uint8Array` |
| JSON `RawMessage` | Losslessly parsed `JSONValue` |
| Shared domain client | Named domain class accepting a `CoreClient` |

Methods use camelCase, including `playURL`, `generateQR`, and `xmlList`. Models
retain JSON tag names; the XML decoder retains the Go model's camelCase fields.
Integer inputs accept bigint or decimal strings to cover values above
`Number.MAX_SAFE_INTEGER`. Model decoding enforces the source integer widths,
float32 rounding, missing-field zero values, pointer/null behavior, and custom
wire decoding. Computed fields excluded by `json:"-"` cannot be injected through
incoming JSON.

Explicit credentials, HTTPS host restrictions, cookie absorption, hourly WBI
key caching, and bounded HTTP/XML decoding are retained. Requests capture an
isolated session before asynchronous signing; a stale response cannot write
cookies into a replacement session. Cross-origin redirects strip credentials,
and sensitive POST bodies are not replayed to another origin. QR polling returns
inner business statuses only after checking the outer envelope's success.

The Go project's general documentation mentions session refresh. Its pinned
implementation absorbs `Set-Cookie`; it does not implement RSA correspondence
or refresh-token renewal endpoints. The TypeScript package implements that
existing behavior. QR success can return the upstream `refresh_token` field,
but this field does not imply a token-renewal API.

## Generated files

`scripts/upstream/provenance.json` records the source repository and commit.
`scripts/upstream/domains.json` contains audited endpoint metadata. It is
extracted from Go encoders and contract fixtures, then corrected for behaviors
that require source interpretation in `scripts/adjust-domains.mjs`.

`scripts/models-source.json` contains parsed response schemas, constants, source
file SHA-256 hashes, and the custom decoder inventory. The snapshot covers 80
upstream source files, 510 types, and 124 constants. `scripts/models-runtime.ts`
is the maintained decoder template.

The following outputs are generated:

- `src/<domain>/models.ts` and `src/internal/models.ts`
- `src/<domain>/params.ts` and `src/<domain>/index.ts`
- `src/internal/catalog.ts`, `src/index.ts`, and `docs/api.md`

Change the corresponding snapshot, audited metadata adjustment, or generator
instead of editing an output by hand. `src/client`, `src/ids`,
`src/internal/domain.ts`, `src/danmaku/xml.ts`, and `src/login/flows.ts` are
maintained directly.

## Reproduce from the checked-in snapshots

Run from the repository root:

```sh
node scripts/models.mjs
node scripts/generate-domains.mjs
npm run check
```

Regeneration is deterministic. Check `git diff` after running the generators.
The `adjust-domains` step is part of fresh extraction, not ordinary snapshot
regeneration.

## Re-extract the pinned upstream source

```sh
git clone https://github.com/Yuelioi/bpi-go.git /path/to/bpi-go
git -C /path/to/bpi-go checkout add0ff775ef4caff2203d169d15e0d9afe9fb996
node scripts/extract-domains.mjs /path/to/bpi-go
node scripts/adjust-domains.mjs
node scripts/generate-domains.mjs
node scripts/models.mjs --source /path/to/bpi-go
npm run check
```

Both source extraction scripts reject a checkout at another revision. Use a
clean checkout: commit validation identifies HEAD, and the model snapshot
records source-file hashes. Extraction copies the upstream MIT license and
sanitized contract fixtures into this project.

## Verification scope

Tests exercise every promoted contract against the upstream request and response
fixtures, plus source defaults, parameter boundaries, lossless JSON, custom
model decoding, XML, QR protocols, cancellation, redirect policy, concurrent
session changes, and WBI signing. Package checks use an installed tarball in a
temporary consumer rather than importing source files. Tests do not contact
the live Bilibili service. Upstream API availability and permissions can change
independently of the pinned contract fixtures.
