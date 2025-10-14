# Entity Intelligence System - Implementation Guide

## 🎯 Overview

The Entity Intelligence System transforms AssetWorks into an **IMDB for Financial Entities**. Every time a report mentions a company, stock, person, or product, that entity is:

1. **Automatically Extracted** using AI (Claude Sonnet)
2. **Tracked** with context, sentiment, and relevance
3. **Aggregated** into a living "entity profile"
4. **Enhanced** with AI-generated insights

## 📊 System Architecture

```
Report Generated
    ↓
Entity Extraction (AI) → Entities Identified
    ↓
Database Storage → entity_mentions created
    ↓
Entity Aggregation (Background) → Master Markdown Generated
    ↓
Insight Generation (AI) → Insights Added
    ↓
Entity Page Shows → Complete Profile
```

## 🗄️ Database Schema

### Core Tables

**entities** - The main entity records
- Primary data: name, slug, type, ticker, logo
- Aggregated data: masterMarkdown, summary, trendingTopics
- Stats: mentionCount, lastMentioned

**entity_mentions** - Track each mention across reports
- Links entity ↔ report
- Context, sentiment, relevance per mention
- Metadata (financial metrics extracted)

**entity_insights** - AI-generated insights
- Types: SUMMARY, TREND, COMPARISON, PREDICTION, RISK, OPPORTUNITY
- Source reports tracked
- Confidence scoring

**entity_tags** - Categorization
- Flexible tagging system
- Examples: "telecom", "5G", "dividend-stock"

## 🔧 Core Services

### EntityExtractionService
**File**: `lib/services/entity-extraction.service.ts`

**Purpose**: Extract named entities from report content using AI

**Key Methods**:
```typescript
extractEntities(content: string): Promise<ExtractedEntity[]>
// Uses Claude to identify entities from text

processEntitiesForReport(reportId: string, htmlContent: string)
// Main method - extracts and saves to database

upsertEntityAndMention(reportId: string, extracted: ExtractedEntity)
// Creates or updates entity and mention records
```

**Features**:
- AI-powered Named Entity Recognition (NER)
- Sentiment analysis (-1 to 1 scale)
- Relevance scoring (0 to 1 scale)
- Automatic deduplication
- Metadata extraction (revenue, growth, etc.)

### EntityAggregationService
**File**: `lib/services/entity-aggregation.service.ts`

**Purpose**: Aggregate data from all mentions into comprehensive profiles

**Key Methods**:
```typescript
generateMasterMarkdown(entityId: string): Promise<string>
// Creates entity.md file with all aggregated data

generateInsights(entityId: string): Promise<number>
// Generates AI insights (summary, trends, etc.)

refreshEntity(entityId: string): Promise<void>
// Regenerates both markdown and insights
```

**Generated Sections**:
- Overview
- Key Information
- Recent Activity & Developments
- Sentiment Analysis
- Key Topics & Themes
- Financial Highlights
- Related Reports Summary
- Trends & Insights

## 🌐 API Endpoints

### GET /api/entities
List all entities with filtering

**Query Parameters**:
- `type`: Filter by EntityType (COMPANY, STOCK, etc.)
- `search`: Search by name, ticker, or industry
- `limit`: Max results (default 20, max 100)
- `sortBy`: mentionCount | name | createdAt

**Response**:
```json
{
  "success": true,
  "entities": [...],
  "total": 15
}
```

### GET /api/entities/[slug]
Get detailed entity profile

**Returns**:
- Full entity data
- All mentions with context
- All insights
- Tags
- Statistics (sentiment distribution, mentions by month)

### POST /api/entities/[slug]/refresh
Trigger regeneration of entity data

**Use Cases**:
- After major updates
- Manual refresh from UI
- Scheduled maintenance

### GET /api/reports/[reportId]/entities
Get all entities mentioned in a specific report

**Returns**: Entities with their mention context and metrics

## 🎨 UI Components

### EntityChips
**File**: `components/entities/EntityChips.tsx`

**Usage**:
```tsx
import { EntityChips } from '@/components/entities/EntityChips';

// In your report page:
<EntityChips reportId={report.id} />
```

**Features**:
- Displays entities as clickable chips
- Shows mention count badge
- Ticker symbol display
- Sentiment indicator (colored dot)
- Links to entity detail page
- Responsive and animated
- Loading states

**Visual Design**:
```
ENTITIES: [Airtel BHARTIARTL.NS 8 •] [Jio  5 •] [TRAI  3 •]
           ↑           ↑       ↑ ↑
        name     ticker   count sentiment
```

## 🔄 Integration Guide

### Step 1: Add to Report Generation

When a report is created or significantly modified:

```typescript
import { processReportEntities } from '@/lib/utils/entity-processor';

// After report is saved:
await processReportEntities(report.id, report.htmlContent);
```

**Example Integration Points**:
- `/api/playground/threads/[threadId]/messages` - After assistant message with report
- `/api/playground/reports/[reportId]/sections` - After adding sections
- `/api/playground/reports/[reportId]` - After editing report

### Step 2: Add EntityChips to Report UI

In your report display page:

```tsx
import { EntityChips } from '@/components/entities/EntityChips';

export default function ReportPage({ report }: { report: Report }) {
  return (
    <div>
      {/* Add chips at top of report */}
      <EntityChips reportId={report.id} />

      {/* Rest of report content */}
      <div dangerouslySetInnerHTML={{ __html: report.htmlContent }} />
    </div>
  );
}
```

### Step 3: Create Entity Detail Page

**File**: `app/entities/[slug]/page.tsx`

**Required Components**:
1. Entity Header (name, logo, basic info)
2. Summary Card (AI-generated overview)
3. Statistics Dashboard
   - Mention count over time
   - Sentiment trend chart
   - Related entities
4. Insights Section
   - Trend insights
   - Summary insights
   - Risk/opportunity analysis
5. Reports Grid
   - Thumbnails of reports mentioning entity
   - Sorted by date or relevance
   - Filter by date range
6. Trending Topics
   - Word cloud or chips
   - Based on aggregated content
7. Master Markdown Display
   - Full entity profile
   - Rendered markdown

## 📈 Data Flow Examples

### Example 1: New Report Created

```
1. User: "Analyze Airtel's Q4 performance"
2. AI generates report mentioning Airtel, Jio, TRAI
3. Report saved to database (reports table)
4. processReportEntities() called:
   - AI extracts: ["Airtel", "Jio", "TRAI"]
   - Creates/updates 3 entities
   - Creates 3 entity_mentions
   - Updates mentionCount for each
5. Background: generateMasterMarkdown() for each
6. Background: generateInsights() for each
7. User sees EntityChips: [Airtel 8] [Jio 5] [TRAI 3]
8. User clicks Airtel chip →
9. Entity page shows:
   - "Airtel mentioned in 8 reports"
   - Latest summary, trends, insights
   - Grid of 8 report thumbnails
```

### Example 2: Entity Page Refresh

```
1. User visits /entities/airtel
2. Page loads entity data from database
3. Shows existing markdown and insights
4. User clicks "Refresh Data" button
5. POST /api/entities/airtel/refresh
6. Regenerates:
   - Master markdown from all 8 mentions
   - 2-3 new insights based on latest data
7. Page updates with fresh content
```

## 🎯 Key Features

### 1. Automated Entity Discovery
- No manual tagging required
- AI identifies entities automatically
- Standardizes names (e.g., "AAPL" → "Apple")

### 2. Context Preservation
- Each mention stores surrounding text
- Maintains context for analysis
- Links back to original report

### 3. Sentiment Tracking
- Per-mention sentiment scoring
- Aggregate sentiment trends
- Visual indicators (green/yellow/red)

### 4. Living Documentation
- entity.md updates automatically
- Always current with latest reports
- Historical data preserved

### 5. AI-Powered Insights
- Summary: Executive overview
- Trend: Sentiment and activity patterns
- Comparison: Peer analysis (future)
- Prediction: Future outlook (future)

## 🚀 Performance Considerations

### Entity Extraction
- Runs async after report creation
- Doesn't block report save
- Uses Claude with 8000 token limit
- ~2-5 seconds per report

### Entity Aggregation
- Runs in background
- Doesn't block API responses
- Can be queued/scheduled
- ~5-10 seconds per entity

### Caching Strategy
- Entity data cached in database
- Regenerate only when:
  - New mention added
  - Manual refresh requested
  - Scheduled maintenance (daily)

## 📊 Analytics Potential

### Metrics to Track
- Most mentioned entities
- Sentiment trends over time
- Entity co-occurrence (networks)
- Report diversity per entity
- User engagement with entity pages

### Future Enhancements
- Entity relationship graphs
- Peer comparison tables
- Price correlation (for stocks)
- News feed integration
- Alert system (sentiment changes)

## 🔧 Maintenance

### Database Migrations
Already applied via `prisma db push`. For production:
```bash
npx prisma migrate dev --name add_entity_system
npx prisma migrate deploy
```

### Scheduled Jobs (Recommended)
1. **Daily**: Refresh top 50 entities
2. **Weekly**: Regenerate all entity markdown
3. **Monthly**: Cleanup orphaned mentions

### Monitoring
- Track extraction success rate
- Monitor API response times
- Watch for duplicate entities
- Alert on failed aggregations

## 🎓 Best Practices

### For Report Generation
```typescript
// ✅ Good
await prisma.reports.create({ data });
await processReportEntities(report.id, report.htmlContent);

// ❌ Don't wait for extraction
await Promise.all([
  prisma.reports.create({ data }),
  processReportEntities(report.id, report.htmlContent) // This is slow
]);
```

### For Entity Names
- Use standardized names (Apple, not AAPL)
- Avoid duplicates (check slug)
- Store ticker separately
- Maintain consistency

### For UI Display
- Show loading states
- Handle empty entity lists
- Limit chip display (top 10)
- Provide "View All" link

## 📝 TODO for Full Implementation

- [ ] Create entity detail page (`app/entities/[slug]/page.tsx`)
- [ ] Add EntityChips to report pages
- [ ] Integrate processReportEntities into report creation
- [ ] Add refresh button to entity pages
- [ ] Create entity list/browse page
- [ ] Add entity search functionality
- [ ] Build sentiment trend charts
- [ ] Implement entity comparison feature
- [ ] Add entity relationship visualization
- [ ] Create admin dashboard for entity management

## 🎉 Expected Impact

### For Users
- **Discovery**: Find all reports about an entity instantly
- **Insights**: AI-generated summaries and trends
- **Context**: See how entities relate across reports
- **Navigation**: Easy browsing via chips and links

### For Business
- **Engagement**: Longer session times (exploring entities)
- **Value**: More insights from existing data
- **Differentiation**: Unique feature vs competitors
- **Scalability**: Auto-improves as more reports added

---

**Status**: Phase 1 Complete ✅
- Database schema ✅
- Entity extraction service ✅
- Entity aggregation service ✅
- API endpoints ✅
- EntityChips component ✅
- Report processor utility ✅

**Next**: Build entity detail page and integrate into report flow
