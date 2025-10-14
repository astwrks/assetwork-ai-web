# AssetWorks WebApp - Quick Start Guide

## 🚀 Starting a New Claude Code Session

### 1. Read the Context
```
Open: /Users/Victor/Projects/AssetWorks/assetworks-webapp/CLAUDE_SESSION_CONTEXT.md
```
This file contains everything Claude needs to know about the Entity Intelligence System.

### 2. Check Server Status
```bash
# Check if server is running
lsof -i:3001

# If not running, start it:
cd /Users/Victor/Projects/AssetWorks/assetworks-webapp/
npm run dev
```

### 3. Quick System Check
- **App**: http://localhost:3001
- **Playground**: http://localhost:3001/financial-playground-v2
- **Prisma Studio**: http://localhost:5555 (if running)

---

## 📋 Current System State (Oct 14, 2025)

### ✅ What's Working
- Entity extraction from reports (Claude Sonnet AI)
- Entity storage in Prisma PostgreSQL
- Entity mention tracking with sentiment analysis
- EntityChips UI component (ready to display)
- Entity detail pages (full profiles)
- Background entity aggregation

### 🧪 What Needs Testing
- [ ] Generate new report and verify EntityChips appear
- [ ] Click EntityChips to test navigation
- [ ] Verify entity data saves correctly
- [ ] Check entity insights generation (background task)

---

## 🐛 Recent Bug Fixes (All Fixed ✅)

1. **Widget API**: Fixed table name `prisma.widget` → `prisma.widgets`
2. **Database**: Added connection timeout params to handle Neon pooling
3. **Entity Creation**: Added UUID generation for all Prisma entity tables

---

## 🗂️ Key Files Reference

### Services (Backend Logic)
```
lib/services/
  ├── entity-extraction.service.ts    [AI entity extraction]
  ├── entity-aggregation.service.ts   [Profile generation]
  └── entity-processor.ts             [Orchestration]
```

### API Routes
```
app/api/entities/
  ├── route.ts                        [List entities]
  └── [slug]/route.ts                [Entity details]
```

### Components (Frontend)
```
components/entities/
  ├── EntityChips.tsx                 [Main display]
  ├── EntityDetailPage.tsx           [Profile page]
  ├── EntityHeader.tsx               [Header section]
  ├── EntityInsights.tsx             [AI insights]
  ├── EntityMentions.tsx             [Timeline]
  └── EntityStats.tsx                [Statistics]
```

---

## 🧪 Test the System

### Generate Test Report
1. Go to: http://localhost:3001/financial-playground-v2
2. Click "New Thread" or select existing thread
3. Type: **"Write a report about top Indian retail companies: Trent, Titan, and Reliance Retail"**
4. Wait for report to generate
5. **Look for EntityChips** below the report

### Expected Results
✅ Console logs show:
```
Syncing MongoDB report 68ee... to Prisma...
✅ Report synced to Prisma: 68ee...
Processing entities for report 68ee...
Extracted 5 entities from report
Created new entity: Trent
Processed entity: Trent (1 mentions)
```

✅ EntityChips appear below report with entity names
✅ Clicking chips navigates to entity detail pages

---

## 🔍 Debugging

### Check Logs
```bash
# Watch server logs
tail -f <terminal-running-npm-dev>
```

### Common Issues

**EntityChips not appearing?**
- Check server logs for "Extracted X entities"
- Verify ANTHROPIC_API_KEY in .env.local
- Check report has entity-rich content (companies, stocks, etc.)

**Database errors?**
- Verify .env.local has updated DATABASE_URL with timeout params
- Test connection: `npx prisma studio`

**AI extraction failing?**
- Check ANTHROPIC_API_KEY is valid
- Ensure report content is >100 characters
- Review Claude API response in logs

---

## 📞 Key Environment Variables

Required in `.env.local`:
```bash
# AI (Required for entity extraction)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Database (Fixed with timeouts)
DATABASE_URL=postgresql://...?connect_timeout=30&pool_timeout=30&pgbouncer=true
MONGODB_URI=mongodb://localhost:27017/assetworks

# Auth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3001
```

---

## 🎯 Next Development Tasks

### Immediate
- [ ] Test EntityChips display on new reports
- [ ] Verify entity detail pages work
- [ ] Check entity aggregation completes

### Future Enhancements
- [ ] Entity search and filtering
- [ ] Entity comparison views
- [ ] Entity relationship graph
- [ ] Bulk entity import/export
- [ ] Entity watchlists
- [ ] Email alerts for entity mentions

---

## 📚 Documentation

- **Full Context**: `CLAUDE_SESSION_CONTEXT.md`
- **Project Instructions**: `/Users/Victor/CLAUDE.md`
- **Schema**: `prisma/schema.prisma`

---

**Last Updated**: October 14, 2025 14:30 UTC
**Status**: 🟢 READY FOR TESTING
