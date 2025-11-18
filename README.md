# Iterable API Client

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

const user = await client.getUserByEmail('user@example.com');

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

```bash
ITERABLE_API_KEY=your-api-key     # Required
ITERABLE_DEBUG=true               # Enable basic debug logging
ITERABLE_DEBUG_VERBOSE=true       # Enable full body logging (includes PII)
LOG_LEVEL=info                    # Log level
LOG_FILE=./logs/iterable.log      # Log to file
```

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
