# TypeScript port design

Port bpi-go at commit add0ff775ef4caff2203d169d15e0d9afe9fb996 into the user-requested empty folder, D:/Dev/bpi_ts. The user explicitly selected Node.js. Preserve all 27 domains and all 206 promoted endpoint contracts, the MIT license, explicit credentials, client isolation, credential host restrictions, bounded responses, WBI signatures, response cookie updates, and JSON/XML/raw response handling.

Use Node.js >=22.12, TypeScript strict mode, native fetch, ESM/CommonJS builds, declarations, and domain subpath exports. The runtime is dependency-free. Public methods use camelCase; request objects and response interfaces retain API wire field names to avoid a second serialization vocabulary. Numeric inputs accept bigint and decimal strings when needed for 64-bit IDs; reject unsafe number inputs. Response decoding preserves large integers rather than silently rounding them.

The shared core owns HTTP, sessions, errors, envelopes and signing. Each domain owns a named client, typed parameter objects and response models. The root Client exposes domain properties. Keep endpoint and model coverage mechanically comparable to the upstream inventory. Specialized login/session flows and compressed XML decoding remain explicit code.

Tests are offline, using upstream sanitized contract fixtures and controlled fetch implementations/local HTTP servers. Verify every promoted contract is callable and its URL, HTTP method, query/body, response mode and signing requirements agree with upstream. Validate malformed inputs, API errors, limits, credential isolation, cancellation, and package imports. Do not run live authenticated API calls. Initialize a fresh Git repository on main; no remote destination was supplied. npm package publication is outside this request.
