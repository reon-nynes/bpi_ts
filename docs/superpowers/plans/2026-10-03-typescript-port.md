# TypeScript Port Implementation Plan

> **For agentic workers:** Use the parallel-agent skill for independent core, models and protocol tasks; integrate and verify in the requested folder.

**Goal:** Produce a complete, tested Node.js TypeScript SDK port of bpi-go.

**Architecture:** Shared HTTP/session/signing core with 27 typed domain clients. Source-derived model and endpoint inventories retain upstream traceability; protocol-specific code handles login flows and XML.

**Tech Stack:** Node.js >=22.12, TypeScript strict, native fetch, tsup, Vitest.

**Spec:** ../specs/2026-10-03-typescript-port-design.md

## Global Constraints

- Node.js >=22.12; dependency-free runtime; explicit credentials only.
- Preserve all 27 domains and all 206 promoted contracts.
- camelCase methods; API wire field names for parameter objects and JSON responses.
- Preserve upstream MIT attribution; work in D:/Dev/bpi_ts.

## Review Focus

- Credentials must remain confined to trusted HTTPS hosts across redirects.
- Invalid/unsafe IDs and malformed date/range inputs must fail before network I/O.
- Null, aliased and nonzero envelopes must follow each protocol's semantics.
- Response and decompression limits must bound memory use.
- Concurrent WBI calls and session changes must preserve request isolation.

### Task 1: Transport and signing

Files: src/client/{index,client,account,errors,json,response,sign}.ts, tests/client.test.ts, tests/wbi.test.ts.
Interfaces: CoreClient.request<T>(url, spec), requestRaw(url, spec), do(url, spec), explicit account/cookie methods. Query accepts strings/numbers/bigints/booleans and arrays. RequestSpec carries method, query, body, bodyType, headers, signal, operation, wbi, responseMode.

- [x] Write and observe failing offline transport, envelope, session and WBI tests.
- [x] Implement source-equivalent bounded fetch, redirect policy, session management and signing.
- [x] Run the targeted tests and strict typecheck.

### Task 2: Models and identifiers

Files: src/<domain>/models.ts, src/ids/index.ts, scripts/model generation support, tests/{ids,models}.test.ts.
Interfaces: each domain exports response interfaces matching Go JSON tags and aliases; validated identifier parsers preserve 64-bit precision.

- [x] Write and observe identifier boundary tests failing.
- [x] Convert all response types, aliases and constants, retaining JSON field names.
- [x] Verify every mapped response model resolves and identifier tests pass.

### Task 3: XML and login protocols

Files: src/danmaku/xml.ts, src/login/flows.ts, tests/protocols.test.ts.
Interfaces: LoginFlows(core) supplies special QR/session operations; parseDeflateXML(body, maxBytes) decodes bounded raw deflate and comment metadata.

- [x] Write failing raw-deflate, malformed XML/metadata, QR and response cookie-update tests.
- [x] Implement source-equivalent protocol handling without live network calls.
- [x] Verify targeted tests and strict typecheck.

### Task 4: All domain contracts and package integration

Files: src/<domain>/{index,params}.ts, src/index.ts, scripts/, tests/contracts.test.ts, tests/fixtures/, docs/api.md, README.md, LICENSE, NOTICE, CI and package configuration.
Interfaces: Client domain properties, domain methods(params, {signal}), typed wire parameter interfaces, endpoint catalog and upstream mapping metadata.

- [x] Write failing coverage and representative request tests against the 206-contract inventory.
- [x] Port query defaults, validation, signing and response modes; integrate specialist modules.
- [x] Execute all offline contract fixtures; repair gaps against source.
- [x] Verify typecheck, full tests, builds, packed ESM/CommonJS and subpath imports.
- [x] Request independent code review, resolve material findings, initialize Git and commit verified package.
