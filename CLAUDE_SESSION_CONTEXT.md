# Claude Code Session Context - Entity Intelligence System
**Date**: October 14, 2025
**Project**: AssetWorks WebApp - Entity Intelligence System
**Status**: ✅ **FIXED AND READY FOR TESTING**

---

## 🎯 Project Overview

Building an **"IMDB for Financial Entities"** - an intelligent system that automatically extracts, tracks, and profiles financial entities (companies, stocks, people, products) mentioned across reports.

### Key Features Implemented
- ✅ AI-powered entity extraction using Claude Sonnet
- ✅ Automatic entity profiling with sentiment analysis
- ✅ Interactive EntityChips UI component
- ✅ Comprehensive entity detail pages
- ✅ Entity mention tracking across reports
- ✅ AI-generated insights and trend analysis

---

## 🔧 Recent Session: Fixing Critical Bugs

### Session Goal
Fix entity sync integration errors preventing EntityChips from displaying on generated reports.

### Issues Discovered & Fixed

#### 1. ✅ Widget API Table Name Error
**Error**: `TypeError: Cannot read properties of undefined (reading 'findMany')`
**Location**: `/app/api/widgets/route.ts:17`
**Cause**: Using `prisma.widget` instead of `prisma.widgets`
**Fix**: Changed to correct table name at lines 17 and 70

#### 2. ✅ Neon Database Connection Timeout
**Error**: `Can't reach database server at ep-young-thunder-ad70ggph-pooler.c-2.us-east-1.aws.neon.tech:5432`
**Cause**: Default 5-second timeout too aggressive for Neon's serverless connection pooling
**Fix**: Added connection parameters to `.env.local`:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_ovqdftT4bR5y@ep-young-thunder-ad70ggph-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30&pgbouncer=true
DIRECT_URL=postgresql://neondb_owner:npg_ovqdftT4bR5y@ep-young-thunder-ad70ggph.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30
```

#### 3. ✅ Missing ID Fields in Prisma Entity Creation (CRITICAL)
**Error**: `Invalid prisma.entities.create() invocation - Argument 'id' is missing`
**Cause**: Prisma schema uses manual UUID generation (`id: String @id`) but entity services weren't providing IDs
**Proof**: Logs showed "Extracted 5 entities from report" but Prisma errors prevented saving

**Files Fixed**:

1. **`/lib/services/entity-extraction.service.ts`**
   - Added `import crypto from 'crypto'`
   - Line 145: Added `id: crypto.randomUUID()` to entity creation
   - Line 174: Added `id: crypto.randomUUID()` to entity_mentions creation

2. **`/lib/services/entity-aggregation.service.ts`**
   - Added `import crypto from 'crypto'`
   - Line 256: Added `id: crypto.randomUUID()` to summary insight creation
   - Line 320: Added `id: crypto.randomUUID()` to trend insight creation
   - Fixed Prisma relation names:
     - `entity_mentions` (not `mentions`)
     - `entity_insights` (not `insights`)
     - `reports` (singular, not `report`)

---

## 🏗️ System Architecture

### Database Schema (Prisma + PostgreSQL)

**Core Tables**:
- `entities` - Master entity profiles (companies, stocks, people, etc.)
- `entity_mentions` - Track every mention across reports
- `entity_insights` - AI-generated insights (summary, trend, prediction)
- `entity_tags` - Flexible tagging system
- `reports` - Financial reports stored in PostgreSQL

**Key Relations**:
```prisma
entities {
  entity_mentions entity_mentions[]
  entity_insights entity_insights[]
  entity_tags     entity_tags[]
}

entity_mentions {
  entities entities @relation(fields: [entityId])
  reports  reports  @relation(fields: [reportId])
}
```

### Service Layer

**`lib/services/entity-extraction.service.ts`**
- Extracts entities from HTML reports using Claude
- Converts HTML to plain text
- Returns structured entity data with sentiment/relevance scores
- Creates/updates entities and mentions in Prisma

**`lib/services/entity-aggregation.service.ts`**
- Generates master markdown profiles for entities
- Creates AI insights (summary, trend analysis)
- Aggregates data across all entity mentions

**`lib/utils/entity-processor.ts`**
- Orchestrates extraction → aggregation pipeline
- Non-blocking background processing
- Called automatically after report generation

**`lib/utils/entity-processor.ts`**
- Processes reports for entity extraction
- Triggers entity extraction in background
- Called automatically after report generation

---

## 🚀 How It Works

### Automatic Entity Extraction Flow

1. **User generates report** → POST `/api/playground/threads/[threadId]/messages`
2. **Report saved to PostgreSQL** → Stored in `reports` table via Prisma
3. **Entity extraction triggered** → Background processing starts
4. **Report data ready** → Available for entity analysis
5. **Entity extraction starts** (background) → `processReportEntities()`
6. **Claude analyzes HTML** → Extracts 3-10 key entities
7. **Entities saved** → Creates/updates `entities` and `entity_mentions`
8. **Aggregation queued** → Background task generates insights
9. **EntityChips appear** → Frontend fetches and displays entities

### Entity Extraction Details

**AI Prompt** (Claude Sonnet 3.5):
- Extracts: name, type, ticker, context, sentiment (-1 to 1), relevance (0 to 1)
- Deduplicates entities across mentions
- Focuses on top 3-10 most relevant entities
- Returns structured JSON array

**Entity Types Supported**:
- COMPANY, STOCK, PERSON, PRODUCT, SECTOR
- CRYPTOCURRENCY, COMMODITY, INDEX, ETF, MUTUAL_FUND
- COUNTRY, CURRENCY

---

## 📁 Key Files & Locations

### Backend Services
```
lib/services/
  ├── entity-extraction.service.ts    [Entity extraction with Claude]
  ├── entity-aggregation.service.ts   [Profile generation & insights]
  └── report-combiner.service.ts      [Existing report service]

lib/utils/
  ├── entity-processor.ts             [Orchestration layer]
  └── entity-helpers.ts               [Entity processing utilities]
```

### API Routes
```
app/api/
  ├── entities/
  │   ├── route.ts                    [List entities]
  │   ├── [slug]/route.ts            [Entity details by slug]
  │   └── [slug]/mentions/route.ts   [Entity mentions]
  └── playground/threads/[threadId]/
      └── messages/route.ts           [Report generation - SYNC TRIGGER AT LINE 538]
```

### Frontend Components
```
components/entities/
  ├── EntityChips.tsx                 [Chip display component]
  ├── EntityDetailPage.tsx           [Full entity profile page]
  ├── EntityHeader.tsx               [Profile header]
  ├── EntityInsights.tsx             [AI insights display]
  ├── EntityMentions.tsx             [Mention timeline]
  └── EntityStats.tsx                [Statistics cards]

app/entities/
  └── [slug]/page.tsx                [Entity detail route]
```

### Configuration
```
.env.local                           [Environment variables - UPDATED]
prisma/schema.prisma                [Database schema]
lib/db/prisma.ts                    [Prisma client config]
```

---

## 🧪 Testing Instructions

### Test the Entity System

1. **Start the dev server** (already running on port 3001)
   ```bash
   npm run dev
   ```

2. **Navigate to Financial Playground**
   ```
   http://localhost:3001/financial-playground
   ```

3. **Generate a new report** with entity-rich content:
   ```
   "Write a report about top Indian retail companies: Trent, Titan, and Reliance Retail"
   ```

4. **Expected Results**:
   - ✅ Report generates successfully
   - ✅ Console logs show: "Processing entities for report..."
   - ✅ Console logs show: "Extracted X entities from report"
   - ✅ EntityChips appear below the report
   - ✅ Clicking chips navigates to entity detail pages

### Verify in Console

**Expected logs** (check terminal running `npm run dev`):
```
Processing entities for report 68ee...
Extracted 5 entities from report
Created new entity: Trent
Processed entity: Trent (1 mentions)
Created new entity: Titan
Processed entity: Titan (1 mentions)
...
```

### Check Database (Prisma Studio)

If Prisma Studio is running (port 5555):
```bash
npx prisma studio
```

**Tables to check**:
- `entities` - Should see new entities created
- `entity_mentions` - Should see mentions linked to report
- `reports` - Should see generated reports stored

---

## 🐛 Troubleshooting

### EntityChips Not Appearing

1. **Check server logs** - Look for "Extracted X entities" message
2. **Verify Prisma connection** - Check for database errors
3. **Inspect network tab** - Look for API calls to `/api/entities/report/[reportId]`
4. **Check report ID** - EntityChips component needs valid report ID

### Entity Extraction Failing

1. **Check ANTHROPIC_API_KEY** - Must be set in `.env.local`
2. **Review report content** - Must have entity-rich content
3. **Check HTML length** - Report must have >100 characters of text
4. **Look for AI errors** - Check Claude API response in logs

### Database Connection Issues

1. **Verify DATABASE_URL** - Check `.env.local` has timeout params
2. **Test direct connection** - Use `npx prisma studio`
3. **Check Neon status** - Ensure database is active (not cold start)

---

## 📊 Current System State

### Server Status
- ✅ Development server running on `http://localhost:3001`
- ✅ Turbopack hot reload enabled
- ✅ All entity services recompiled with fixes

### Database Status
- ✅ Neon PostgreSQL connected
- ✅ Prisma client configured with connection pooling
- ✅ All data stored in PostgreSQL via Prisma

### Environment Variables (`.env.local`)
```bash
# Database - Neon PostgreSQL
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require&connect_timeout=30&pool_timeout=30&pgbouncer=true
DIRECT_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require&connect_timeout=30

# AI APIs
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here-change-in-production
NEXTAUTH_URL=http://localhost:3001
```

---

## 🎯 Next Steps

1. **Test Report Generation** - Generate new report and verify EntityChips appear
2. **Test Entity Detail Pages** - Click EntityChips to view full profiles
3. **Verify Entity Aggregation** - Check if AI insights generate (runs in background)
4. **Performance Monitoring** - Watch for entity extraction latency
5. **UI Refinements** - Polish EntityChips styling and interactions

---

## 💡 Technical Insights

### Why Manual UUID Generation?

The Prisma schema uses `id: String @id` instead of auto-increment because:
1. **Distributed systems** - UUIDs prevent ID conflicts in serverless environments
2. **Type consistency** - All IDs are strings throughout the codebase
3. **Flexibility** - UUIDs can be generated client-side if needed

### Why Background Processing?

Entity extraction happens asynchronously because:
1. **User experience** - Report displays immediately without waiting
2. **AI latency** - Claude API calls take 2-5 seconds
3. **Non-blocking** - Failure doesn't break report generation
4. **Retry capability** - Can re-extract entities if needed

### Prisma Relation Naming

Relations use table names (plural) not aliases:
- ✅ `entity.entity_mentions` (correct)
- ❌ `entity.mentions` (incorrect)

This follows Prisma's default relation naming convention.

---

## 📝 Session Notes

**Completed**:
- [x] Fixed widget API table name mismatch
- [x] Fixed Neon database connection timeouts
- [x] Fixed missing ID fields in entity creation
- [x] Fixed Prisma relation names in aggregation service
- [x] Restarted server to apply all fixes
- [x] Created this context document

**Ready for Testing**:
- [ ] Generate new report with entity extraction
- [ ] Verify EntityChips display correctly
- [ ] Test entity detail page navigation
- [ ] Validate entity insights generation

---

**Server Running**: `http://localhost:3001`
**Context Updated**: October 14, 2025 14:28 UTC
**Status**: 🟢 **ALL SYSTEMS READY**
