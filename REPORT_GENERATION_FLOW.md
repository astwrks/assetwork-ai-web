# 📊 AssetWorks Report Generation Flow - Complete Analysis

## ✅ Current Implementation Status

### Flow Overview
```
User Input → Message Save → Report Generation → Streaming Display → (Missing: Persistence)
```

## 🔄 Detailed Flow Breakdown

### Phase 1: User Interaction ✅
**Location**: `app/financial-playground/page.tsx:244`

1. User types message in input field
2. Clicks send button or presses Enter
3. `sendMessage(inputMessage)` is called

**What Happens**:
- Creates temp message with client-side ID
- Adds to UI immediately (optimistic update)
- Posts to `/api/v2/messages` to save in database
- Updates message with real database ID
- Sets `pendingReportGeneration` state

**Status**: ✅ Working correctly

---

### Phase 2: Message Persistence ✅
**API**: `POST /api/v2/messages`
**Database**: `messages` table

**Request**:
```json
{
  "threadId": "thread-123",
  "role": "user",
  "content": "Analyze Apple stock performance"
}
```

**Response**:
```json
{
  "data": {
    "id": "msg-456",
    "threadId": "thread-123",
    "role": "user",
    "content": "...",
    "createdAt": "2024-..."
  }
}
```

**Status**: ✅ Working - messages are saved

---

### Phase 3: Report Generation Trigger ✅
**State Change**: `pendingReportGeneration`

**Data Structure**:
```typescript
{
  threadId: string,
  prompt: string,
  model: "claude-3-5-sonnet-20241022",
  systemPrompt: {
    name: "Financial Report Assistant",
    content: "You are a professional..."
  }
}
```

**React Behavior**:
- State change triggers re-render
- `ReportGenerator` component mounts
- `useEffect` fires and calls `generateReport()`

**Status**: ✅ Working correctly

---

### Phase 4: Report API Call ❌ 
**Component**: `app/financial-playground/components/ReportGenerator.tsx:40`

**Issue**: Wrong endpoint!
```typescript
// Current (WRONG):
fetch('/api/reports/generate', ...)

// Should be:
fetch('/api/v2/reports/generate', ...)
```

**Available Endpoints**:
- ✅ `/api/v2/reports/generate` - Full implementation
- ✅ `/api/generate-report` - Alternative route
- ❌ `/api/reports/generate` - Does NOT exist

**Impact**: Report generation fails with 404

**Status**: ❌ BROKEN - needs fix

---

### Phase 5: Streaming Response ⚠️
**API**: `POST /api/v2/reports/generate`

**Expected Request**:
```json
{
  "threadId": "thread-123",
  "prompt": "Analyze...",
  "model": "claude-3-5-sonnet-20241022",
  "systemPrompt": "You are...",
  "options": {
    "stream": true,
    "extractEntities": true,
    "generateCharts": true
  }
}
```

**Streaming Format (SSE)**:
```
data: {"type":"content","content":"# Financial Analysis\n"}
data: {"type":"content","content":"Apple Inc. (AAPL)..."}
data: {"type":"complete","report":{"id":"rpt-789",...}}
```

**Component Handling**:
1. Reads stream chunk by chunk
2. Parses SSE format (`data: {...}`)
3. Accumulates content
4. Updates progress bar
5. Calls `onReportComplete()` when done

**Status**: ⚠️ Partially working (if endpoint fixed)

---

### Phase 6: Report Completion ❌
**Callback**: `onReportComplete(report)`

**Expected**:
```typescript
onReportComplete={(report) => {
  // Save report to state
  setCurrentReport(report);
  // Extract and save entities
  setReportEntities(report.entities);
  // Clear pending state
  setPendingReportGeneration(null);
}}
```

**Current**: ⚠️ Callback defined but not fully implemented

**Missing**:
- Report not saved to database
- Entities not extracted/saved
- No link between message and report
- No persistence layer

**Status**: ❌ Incomplete

---

## 🔍 Database Schema Analysis

### Tables Involved:

#### ✅ `threads`
```sql
- id (primary)
- userId
- title
- description
- status
- createdAt, updatedAt
```

#### ✅ `messages`
```sql
- id (primary)
- threadId (foreign key)
- role (user/assistant/system)
- content
- createdAt
```

#### ✅ `reports`
```sql
- id (primary)
- userId (foreign key)
- threadId (foreign key) <- Links to conversation
- title
- description
- htmlContent <- Generated content
- version
- status (DRAFT/PUBLISHED)
- metadata (JSON)
- createdAt, updatedAt
```

#### ✅ `entities`
```sql
- id (primary)
- name
- type (company/person/metric)
- metadata
```

#### ✅ `entity_mentions`
```sql
- id (primary)
- reportId (foreign key)
- entityId (foreign key)
- count <- How many times mentioned
```

**Status**: ✅ All tables exist and properly configured

---

## ⚠️ Issues Summary

### Critical Issues:

1. **❌ Wrong API Endpoint**
   - **File**: `app/financial-playground/components/ReportGenerator.tsx:40`
   - **Fix**: Change `/api/reports/generate` → `/api/v2/reports/generate`
   - **Impact**: Report generation completely fails

2. **❌ Missing Report Persistence**
   - Generated reports are NOT saved to database
   - Only streamed to UI, then lost
   - No report history
   - **Fix**: Implement save logic in completion callback

3. **❌ No Entity Extraction Save**
   - Entities extracted but not persisted
   - Lost on page refresh
   - **Fix**: Save entities and entity_mentions to database

4. **⚠️ Missing Message-Report Link**
   - User message saved separately
   - Report (if saved) not linked to triggering message
   - Can't trace which message created which report

### Minor Issues:

5. **⚠️ No Error Recovery**
   - If generation fails, no retry mechanism
   - User stuck with error state

6. **⚠️ No Loading Persistence**
   - Page refresh during generation loses everything
   - No way to reconnect to in-progress generation

---

## ✅ What's Working

1. ✅ Thread creation and management
2. ✅ Message saving to database
3. ✅ System prompt selection
4. ✅ Model selection
5. ✅ Settings synchronization
6. ✅ UI state management
7. ✅ Streaming response parsing (when endpoint works)
8. ✅ Progress indication
9. ✅ Error display

---

## 🔧 Required Fixes

### Priority 1: Critical (Must Fix Now)

1. **Fix API Endpoint Path**
   ```typescript
   // app/financial-playground/components/ReportGenerator.tsx:40
   - fetch('/api/reports/generate', {
   + fetch('/api/v2/reports/generate', {
   ```

### Priority 2: Important (Should Fix Soon)

2. **Implement onReportComplete in Parent**
   ```typescript
   // app/financial-playground/page.tsx
   const handleReportComplete = async (report) => {
     // 1. Save report to database
     const savedReport = await fetch('/api/v2/reports', {
       method: 'POST',
       body: JSON.stringify({
         threadId: currentThread.id,
         title: report.title,
         htmlContent: report.content,
         ...
       })
     });
     
     // 2. Save entities
     if (report.entities) {
       await saveEntities(report.entities, savedReport.id);
     }
     
     // 3. Update UI state
     setCurrentReport(savedReport);
     setReportEntities(report.entities || []);
     setPendingReportGeneration(null);
   };
   ```

3. **Add Report Save Route** (if missing)
   ```typescript
   // app/api/v2/reports/route.ts
   POST /api/v2/reports -> Save completed report
   ```

### Priority 3: Enhancement (Nice to Have)

4. **Add WebSocket for Real-time Updates**
5. **Implement Report Versioning**
6. **Add Report Templates**
7. **Enable Report Sharing**

---

## 📝 Testing Checklist

After fixes, test this flow:

- [ ] User can send a message
- [ ] Message appears in UI immediately
- [ ] Message is saved to database
- [ ] Report generation starts automatically
- [ ] Progress bar updates during generation
- [ ] Streaming content displays in real-time
- [ ] Report completes successfully
- [ ] Report is saved to database with correct threadId
- [ ] Entities are extracted and saved
- [ ] Report persists after page refresh
- [ ] Can view report history
- [ ] Error handling works correctly

---

## 🎯 Expected Final Flow

```
1. User types message
   ↓
2. Message saved to DB (messages table)
   ↓
3. Trigger report generation
   ↓
4. Stream report content to UI
   ↓
5. Save completed report to DB (reports table)
   ↓
6. Extract and save entities (entities + entity_mentions tables)
   ↓
7. Update UI with saved report
   ↓
8. User can view, share, or regenerate
```

---

**Status**: 🔴 Report generation currently broken due to wrong API endpoint. Quick fix available.

