# AssetWorks API Documentation v2

## Overview
AssetWorks is a world-class financial reporting and analytics platform with real-time market data, AI-powered report generation, and comprehensive entity intelligence.

## Base URL
```
Production: https://assetworks.com/api/v2
Development: http://localhost:3002/api/v2
```

## Authentication
All API endpoints require authentication using JWT tokens. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry (stored as HTTP-only cookie)
- **WebSocket Token**: 1 hour expiry

---

## Authentication Endpoints

### POST /auth/login
Authenticate user and receive tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PREMIUM",
      "emailVerified": true,
      "twoFactorEnabled": false
    },
    "accessToken": "jwt_access_token",
    "expiresIn": 900
  },
  "message": "Login successful"
}
```

### POST /auth/logout
Logout user and revoke all tokens

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### POST /auth/refresh
Refresh access token using refresh token

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresIn": 900
  },
  "message": "Token refreshed successfully"
}
```

### GET /auth/me
Get current user profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PREMIUM",
    "permissions": ["market:*", "reports:*", "entities:*"],
    "stats": {
      "reportsGenerated": 42,
      "reportsSaved": 15,
      "unreadNotifications": 3
    },
    "subscription": {
      "plan": "premium",
      "features": ["unlimited-reports", "advanced-analytics", "real-time-market-data"]
    }
  }
}
```

---

## Report Generation

### POST /reports/generate
Generate AI-powered financial report (supports streaming)

**Request Body:**
```json
{
  "prompt": "Analyze the top tech companies in India focusing on their growth potential",
  "model": "claude-3-opus-20240229",
  "options": {
    "stream": true,
    "extractEntities": true,
    "generateCharts": true,
    "includeMarketData": true,
    "language": "en",
    "format": "html"
  }
}
```

**Response (Streaming):**
Server-Sent Events stream with progress updates:
```
data: {"type": "start", "message": "Starting report generation"}
data: {"type": "content", "content": "<h1>Tech Companies Analysis</h1>..."}
data: {"type": "entity", "entity": {"name": "Infosys", "type": "COMPANY", "ticker": "INFY"}}
data: {"type": "chart", "chart": {"type": "bar", "data": [...]}}
data: {"type": "complete", "reportId": "report_123", "stats": {"tokens": 2500, "entities": 8}}
data: [DONE]
```

**Rate Limit:** 10 reports per hour

---

## Market Data

### GET /market/quotes
Get real-time market quotes

**Query Parameters:**
- `symbols`: Comma-separated list of symbols (max 50)
- `includeIndicators`: Include technical indicators (optional)

**Example:**
```
GET /market/quotes?symbols=AAPL,GOOGL,BTC&includeIndicators=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 178.50,
      "change": 2.30,
      "changePercent": 1.31,
      "volume": 58432100,
      "marketCap": 2800000000000,
      "high": 179.20,
      "low": 176.80,
      "open": 177.10,
      "previousClose": 176.20,
      "indicators": {
        "rsi": 58.2,
        "macd": {
          "macd": 1.23,
          "signal": 0.98,
          "histogram": 0.25
        },
        "bollingerBands": {
          "upper": 182.50,
          "middle": 178.00,
          "lower": 173.50
        }
      }
    }
  ],
  "meta": {
    "requestedSymbols": ["AAPL", "GOOGL", "BTC"],
    "returnedQuotes": 3,
    "rateLimitRemaining": 95,
    "timestamp": 1697500000000
  }
}
```

**Rate Limit:** 100 requests per hour

### GET /market/historical
Get historical price data

**Query Parameters:**
- `symbol`: Symbol to fetch (required)
- `range`: Time range (1D, 1W, 1M, 3M, 1Y, ALL)
- `indicators`: Include technical indicators

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "range": "1M",
    "historical": [
      {
        "date": "2024-01-01",
        "open": 175.20,
        "high": 176.80,
        "low": 174.50,
        "close": 176.20,
        "volume": 45230000
      }
    ],
    "indicators": {
      "sma20": 175.80,
      "ema20": 176.10,
      "rsi": 58.2
    }
  }
}
```

**Rate Limit:** 50 requests per hour

---

## Entity Intelligence

### GET /entities
List and search financial entities

**Query Parameters:**
- `type`: Entity type filter (COMPANY, STOCK, CRYPTOCURRENCY, etc.)
- `search`: Search term
- `limit`: Results per page (max 100)
- `offset`: Pagination offset
- `sortBy`: Sort field (mentionCount, lastMentioned, name, createdAt)
- `sortOrder`: asc or desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "entity_123",
      "name": "Apple Inc.",
      "slug": "apple-inc",
      "type": "COMPANY",
      "ticker": "AAPL",
      "description": "Technology company...",
      "logo": "https://...",
      "website": "https://apple.com",
      "industry": "Technology",
      "sector": "Consumer Electronics",
      "headquarters": "Cupertino, CA",
      "stats": {
        "mentionCount": 1250,
        "reportCount": 89,
        "insightCount": 45,
        "lastMentioned": "2024-01-15T10:30:00Z",
        "firstMentioned": "2023-06-01T08:00:00Z"
      }
    }
  ],
  "meta": {
    "total": 523,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "cached": false
  }
}
```

### POST /entities
Create a new entity

**Request Body:**
```json
{
  "name": "New Company Inc.",
  "type": "COMPANY",
  "ticker": "NEWC",
  "description": "Description of the company",
  "website": "https://newcompany.com",
  "industry": "Technology",
  "sector": "Software",
  "headquarters": "San Francisco, CA"
}
```

**Rate Limit:** 20 entity creations per hour

---

## WebSocket

### GET /ws
Get WebSocket connection details and authentication token

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "ws://localhost:3003",
    "token": "websocket_jwt_token",
    "namespaces": {
      "market": "/market",
      "reports": "/reports",
      "notifications": "/notifications",
      "analytics": "/analytics"
    },
    "reconnectInterval": 5000,
    "maxReconnectAttempts": 10
  },
  "meta": {
    "rateLimitRemaining": 8,
    "expiresIn": 3600
  }
}
```

### WebSocket Events

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3003');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'websocket_jwt_token'
}));

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['market', 'notifications']
}));
```

**Market Events:**
```json
{
  "type": "market_update",
  "data": {
    "symbol": "AAPL",
    "price": 178.50,
    "change": 2.30,
    "changePercent": 1.31,
    "timestamp": 1697500000000
  }
}
```

**Report Events:**
```json
{
  "type": "report_progress",
  "data": {
    "reportId": "report_123",
    "progress": 45,
    "stage": "analyzing_entities",
    "message": "Extracting entity relationships..."
  }
}
```

---

## Dashboard

### GET /dashboard/stats
Get dashboard statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 142,
    "reportsThisMonth": 23,
    "totalEntities": 856,
    "activeAlerts": 5,
    "savedReports": 45,
    "apiUsage": {
      "used": 250,
      "limit": 1000,
      "percentage": 25
    },
    "marketOverview": {
      "trending": [
        {
          "symbol": "AAPL",
          "price": 178.50,
          "change": 2.30,
          "changePercent": 1.31
        }
      ]
    },
    "userPlan": {
      "current": "PRO",
      "features": ["1000-reports", "advanced-analytics", "real-time-market-data"]
    }
  }
}
```

### GET /dashboard/activities
Get user activity feed

**Query Parameters:**
- `limit`: Number of activities (max 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_123",
      "type": "report_created",
      "title": "Report Created",
      "description": "Generated a new report: \"Market Analysis Q4\"",
      "timestamp": "2024-01-15T10:30:00Z",
      "icon": "FileText",
      "status": "success",
      "metadata": {
        "reportId": "report_456",
        "reportTitle": "Market Analysis Q4"
      }
    }
  ],
  "meta": {
    "total": 234,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|---------|
| Login | 5 requests | 1 minute |
| Report Generation | 10 requests | 1 hour |
| Market Quotes | 100 requests | 1 hour |
| Historical Data | 50 requests | 1 hour |
| Entity Creation | 20 requests | 1 hour |
| WebSocket Token | 10 requests | 1 hour |
| General API | 1000 requests | 1 hour |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697503600
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Invalid or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request parameters
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { AssetWorksClient } from '@assetworks/sdk';

const client = new AssetWorksClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://assetworks.com/api/v2'
});

// Generate report
const report = await client.reports.generate({
  prompt: 'Analyze tech companies',
  stream: true
});

// Get market quotes
const quotes = await client.market.getQuotes(['AAPL', 'GOOGL']);

// Track entity
const entity = await client.entities.create({
  name: 'New Company',
  type: 'COMPANY'
});
```

### Python
```python
from assetworks import AssetWorksClient

client = AssetWorksClient(
    api_key='your_api_key',
    base_url='https://assetworks.com/api/v2'
)

# Generate report
report = client.reports.generate(
    prompt='Analyze tech companies',
    stream=True
)

# Get market quotes
quotes = client.market.get_quotes(['AAPL', 'GOOGL'])
```

---

## Webhooks (Coming Soon)
Configure webhooks to receive real-time notifications:
- Report generation complete
- Market alerts triggered
- Entity insights available

---

## Support
- Documentation: https://docs.assetworks.com
- API Status: https://status.assetworks.com
- Support Email: api@assetworks.com
- Discord: https://discord.gg/assetworks

## Changelog
### v2.0.0 (2024-01-15)
- Complete rebuild with world-class architecture
- PostgreSQL-only implementation
- Real-time WebSocket support
- Advanced authentication with refresh tokens
- Production-grade error handling and monitoring
- Comprehensive rate limiting
- Redis caching layer
- Market data integration
- Entity intelligence system