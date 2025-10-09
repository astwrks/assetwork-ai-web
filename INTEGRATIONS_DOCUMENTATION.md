# AssetWorks Integration Documentation

## Overview

This document provides comprehensive guidance for integrating external data sources and AI providers into the AssetWorks platform. The system supports:

- **AI Providers**: OpenAI, Anthropic, Google AI, Groq
- **Stock Market Data**: Alpha Vantage, Polygon.io, Finnhub
- **Cryptocurrency Data**: CoinMarketCap, CoinGecko

All API keys are encrypted using AES-256-GCM before storage and never exposed in plain text.

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [API Key Management](#api-key-management)
3. [AI Integration](#ai-integration)
4. [Data Sources Integration](#data-sources-integration)
5. [Frontend Integration](#frontend-integration)
6. [Security Best Practices](#security-best-practices)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

---

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL="mongodb://localhost:27017/assetworks"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# API Key Encryption (REQUIRED)
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"
```

### Generate Encryption Key

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# OpenSSL
openssl rand -hex 16
```

**⚠️ Important**: Store the `ENCRYPTION_KEY` securely. If lost, all encrypted API keys become unrecoverable.

---

## API Key Management

### Backend API: `/api/keys`

#### Add New API Key

```typescript
// POST /api/keys
const response = await fetch('/api/keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My OpenAI Key',
    provider: 'openai',
    category: 'ai',
    apiKey: 'sk-proj-abc123...',
    metadata: {
      description: 'Production API key',
      tier: 'paid'
    }
  })
});

const data = await response.json();
// {
//   success: true,
//   key: {
//     id: "...",
//     name: "My OpenAI Key",
//     provider: "openai",
//     category: "ai",
//     keyPreview: "...abc123",
//     isActive: true,
//     createdAt: "2025-01-15T..."
//   }
// }
```

#### Fetch User's API Keys

```typescript
// GET /api/keys?category=ai&provider=openai
const response = await fetch('/api/keys?category=ai');
const data = await response.json();
// {
//   success: true,
//   keys: [
//     {
//       id: "...",
//       name: "My OpenAI Key",
//       provider: "openai",
//       category: "ai",
//       keyPreview: "...abc123",
//       isActive: true,
//       lastUsed: "2025-01-15T...",
//       usageCount: 42,
//       createdAt: "...",
//       updatedAt: "..."
//     }
//   ]
// }
```

#### Delete API Key

```typescript
// DELETE /api/keys?id=<key-id>
await fetch('/api/keys?id=abc123', {
  method: 'DELETE'
});
```

### Supported Providers

| Provider | Category | Requires API Key | Free Tier |
|----------|----------|------------------|-----------|
| OpenAI | `ai` | Yes | No |
| Anthropic | `ai` | Yes | No |
| Google AI | `ai` | Yes | Yes |
| Groq | `ai` | Yes | Yes |
| Alpha Vantage | `financial_data` | Yes | 500/day |
| Polygon.io | `financial_data` | Yes | 5/day |
| Finnhub | `financial_data` | Yes | 60/min |
| CoinMarketCap | `crypto` | Yes | 333/day |
| CoinGecko | `crypto` | No | 50/min |

---

## AI Integration

### Unified AI Client

The `UnifiedAIClient` provides a single interface for all AI providers.

#### Backend Usage

```typescript
import { UnifiedAIClient, AI_MODELS, AIProvider } from '@/lib/ai/unified-client';
import ApiKey, { decryptApiKey } from '@/lib/db/models/ApiKey';

// 1. Fetch user's AI API keys
const apiKeys = await ApiKey.find({
  userId: session.user.id,
  category: 'ai',
  isActive: true,
}).select('+encryptedKey');

// 2. Build provider map
const providerKeys: Record<AIProvider, string | null> = {
  openai: null,
  anthropic: null,
  google: null,
  groq: null,
};

for (const key of apiKeys) {
  if (key.provider === 'openai' || key.provider === 'anthropic' || key.provider === 'google' || key.provider === 'groq') {
    providerKeys[key.provider as AIProvider] = decryptApiKey(key.encryptedKey);
  }
}

// 3. Create client
const client = new UnifiedAIClient(providerKeys);

// 4. Chat with any model
const response = await client.chat('claude-3-sonnet', [
  { role: 'system', content: 'You are a helpful financial analyst.' },
  { role: 'user', content: 'What are the key metrics for evaluating a stock?' }
], {
  temperature: 0.7,
  maxTokens: 1000
});

console.log(response);
// {
//   content: "Key metrics include P/E ratio, EPS growth...",
//   model: "claude-3-5-sonnet-20241022",
//   usage: {
//     inputTokens: 45,
//     outputTokens: 234,
//     totalTokens: 279
//   },
//   cost: 0.0047  // $0.0047
// }
```

### Available Models

```typescript
import { AI_MODELS } from '@/lib/ai/unified-client';

// All 10 pre-configured models:
AI_MODELS['gpt-4-turbo']      // GPT-4 Turbo (OpenAI)
AI_MODELS['gpt-4']            // GPT-4 (OpenAI)
AI_MODELS['gpt-3.5-turbo']    // GPT-3.5 Turbo (OpenAI)
AI_MODELS['claude-3-opus']    // Claude 3 Opus (Anthropic)
AI_MODELS['claude-3-sonnet']  // Claude 3.5 Sonnet (Anthropic)
AI_MODELS['claude-3-haiku']   // Claude 3 Haiku (Anthropic)
AI_MODELS['gemini-pro']       // Gemini Pro (Google)
AI_MODELS['gemini-pro-vision']// Gemini Pro Vision (Google)
AI_MODELS['llama3-70b']       // Llama 3 70B (Groq)
AI_MODELS['mixtral-8x7b']     // Mixtral 8x7B (Groq)

// Each model includes:
// - id: API model identifier
// - name: Display name
// - provider: 'openai' | 'anthropic' | 'google' | 'groq'
// - contextWindow: Max input tokens
// - maxTokens: Max output tokens
// - costPer1kTokens: { input, output }
// - capabilities: ['chat', 'code', 'vision', ...]
```

### Frontend API: `/api/ai/models`

#### Get Available Models

```typescript
// GET /api/ai/models
const response = await fetch('/api/ai/models');
const data = await response.json();

console.log(data);
// {
//   success: true,
//   models: [
//     { key: 'gpt-4-turbo', ...model, available: true },
//     { key: 'claude-3-sonnet', ...model, available: true },
//     { key: 'gemini-pro', ...model, available: false },
//   ],
//   available: [/* only available models */],
//   byProvider: {
//     openai: [/* OpenAI models */],
//     anthropic: [/* Anthropic models */]
//   },
//   configuredProviders: ['openai', 'anthropic']
// }
```

#### Test AI Model

```typescript
// POST /api/ai/models
const response = await fetch('/api/ai/models', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    modelKey: 'claude-3-sonnet',
    message: 'Hello! Can you summarize the stock market today?'
  })
});

const data = await response.json();
// {
//   success: true,
//   response: {
//     content: "The stock market today...",
//     model: "claude-3-5-sonnet-20241022",
//     usage: { inputTokens: 15, outputTokens: 87, totalTokens: 102 },
//     cost: 0.0016
//   }
// }
```

### Model Selection Pattern

```typescript
// React component for model selection
const [selectedModel, setSelectedModel] = useState('claude-3-sonnet');
const [availableModels, setAvailableModels] = useState([]);

useEffect(() => {
  async function fetchModels() {
    const res = await fetch('/api/ai/models');
    const data = await res.json();
    setAvailableModels(data.available);
  }
  fetchModels();
}, []);

// Render dropdown
<select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
  {availableModels.map(model => (
    <option key={model.id} value={model.id}>
      {model.name} - ${model.costPer1kTokens.input}/1k tokens
    </option>
  ))}
</select>
```

---

## Data Sources Integration

### Stock Market Data

#### Alpha Vantage - Get Stock Quote

```typescript
// GET /api/data/quote?symbol=AAPL&provider=alpha_vantage
const response = await fetch('/api/data/quote?symbol=AAPL&provider=alpha_vantage');
const data = await response.json();

console.log(data);
// {
//   success: true,
//   provider: "alpha_vantage",
//   quote: {
//     symbol: "AAPL",
//     price: 185.23,
//     change: 2.45,
//     changePercent: 1.34,
//     volume: 52840000,
//     high: 186.50,
//     low: 183.10,
//     open: 184.00,
//     previousClose: 182.78,
//     timestamp: "2025-01-15T16:00:00.000Z"
//   }
// }
```

#### Backend: Direct Client Usage

```typescript
import { createDataSourceClient, AlphaVantageClient } from '@/lib/data-sources';

// Get user's API key
const apiKeyDoc = await ApiKey.findOne({
  userId: session.user.id,
  provider: 'alpha_vantage',
  isActive: true,
}).select('+encryptedKey');

const apiKey = decryptApiKey(apiKeyDoc.encryptedKey);

// Create client
const client = createDataSourceClient('alpha_vantage', apiKey) as AlphaVantageClient;

// Get quote
const quote = await client.getQuote('TSLA');

// Get historical data
const historicalData = await client.getHistoricalData('TSLA', 'daily');
// Returns: [{ date: '2025-01-15', open: 180, high: 185, low: 178, close: 183, volume: 45000000 }, ...]

// Search symbols
const results = await client.searchSymbol('Apple');
// Returns: [{ symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' }, ...]
```

### Cryptocurrency Data

#### CoinMarketCap - Get Crypto Quote

```typescript
// GET /api/data/quote?symbol=BTC&provider=coinmarketcap
const response = await fetch('/api/data/quote?symbol=BTC&provider=coinmarketcap');
const data = await response.json();

console.log(data.quote);
// {
//   symbol: "BTC",
//   name: "Bitcoin",
//   price: 45234.56,
//   change24h: 1234.56,
//   changePercent24h: 2.81,
//   volume24h: 28500000000,
//   marketCap: 887000000000,
//   circulatingSupply: 19600000,
//   totalSupply: 21000000,
//   timestamp: "2025-01-15T12:00:00.000Z"
// }
```

#### CoinGecko - Free (No API Key)

```typescript
import { CoinGeckoClient } from '@/lib/data-sources';

const client = new CoinGeckoClient();

// Get quote (uses coin ID, not symbol)
const quote = await client.getQuote('bitcoin');

// Get market data
const marketData = await client.getMarketData('bitcoin', 30); // 30 days
```

### Data Source Clients

```typescript
import {
  AlphaVantageClient,
  PolygonClient,
  CoinMarketCapClient,
  CoinGeckoClient,
  createDataSourceClient
} from '@/lib/data-sources';

// Factory pattern (recommended)
const client = createDataSourceClient('alpha_vantage', apiKey);

// Or direct instantiation
const alphaVantage = new AlphaVantageClient(apiKey);
const polygon = new PolygonClient(apiKey);
const coinMarketCap = new CoinMarketCapClient(apiKey);
const coinGecko = new CoinGeckoClient(); // No key needed
```

---

## Frontend Integration

### Settings Page - API Keys Management

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function APIKeysSettings() {
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState({
    name: '',
    provider: 'openai',
    category: 'ai',
    apiKey: ''
  });

  // Fetch existing keys
  useEffect(() => {
    async function fetchKeys() {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setApiKeys(data.keys);
    }
    fetchKeys();
  }, []);

  // Add new key
  async function handleAddKey() {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newKey)
    });

    if (res.ok) {
      const data = await res.json();
      setApiKeys([...apiKeys, data.key]);
      setNewKey({ name: '', provider: 'openai', category: 'ai', apiKey: '' });
    } else {
      const error = await res.json();
      alert(error.error);
    }
  }

  // Delete key
  async function handleDeleteKey(keyId: string) {
    await fetch(`/api/keys?id=${keyId}`, { method: 'DELETE' });
    setApiKeys(apiKeys.filter(k => k.id !== keyId));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API Keys</h2>

      {/* Add New Key Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Key Name"
            value={newKey.name}
            onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
            className="border px-3 py-2 rounded"
          />
          <select
            value={newKey.provider}
            onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            <optgroup label="AI Providers">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google AI</option>
              <option value="groq">Groq</option>
            </optgroup>
            <optgroup label="Stock Data">
              <option value="alpha_vantage">Alpha Vantage</option>
              <option value="polygon">Polygon.io</option>
              <option value="finnhub">Finnhub</option>
            </optgroup>
            <optgroup label="Crypto Data">
              <option value="coinmarketcap">CoinMarketCap</option>
            </optgroup>
          </select>
          <input
            type="password"
            placeholder="API Key"
            value={newKey.apiKey}
            onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
            className="border px-3 py-2 rounded col-span-2"
          />
          <button
            onClick={handleAddKey}
            className="col-span-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Add API Key
          </button>
        </div>
      </div>

      {/* Existing Keys List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Your API Keys</h3>
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div key={key.id} className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-sm text-gray-600">
                  {key.provider} • {key.keyPreview} • Used {key.usageCount} times
                </p>
                {key.lastUsed && (
                  <p className="text-xs text-gray-500">
                    Last used: {new Date(key.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteKey(key.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### AI Chat with Model Selection

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function AIChat() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      setModels(data.available);
      if (data.available.length > 0) {
        setSelectedModel(Object.keys(data.available[0])[0]);
      }
    }
    fetchModels();
  }, []);

  async function handleSend() {
    setLoading(true);
    const res = await fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelKey: selectedModel, message })
    });
    const data = await res.json();
    setResponse(data.response);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} - ${model.costPer1kTokens.input}/1k in, ${model.costPer1kTokens.output}/1k out
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask me anything..."
        className="w-full border px-3 py-2 rounded mb-4 h-32"
      />

      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>

      {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <p className="whitespace-pre-wrap">{response.content}</p>
          <div className="mt-4 text-sm text-gray-600">
            <p>Tokens: {response.usage.totalTokens} (in: {response.usage.inputTokens}, out: {response.usage.outputTokens})</p>
            <p>Cost: ${response.cost.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Security Best Practices

### API Key Encryption

1. **Never log or expose encryption keys**
   ```typescript
   // ❌ Bad
   console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY);

   // ✅ Good
   if (!process.env.ENCRYPTION_KEY) {
     throw new Error('ENCRYPTION_KEY not configured');
   }
   ```

2. **Always use `.select('+encryptedKey')` explicitly**
   ```typescript
   // ❌ Bad - encryptedKey won't be returned
   const key = await ApiKey.findOne({ userId, provider });

   // ✅ Good
   const key = await ApiKey.findOne({ userId, provider }).select('+encryptedKey');
   ```

3. **Decrypt only when needed**
   ```typescript
   // Decrypt immediately before use
   const decryptedKey = decryptApiKey(apiKeyDoc.encryptedKey);
   const client = new OpenAI({ apiKey: decryptedKey });
   // Use client...
   // Don't store decryptedKey in database or session
   ```

### User Isolation

Always filter by `userId` from session:

```typescript
const session = await getServerSession(authOptions);

// ✅ Good - user can only access their own keys
const keys = await ApiKey.find({ userId: session.user.id });

// ❌ Bad - could expose other users' keys
const keys = await ApiKey.find({});
```

### Rate Limiting

Implement rate limiting for external API calls:

```typescript
import { rateLimit } from '@/lib/api/middleware';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

export async function GET(request: NextRequest) {
  await limiter(request);
  // ... rest of handler
}
```

### Input Validation

Always validate user input before making external API calls:

```typescript
const { symbol } = await request.json();

if (!symbol || typeof symbol !== 'string' || symbol.length > 10) {
  return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
}

// Sanitize symbol (uppercase, remove special chars)
const sanitizedSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
```

---

## Error Handling

### Standard Error Responses

All API endpoints follow this error format:

```typescript
{
  error: string,        // Human-readable error message
  code?: string,        // Machine-readable error code
  details?: any         // Additional error details
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | User lacks permission |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate resource (e.g., API key already exists) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Error Handling Pattern

```typescript
try {
  const response = await fetch('/api/data/quote?symbol=AAPL');

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/auth/signin';
    } else if (response.status === 404) {
      // Show "API key not found" message
      alert('Please add an API key in Settings');
    } else {
      // Generic error
      alert(error.error || 'Something went wrong');
    }
    return;
  }

  const data = await response.json();
  // Process successful response
} catch (error) {
  console.error('Network error:', error);
  alert('Network error. Please try again.');
}
```

### Provider-Specific Errors

```typescript
// Alpha Vantage API limit reached
{
  error: "AlphaVantage: API rate limit exceeded. Please try again later.",
  code: "PROVIDER_RATE_LIMIT",
  details: { provider: "alpha_vantage", limit: 500 }
}

// Invalid API key
{
  error: "OpenAI API key not configured",
  code: "MISSING_API_KEY",
  details: { provider: "openai" }
}

// Invalid symbol
{
  error: "No data found for symbol: INVALID",
  code: "SYMBOL_NOT_FOUND"
}
```

---

## Testing

### Test API Key Encryption

```typescript
import { encryptApiKey, decryptApiKey } from '@/lib/db/models/ApiKey';

const originalKey = 'sk-proj-abc123def456';
const encrypted = encryptApiKey(originalKey);
const decrypted = decryptApiKey(encrypted);

console.log(originalKey === decrypted); // true
console.log(encrypted.includes(originalKey)); // false (encrypted)
```

### Test AI Models Endpoint

```bash
# Get available models
curl http://localhost:3000/api/ai/models \
  -H "Cookie: next-auth.session-token=..."

# Test a model
curl -X POST http://localhost:3000/api/ai/models \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "modelKey": "claude-3-sonnet",
    "message": "What is the capital of France?"
  }'
```

### Test Data Quote Endpoint

```bash
# Stock quote
curl "http://localhost:3000/api/data/quote?symbol=AAPL&provider=alpha_vantage" \
  -H "Cookie: next-auth.session-token=..."

# Crypto quote
curl "http://localhost:3000/api/data/quote?symbol=BTC&provider=coinmarketcap" \
  -H "Cookie: next-auth.session-token=..."
```

### Integration Test: Full Flow

```typescript
// 1. Add API key
const addKeyRes = await fetch('/api/keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Alpha Vantage',
    provider: 'alpha_vantage',
    category: 'financial_data',
    apiKey: 'YOUR_ALPHA_VANTAGE_KEY'
  })
});
const { key } = await addKeyRes.json();
console.log('Added key:', key.id);

// 2. Fetch stock quote
const quoteRes = await fetch('/api/data/quote?symbol=AAPL&provider=alpha_vantage');
const { quote } = await quoteRes.json();
console.log('AAPL Price:', quote.price);

// 3. Verify usage tracking
const keysRes = await fetch('/api/keys?provider=alpha_vantage');
const { keys } = await keysRes.json();
console.log('Usage count:', keys[0].usageCount); // Should be 1

// 4. Delete key
await fetch(`/api/keys?id=${key.id}`, { method: 'DELETE' });
console.log('Deleted key');
```

---

## Production Checklist

Before deploying to production:

- [ ] Set `ENCRYPTION_KEY` in production environment (use secure random 32-byte hex)
- [ ] Store `ENCRYPTION_KEY` in secure vault (AWS Secrets Manager, etc.)
- [ ] Implement Redis-based rate limiting (replace in-memory implementation)
- [ ] Enable API key rotation mechanism
- [ ] Set up monitoring for API usage and costs
- [ ] Configure alerts for rate limit approaching
- [ ] Add audit logging for API key creation/deletion
- [ ] Implement API key expiration dates
- [ ] Set up backup encryption keys for key rotation
- [ ] Test encryption key recovery procedure
- [ ] Document API key onboarding for users
- [ ] Create usage dashboards per provider

---

## Support and Resources

### Provider Documentation

- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com
- **Google AI**: https://ai.google.dev/docs
- **Groq**: https://console.groq.com/docs
- **Alpha Vantage**: https://www.alphavantage.co/documentation
- **Polygon.io**: https://polygon.io/docs
- **CoinMarketCap**: https://coinmarketcap.com/api/documentation
- **CoinGecko**: https://www.coingecko.com/en/api/documentation

### Getting API Keys

1. **OpenAI**: https://platform.openai.com/api-keys
2. **Anthropic**: https://console.anthropic.com/
3. **Google AI**: https://makersuite.google.com/app/apikey
4. **Groq**: https://console.groq.com/keys
5. **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
6. **Polygon.io**: https://polygon.io/dashboard/signup
7. **CoinMarketCap**: https://pro.coinmarketcap.com/signup

---

## Changelog

### v1.0.0 (2025-01-15)

- Initial release
- API key management with AES-256-GCM encryption
- Unified AI client supporting 4 providers and 10 models
- Data sources integration for stocks and crypto
- Complete API endpoints for keys, models, and quotes
- Frontend integration examples
- Comprehensive documentation

---

**Last Updated**: January 15, 2025
**Maintainer**: AssetWorks Development Team
