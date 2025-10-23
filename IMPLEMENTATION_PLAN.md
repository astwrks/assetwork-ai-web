# 🛠️ Financial Playground Implementation Plan

## Overview
This plan addresses all missing features identified in the checklist, organized by priority and dependency.

## 🔴 Phase 1: Critical Fixes (Day 1)

### 1.1 Fix Report Persistence (2 hours)

**Problem**: Reports stream to UI but aren't saved to database

**Implementation Steps**:

1. **Create Report Save API** (`app/api/v2/reports/route.ts`):
```typescript
// POST /api/v2/reports
export async function POST(req: NextRequest) {
  const { threadId, title, htmlContent, metadata, entities } = await req.json();

  // Save report to database
  const report = await prisma.reports.create({
    data: {
      threadId,
      title,
      htmlContent,
      status: 'PUBLISHED',
      metadata,
      version: 1,
    }
  });

  // Save entities if provided
  if (entities?.length) {
    await saveEntities(entities, report.id);
  }

  return NextResponse.json({ data: report });
}
```

2. **Update `handleReportComplete` in `page.tsx:531`**:
```typescript
const handleReportComplete = async (report: Report, message: Message) => {
  // Save to database first
  const response = await fetch('/api/v2/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      threadId: currentThread.id,
      title: `Report for ${currentThread.title}`,
      htmlContent: report.htmlContent,
      metadata: {
        model: selectedModel,
        prompt: pendingReportGeneration.prompt,
        systemPrompt: selectedPrompt?.name,
        tokens: report.metadata?.tokens,
        cost: report.metadata?.cost,
      },
      entities: report.entities,
    })
  });

  if (response.ok) {
    const { data: savedReport } = await response.json();
    setCurrentReport(savedReport);
    setMessages(prev => [...prev, message]);
    setPendingReportGeneration(null);
    if (savedReport.entities) {
      setReportEntities(savedReport.entities);
    }
    toast.success('Report saved successfully');
  }
};
```

3. **Update Thread Load to Include Report**:
- Modify `/api/v2/threads/[threadId]/route.ts` to JOIN reports table
- Return latest report with thread data

### 1.2 Implement Section-Wise Loading (3 hours)

**Problem**: No progressive section loading like classic version

**Implementation Steps**:

1. **Create Section Components**:
```typescript
// app/financial-playground/components/ReportSection.tsx
interface ReportSection {
  id: string;
  title: string;
  content: string;
  status: 'loading' | 'complete' | 'error';
  order: number;
}

export function ReportSection({ section, isLoading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="report-section"
    >
      {isLoading ? (
        <div className="section-skeleton">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <div>
          <h3>{section.title}</h3>
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
      )}
    </motion.div>
  );
}
```

2. **Update Report Generation API**:
- Modify `/api/v2/reports/generate/route.ts` to stream sections
- Send section data as SSE events:
```typescript
// Stream sections as they generate
encoder.encode(`data: ${JSON.stringify({
  type: 'section',
  data: {
    id: sectionId,
    title: 'Executive Summary',
    content: '...',
    order: 1
  }
})}\n\n`);
```

3. **Update ReportGenerator Component**:
- Handle section events
- Display sections progressively
- Show loading state per section

### 1.3 Add Manual Report Generation Control (2 hours)

**Problem**: Auto-generates after every message (wasteful)

**Implementation Steps**:

1. **Add Generation Mode State**:
```typescript
const [generationMode, setGenerationMode] = useState<'manual' | 'auto'>('manual');
const [waitingToGenerate, setWaitingToGenerate] = useState(false);
```

2. **Add Generate Report Button**:
```typescript
// After message list, before report generator
{waitingToGenerate && (
  <div className="flex gap-2 p-4 border rounded-lg bg-muted/50">
    <Button onClick={handleGenerateReport} className="flex-1">
      <FileText className="w-4 h-4 mr-2" />
      Generate Report
    </Button>
    <Button onClick={handleAddToReport} variant="outline">
      <Plus className="w-4 h-4 mr-2" />
      Add to Report
    </Button>
  </div>
)}
```

3. **Modify Message Send Logic**:
```typescript
const sendMessage = async (content: string) => {
  // ... save message logic ...

  // Only trigger if auto mode
  if (generationMode === 'auto') {
    setPendingReportGeneration({...});
  } else {
    setWaitingToGenerate(true);
  }
};
```

## 🟡 Phase 2: Important Features (Day 2)

### 2.1 Real-time Token Counter & Cost Display (2 hours)

**Implementation**:

1. **Create TokenCounter Component**:
```typescript
// app/financial-playground/components/TokenCounter.tsx
export function TokenCounter({ tokens, cost, isStreaming }) {
  return (
    <div className="fixed top-16 right-4 z-50 bg-background border rounded-lg p-3">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">
            {tokens.toLocaleString()} tokens
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-green-600">
            ${cost.toFixed(4)}
          </span>
        </div>
        {isStreaming && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>
    </div>
  );
}
```

2. **Update Streaming to Include Token Data**:
- Modify API to send token updates
- Parse and display in UI

### 2.2 Context View Feature (2 hours)

**Implementation**:

1. **Add Context Dialog**:
```typescript
// Context view modal
<Dialog open={showContext} onOpenChange={setShowContext}>
  <DialogContent className="max-w-4xl max-h-[80vh]">
    <DialogHeader>
      <DialogTitle>Thread Context</DialogTitle>
    </DialogHeader>
    <ScrollArea className="flex-1">
      <pre className="text-xs font-mono">{contextMarkdown}</pre>
    </ScrollArea>
  </DialogContent>
</Dialog>
```

2. **Add Context API Calls**:
```typescript
const fetchContext = async () => {
  const response = await fetch(
    `/api/playground/threads/${threadId}/context-markdown`
  );
  const { markdown } = await response.json();
  setContextMarkdown(markdown);
};
```

### 2.3 Report Editing (3 hours)

**Implementation**:

1. **Add Edit Mode Toggle**:
```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [editedSections, setEditedSections] = useState({});
```

2. **Create Editable Section Component**:
```typescript
// Contenteditable sections
<div
  contentEditable={isEditMode}
  onBlur={(e) => handleSectionEdit(section.id, e.target.innerHTML)}
  dangerouslySetInnerHTML={{ __html: section.content }}
/>
```

3. **Save Edited Content**:
```typescript
const saveEdits = async () => {
  await fetch(`/api/playground/reports/${reportId}/sections/${sectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content: editedContent })
  });
};
```

## 🟢 Phase 3: Enhancements (Day 3)

### 3.1 Auto-Load Latest Thread (1 hour)

**Implementation**:
```typescript
useEffect(() => {
  if (status === 'authenticated' && !searchParams.get('thread')) {
    loadThreads().then(threads => {
      if (threads.length > 0 && !currentThread) {
        const latest = threads[0];
        router.push(`/financial-playground?thread=${latest.id}`);
      }
    });
  }
}, [status]);
```

### 3.2 Thread Summaries (2 hours)

**Implementation**:

1. **Generate Summary on Thread Update**:
```typescript
// In thread list component
const generateSummary = async (messages) => {
  const summary = messages
    .slice(-3)
    .map(m => m.content.substring(0, 100))
    .join(' ');
  return summary;
};
```

2. **Display in Sidebar**:
```typescript
<div className="thread-item">
  <div className="font-medium">{thread.title}</div>
  <div className="text-xs text-muted-foreground">
    {thread.summary}
  </div>
  <Badge variant="secondary">{thread.messageCount}</Badge>
</div>
```

### 3.3 Suggestions System (2 hours)

**Implementation**:

1. **Add Suggestions Panel**:
```typescript
<div className="suggestions-panel">
  <Button onClick={fetchSuggestions}>
    <Sparkles className="w-4 h-4 mr-2" />
    Get AI Suggestions
  </Button>
  {suggestions.map(suggestion => (
    <Card key={suggestion.id} className="p-3">
      <p>{suggestion.text}</p>
      <Button size="sm" onClick={() => applySuggestion(suggestion)}>
        Apply
      </Button>
    </Card>
  ))}
</div>
```

## 📊 Database Migrations Required

```sql
-- Ensure reports table has all fields
ALTER TABLE reports ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE reports ADD INDEX idx_reports_thread_id (thread_id);

-- Create report_sections table if not exists
CREATE TABLE IF NOT EXISTS report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  title TEXT,
  content TEXT,
  order INTEGER,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add summary to threads
ALTER TABLE threads ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
```

## 🧪 Testing Plan

### Unit Tests:
- Report persistence
- Section loading
- Token counting
- Context generation

### Integration Tests:
- Full user flow
- Report generation → save → load
- Edit → save → reload

### E2E Tests:
- Complete user journey
- Multiple browser sessions
- Error recovery

## 📅 Timeline

**Day 1 (8 hours)**:
- Morning: Report persistence (2h)
- Afternoon: Section loading (3h) + Manual generation (2h)
- Testing: 1h

**Day 2 (7 hours)**:
- Morning: Token counter (2h) + Context view (2h)
- Afternoon: Report editing (3h)

**Day 3 (5 hours)**:
- Morning: Auto-load (1h) + Summaries (2h)
- Afternoon: Suggestions (2h)

**Total**: 20 hours

## 🚦 Success Metrics

1. **Report Persistence**: 100% of reports saved
2. **Section Loading**: < 2s per section
3. **Token Accuracy**: ±5% of actual usage
4. **User Control**: 0 unwanted generations
5. **Data Integrity**: No data loss on refresh

## 🎯 Deliverables

1. Fully functional Financial Playground
2. All classic features restored
3. Performance optimizations
4. Complete test coverage
5. Documentation updated

## 📝 Notes

- Start with Phase 1 as it's blocking other features
- Test each phase thoroughly before moving on
- Keep existing working features intact
- Use feature flags if needed for gradual rollout
- Monitor performance throughout implementation

## 🔄 Rollback Plan

If issues arise:
1. Keep backup of current working version
2. Use feature flags to disable new features
3. Revert database migrations if needed
4. Restore from git commits

## ✅ Definition of Done

Each feature is complete when:
- Code implemented and reviewed
- Tests written and passing
- Documentation updated
- Performance acceptable
- No regressions introduced
- User can complete full flow