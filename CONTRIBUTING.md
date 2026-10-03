# Contributing

Use Node.js 22.12+ and npm. Install locked development dependencies with
`npm ci`; run `npm run check` before committing. This checks strict types,
offline behavior and upstream contracts, both builds, and the packaged output.

Source modules live in `src/`, tests in `tests/`, fixtures in
`tests/fixtures/contracts/`, and public documentation in `docs/`. Add tests for
observable behavior when changing transport, validation, response decoding, or
protocols. Tests must remain offline and must use fabricated credentials.

Domain entry points, parameter types, the endpoint catalog, and model schemas
are generated. Change their source metadata or generator, then regenerate as
described in [docs/porting.md](docs/porting.md). Preserve the pinned upstream
revision and MIT attribution. A future upstream update should deliberately
update the provenance, snapshots, and contract fixtures together.

`dist/`, `node_modules/`, coverage, `.env` files, and generated npm archives are
ignored by Git. `npm pack` builds before packing. The package file allowlist
ships `dist/`, README, LICENSE, NOTICE, and npm's required package metadata.
Do not commit live cookies, session identifiers, or refresh tokens.
