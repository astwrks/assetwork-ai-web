# Data-Driven Report Generation System

## The Solution
Instead of trying to generate 2000+ lines of HTML in one response (impossible due to token limits), we:
1. **Collect all data first** in structured format
2. **Store it in memory** with proper typing
3. **Generate HTML separately** from the stored data

## How It Works

### Step 1: Data Collection Prompt
Use this prompt to collect financial data:

```
Provide comprehensive financial data for Apple in this exact JSON format:
{
  "currentPrice": 195.18,
  "change": -0.89,
  "changePercent": -0.45,
  "marketCap": 3020000000000,
  "peRatio": 31.84,
  "revenue": 385000000000,
  "revenueGrowth": 0.08,
  "grossMargin": 0.441,
  "netMargin": 0.252,
  "eps": 6.13,
  "roe": 1.71,
  "rsi": 58.3,
  "macd": 1.23,
  "targetPrice": 220,
  "analystRating": "BUY"
}
Include all metrics: valuation, financial, technical, risk, analyst data.
```

### Step 2: HTML Generation
The system then generates complete HTML from stored data without token limits!

## Using the New System

### Via API Endpoint
```javascript
// Generate complete report via API
fetch('/api/generate-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbol: 'AAPL' })
})
.then(res => res.json())
.then(data => {
  // data.html contains complete 2000+ line report
  document.getElementById('report').innerHTML = data.html;
});
```

### Direct HTML Access
```
http://localhost:3004/api/generate-report?symbol=AAPL
```
Opens complete HTML report directly in browser!

## System Prompt for Data Collection

Use this prompt to make Claude collect data instead of generating HTML:

```
You are a financial data collector. When asked about a company, output ONLY structured data in JSON format.

RULES:
1. Output valid JSON only
2. Include all numerical metrics
3. Use realistic financial values
4. No HTML, no explanations
5. Complete data structure required

Required fields:
- Price data (current, change, ranges)
- Valuation metrics (P/E, P/B, P/S, etc.)
- Financial metrics (revenue, margins, growth)
- Technical indicators (RSI, MACD, moving averages)
- Risk metrics (beta, volatility, VaR)
- Analyst data (ratings, targets)
- Performance (returns by period)

Output format:
{
  "symbol": "AAPL",
  "currentPrice": 195.18,
  "marketCap": 3020000000000,
  [... all other fields ...]
}
```

## Advantages

1. **No Token Limits**: HTML generation happens in code, not AI
2. **Complete Reports**: Full 2000+ line reports every time
3. **Consistent Format**: Same structure guaranteed
4. **Fast Generation**: No streaming delays
5. **Data Reusability**: Store once, generate multiple formats

## Implementation in Chat

### Modified Chat Flow
1. User: "Analyze Apple"
2. System: Collects data using data prompt
3. System: Stores data in financialDataStore
4. System: Generates HTML from stored data
5. System: Returns complete HTML report

### Enhanced Prompt for Chat
```
When user asks about a stock:
1. First, collect all financial data
2. Store in structured format
3. Then call generateHTMLFromData()
4. Return the complete HTML

Never try to generate HTML directly. Always use the data store approach.
```

## Testing

### Test Data Collection
```bash
curl -X POST http://localhost:3004/api/generate-report \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

### View Complete Report
```bash
open http://localhost:3004/api/generate-report?symbol=AAPL
```

## Complete Example Flow

1. **Chat Input**: "Generate Apple report"

2. **System Process**:
   ```javascript
   // Behind the scenes
   const data = await collectFinancialData('AAPL');
   financialDataStore.storeCompanyData('AAPL', data);
   const html = financialDataStore.generateHTMLFromData('AAPL');
   return html; // Complete 2000+ line report
   ```

3. **Output**: Full HTML report displayed

## Key Benefits

- **Bypasses token limits** completely
- **Generates massive reports** (10,000+ lines possible)
- **Consistent quality** every time
- **No truncation** issues
- **Faster response** times
- **Lower token usage** (only data, not HTML)

## Usage in Settings

Add this as a preset in chat settings:

```
Name: "📊 Data-Driven Reports"
Description: "Collect data first, then generate unlimited HTML"
Prompt: "Collect financial data in JSON format, then generate HTML using stored data. Never output HTML directly."
```

This approach solves the token limit problem permanently!