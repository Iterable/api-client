# Iterable API Client

[![npm version](https://img.shields.io/npm/v/@iterable/api.svg)](https://www.npmjs.com/package/@iterable/api)

TypeScript client library for the [Iterable API](https://api.iterable.com/api/docs).

This library is currently in active development. While it is used in production by the [Iterable MCP server](https://github.com/Iterable/mcp-server), it is still considered experimental. We are rapidly iterating on features and improvements, so you may encounter breaking changes or incomplete type definitions.

We welcome early adopters and feedback! If you're building with it, please stay in touch via issues or pull requests.

## Installation

```bash
npm install @iterable/api
```

## Quick Start

```typescript
import { IterableClient } from '@iterable/api';

const client = new IterableClient({
  apiKey: 'your-api-key'
});

const user = await client.getUserByEmail({ email: 'user@example.com' });

// Track event
await client.trackEvent({
  email: 'user@example.com',
  eventName: 'purchase',
  dataFields: { amount: 99.99 }
});

// Send email
await client.sendEmail({
  campaignId: 123456,
  recipientEmail: 'user@example.com'
});
```

## Configuration

```typescript
// From environment variables
const client = new IterableClient(createIterableConfig());

// Or configure directly
const client = new IterableClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.iterable.com', // optional
  timeout: 30000, // optional
  debug: true, // log requests/responses (headers/params redacted)
  debugVerbose: false // set true to log response bodies (CAUTION: may contain PII)
});
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ITERABLE_API_KEY` | API key (required when using `createIterableConfig()`) | — |
| `ITERABLE_BASE_URL` | API base URL | `https://api.iterable.com` |
| `ITERABLE_DEBUG` | Log HTTP requests/responses (headers redacted) to stderr | `false` |
| `ITERABLE_DEBUG_VERBOSE` | Include response bodies in debug output (may contain PII) | `false` |
| `LOG_LEVEL` | Log level (`error`, `warn`, `info`, `debug`, etc.) | `debug` when `ITERABLE_DEBUG` is set, otherwise `info` |
| `LOG_FILE` | Write logs to a file | — |
| `LOG_STDERR` | Write logs to stderr | `true` |

## Development

```bash
pnpm install
pnpm build          # Build with linting
pnpm test           # Run all tests
pnpm test:unit      # Unit tests only

# Integration tests (requires API key)
ITERABLE_API_KEY=your-key pnpm test:integration
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
