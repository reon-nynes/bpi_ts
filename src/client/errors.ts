import { inspect } from 'node:util';

export const ErrMissingData = new Error('bpi: response is missing required data');
export const ErrAuthenticationRequired = new Error('bpi: authentication required');

export class ParameterError extends Error {
  constructor(public readonly field: string, detail: string) {
    super(`bpi: invalid ${field}: ${detail}`);
    this.name = 'ParameterError';
  }
}

export class TransportError extends Error {
  #reason: unknown;
  constructor(public readonly operation: string, reason: unknown) {
    super(`bpi: ${operation} transport request failed`);
    this.name = 'TransportError';
    this.#reason = reason;
  }
  override get cause(): unknown { return this.#reason; }
  [inspect.custom](): string { return `${this.name}: ${this.message}`; }
  toJSON(): object { return { name: this.name, message: this.message, operation: this.operation }; }
}

export class HTTPError extends Error {
  constructor(public readonly statusCode: number) {
    super(`bpi: HTTP request failed with status ${statusCode}`);
    this.name = 'HTTPError';
  }
}

export class APIError extends Error {
  constructor(public readonly code: number, public readonly apiMessage = '') {
    super(`bpi: remote interface returned code ${code}${apiMessage && apiMessage !== '0' ? `: ${apiMessage}` : ''}`);
    this.name = 'APIError';
  }
}

/** The body is available only through body(), which returns a detached copy. */
export class ResponseDecodeError extends Error {
  #bytes: Uint8Array;
  #reason: unknown;
  constructor(reason: unknown, body: Uint8Array | string) {
    // Parser diagnostics can contain response snippets. Keep the reason private.
    super('bpi: failed to decode response');
    this.name = 'ResponseDecodeError';
    this.#reason = reason;
    this.#bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body.slice();
  }
  override get cause(): unknown { return this.#reason; }
  body(): Uint8Array { return this.#bytes.slice(); }
  [inspect.custom](): string { return `${this.name}: ${this.message}`; }
  toJSON(): object { return { name: this.name, message: this.message }; }
}

export class ResponseTooLargeError extends Error {
  constructor(public readonly limit: number) {
    super(`bpi: response exceeds ${limit}-byte limit`);
    this.name = 'ResponseTooLargeError';
  }
}

function causes(error: unknown): unknown[] {
  const result: unknown[] = [];
  const visited = new Set<unknown>();
  while (error !== undefined && !visited.has(error)) {
    visited.add(error); result.push(error);
    error = error instanceof Error ? error.cause : undefined;
  }
  return result;
}

export function requiresLogin(error: unknown): boolean {
  return causes(error).some(value => value === ErrAuthenticationRequired ||
    value instanceof APIError && [-101, -401, 4100000, 4511003, 800501007].includes(value.code) ||
    value instanceof HTTPError && value.statusCode === 401);
}
export function requiresVIP(error: unknown): boolean {
  return causes(error).some(value => value instanceof APIError && [-106, -650].includes(value.code));
}
export function isPermissionError(error: unknown): boolean {
  return causes(error).some(value => value instanceof APIError && [-403, -4, 79511, 100004, 100007].includes(value.code) || value instanceof HTTPError && value.statusCode === 403);
}
export function isRiskControl(error: unknown): boolean {
  return causes(error).some(value => value instanceof APIError && [-352, -412].includes(value.code) || value instanceof HTTPError && value.statusCode === 412);
}
