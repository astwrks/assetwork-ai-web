# Classic Playground - Quick Reference Guide

## Fast Navigation

### Main Files
- **Main Page**: `/app/financial-playground-classic/page.tsx` (1,320 lines)
- **Report Generator**: `/app/financial-playground-classic/components/ReportGenerator.tsx` (315 lines)
- **Report Section**: `/app/financial-playground-classic/components/ReportSection.tsx` (150+ lines)
- **API Endpoint**: `/app/api/v2/reports/generate/route.ts` (266 lines)
- **Report Service**: `/lib/services/report-generation.service.ts`

### Database
- **Prisma Schema**: `/prisma/schema.prisma`
- **Key Tables**: `threads`, `messages`, `playground_reports`, `entities`, `entity_mentions`

---

## Report Generation Flow (TL;DR)

```
User types message
    ↓
sendMessage() creates temp message + saves to DB
    ↓
setPendingReportGeneration() state triggers
    ↓
ReportGenerator component mounts
    ↓
useEffect → generateReport() → POST /api/v2/reports/generate
    ↓
Server streams back SSE events:
  - 'content': Report text
  - 'sections': Structured parts
  - 'complete': Finished report
    ↓
Client accumulates and renders in real-time
    ↓
onReportComplete() callback:
  - Sets currentReport state
  - Auto-opens right panel
  - Extracts entities
    ↓
User sees report in right-side panel
```

---

## State Keys to Know

### Report Generation
- `pendingReportGeneration`: Triggers generation (contains threadId, prompt, model, systemPrompt)
- `currentReport`: Holds completed report data
- `isReportPanelOpen`: Controls right panel visibility

### Messages & Threads
- `messages`: Array of all messages in current thread
- `currentThread`: Active thread object
- `threads`: List of all user threads

### UI
- `selectedModel`: Active Claude model
- `selectedPrompt`: Active system prompt
- `isSidebarOpen`: Left sidebar visibility

---

## Common Component Props

### ReportGenerator
```typescript
threadId: string
prompt: string
model: string
systemPrompt?: { name, content, icon }
onReportComplete?: (report) => void
onCancel?: () => void
```

### ReportSection
```typescript
section: { id, title, content, order, status }
isLoading?: boolean
```

### EntityBar
```typescript
entities: Entity[]
onEntityClick?: (entity) => void
```

---

## API Endpoints

### Report Generation
```
POST /api/v2/reports/generate
Body: { threadId, prompt, model, systemPrompt, options }
Response: SSE stream with chunks
```

### Save Report
```
POST /api/v2/reports
Body: { threadId, htmlContent, metadata }
Response: { success, data: report }
```

### Get Reports
```
GET /api/v2/reports?threadId=xxx&limit=50
Response: { success, data: [reports] }
```

### Export Report
```
POST /api/v2/reports/{reportId}/export
Body: { format: "pdf" }
Response: PDF blob
```

### Share Report
```
POST /api/v2/reports/{reportId}/share
Body: { expiresIn: "7d" }
Response: { success, data: { shareUrl } }
```

---

## Key Code Patterns

### Message Sending
```typescript
// Optimistic update + DB sync
const tempId = `temp-${Date.now()}`;
setMessages(prev => [...prev, tempMessage]);
// API call...
setMessages(prev => prev.map(m => m.id === tempId ? {...m, id: realId} : m));
```

### Report Completion
```typescript
const handleReportComplete = (report) => {
  setCurrentReport(report);
  setIsReportPanelOpen(true);
  if (report.entities) setReportEntities(report.entities);
  setPendingReportGeneration(null);
};
```

### SSE Streaming
```typescript
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // Handle: 'content', 'sections', 'complete', 'error'
    }
  }
}
```

---

## UI Layout

### 3-Panel Structure
```
┌─────────────────────────────────────────────────┐
│              Header (14h) with actions          │
├──────────┬──────────────────────────┬───────────┤
│          │                          │           │
│ Sidebar  │    Chat/Messages         │ Report    │
│ (280px)  │    + Entity Bar           │ Panel     │
│          │    + Input                │ (500px)   │
│          │                          │           │
│ Threads  │  Messages               │ Report    │
│ + New    │  Real-time streaming    │ Display   │
│ Thread   │                          │ + Chips   │
│          │                          │           │
└──────────┴──────────────────────────┴───────────┘
```

---

## Animation Details

### Section Entrance
- Initial: `opacity: 0, y: 20`
- Animate: `opacity: 1, y: 0`
- Duration: 0.4s
- Easing: `[0.4, 0, 0.2, 1]` (cubic bezier)
- Stagger: 50ms delay per section (index * 0.05)

### Panel Auto-Open
- Slides in from right
- Auto-triggers on report complete
- User can close with X button

---

## Rate Limiting

- **Development**: 100 reports/hour
- **Production**: 10 reports/hour
- **Key**: `report-gen:{email}`
- **Error Code**: 429 (Too Many Requests)

---

## WebSocket Events

```typescript
// Real-time updates
'message:created' → New message received
'thread:updated' → Thread data changed
'entity:extracted' → New entity found
```

---

## Export Formats

### Markdown
```
# Thread Title
Created: [date]
System Prompt: [name]
Model: [model]

---

## Conversation

### User (time)
[message]

### Assistant (time)
[response]

---

## Extracted Entities
- Entity Name (ticker) - type
```

### JSON
```json
{
  "thread": { ... },
  "messages": [ ... ],
  "entities": [ ... ],
  "report": { ... },
  "metadata": {
    "systemPrompt": { ... },
    "model": "...",
    "exportedAt": "..."
  }
}
```

### PDF
- Server-side rendering
- Report format only
- Endpoint: `/api/v2/reports/{id}/export`

---

## Error Handling

### Common Errors
- **401**: Not authenticated
- **429**: Rate limited
- **400**: Validation failed (check request body)
- **500**: Server error (check logs)

### Stream Errors
- Server sends `{ type: 'error', error: 'message' }`
- Client catches and displays
- Component state set to 'error'

### Cancellation
- User clicks "Stop" button
- AbortController cancels fetch
- Component shows "Generation cancelled"

---

## Debugging Tips

### Check State
```typescript
// In console
console.log('[FinancialPlayground] Current report:', currentReport);
console.log('[FinancialPlayground] Pending generation:', pendingReportGeneration);
console.log('[FinancialPlayground] Report panel open:', isReportPanelOpen);
```

### Check Stream
```typescript
// Network tab → filter for /api/v2/reports/generate
// Should see:
// data: {"type":"content"...}
// data: {"type":"sections"...}
// data: {"type":"complete"...}
// data: [DONE]
```

### Check Database
```sql
-- Recent reports
SELECT * FROM playground_reports ORDER BY createdAt DESC LIMIT 5;

-- Thread messages
SELECT * FROM messages WHERE threadId = 'xxx' ORDER BY createdAt;

-- Extracted entities
SELECT * FROM entity_mentions WHERE reportId = 'yyy';
```

---

## Performance Tips

1. **Report Too Slow?**
   - Check model selection (haiku < sonnet < opus in speed)
   - Check prompt length
   - Monitor rate limit usage

2. **UI Laggy?**
   - Check section count (too many?)
   - Monitor animation frame rate (DevTools → Performance)
   - Reduce animation complexity

3. **Database Slow?**
   - Check connection pooling
   - Monitor query count
   - Check for N+1 queries

---

## Testing Checklist

- [ ] Send message appears immediately
- [ ] Message saves to database
- [ ] Report generation starts automatically
- [ ] Sections stream in real-time
- [ ] Progress bar updates
- [ ] Report completes successfully
- [ ] Panel opens automatically
- [ ] Entities are extracted
- [ ] Report can be exported (PDF, JSON, MD)
- [ ] Report can be shared
- [ ] Can close and reopen panel
- [ ] Can delete message
- [ ] Can create new thread
- [ ] Can switch between threads

---

## Key Dependencies

- `next`: Framework
- `react`: UI library
- `@anthropic-ai/sdk`: Claude API
- `prisma`: Database ORM
- `framer-motion`: Animations
- `shadcn/ui`: Component library
- `next-auth`: Authentication
- `react-resizable-panels`: Panel layout

---

## Environment Variables

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
ANTHROPIC_API_KEY=sk-...
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=...
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start dev server
npm run dev

# Open browser
http://localhost:3001/financial-playground-classic
```

---

## Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open database UI
npx prisma studio

# View logs
tail -f .next/server.log

# Build for production
npm run build

# Start production server
npm start
```

---

## Documentation Files

- **Full Architecture**: `CLASSIC_PLAYGROUND_ARCHITECTURE.md`
- **Report Flow**: `REPORT_GENERATION_FLOW.md`
- **API Docs**: `API_DOCUMENTATION.md`
- **Fixes Applied**: `CLASSIC_PLAYGROUND_FIXES.md`

