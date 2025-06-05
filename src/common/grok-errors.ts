export class GrokError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: unknown
  ) {
    super(message);
    this.name = "GrokError";
  }
}

export class GrokValidationError extends GrokError {
  constructor(message: string, status: number, response: unknown) {
    super(message, status, response);
    this.name = "GrokValidationError";
  }
}

export class GrokResourceNotFoundError extends GrokError {
  constructor(resource: string) {
    super(`Resource not found: ${resource}`, 404, {
      message: `${resource} not found`,
    });
    this.name = "GrokResourceNotFoundError";
  }
}

export class GrokAuthenticationError extends GrokError {
  constructor(message = "Authentication failed") {
    super(message, 401, { message });
    this.name = "GrokAuthenticationError";
  }
}

export class GrokPermissionError extends GrokError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, { message });
    this.name = "GrokPermissionError";
  }
}

export class GrokRateLimitError extends GrokError {
  constructor(message = "Rate limit exceeded", public readonly resetAt: Date) {
    super(message, 429, { message, reset_at: resetAt.toISOString() });
    this.name = "GrokRateLimitError";
  }
}

export class GrokBadRequestError extends GrokError {
  constructor(message: string) {
    super(message, 400, { message });
    this.name = "GrokBadRequestError";
  }
}

export class GrokServerError extends GrokError {
  constructor(message = "Server error") {
    super(message, 500, { message });
    this.name = "GrokServerError";
  }
}

export function isGrokError(error: unknown): error is GrokError {
  return error instanceof GrokError;
}

export function createGrokError(status: number, data: any): GrokError {
  let message =
    data?.message || data?.error?.message || `Grok API error: Status ${status}`;

  switch (status) {
    case 400:
      return new GrokBadRequestError(message);
    case 401:
      return new GrokAuthenticationError(message);
    case 403:
      return new GrokPermissionError(message);
    case 404:
      return new GrokResourceNotFoundError(message);
    case 429:
      let resetAt: Date;
      if (data && data.reset_at) {
        const parsed = new Date(data.reset_at);
        resetAt = isNaN(parsed.getTime()) ? new Date(Date.now() + 60 * 60 * 1000) : parsed;
      } else {
        resetAt = new Date(Date.now() + 60 * 60 * 1000);
      }
      return new GrokRateLimitError(message, resetAt);
    case 500:
    case 502:
    case 503:
    case 504:
      return new GrokServerError(message);
    default:
      return new GrokError(message, status, data);
  }
}
