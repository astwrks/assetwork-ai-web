# 🎨 3-Panel Layout Implementation

## New Layout Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  Header (Always Visible)                                               │
│  Logo | Thread | Status | Export | Settings                           │
├──────────────┬─────────────────────────────┬─────────────────────────┤
│              │                              │                          │
│  LEFT PANEL  │      CENTER PANEL           │    RIGHT PANEL          │
│  (w-80)      │      (flex-1)               │    (w-600px)            │
│              │                              │                          │
│ Conversations│  Model & Prompt Selector    │  Generated Report       │
│              │  ─────────────────────────   │  ─────────────────────  │
│              │                              │                          │
│  Thread 1    │  User: Analyze Tesla        │  [Streaming...] or      │
│  Thread 2    │  AI: [Analyzing...]         │  [Full HTML Report]     │
│  Thread 3    │                              │                          │
│              │  User: Compare...           │  [Interactive Charts]   │
│  [Collapse]  │  AI: Here's...              │  [Sections]             │
│              │                              │  [Metrics]              │
│              │  [Input field here]         │                          │
│              │                              │  [Collapse]             │
└──────────────┴─────────────────────────────┴─────────────────────────┘
```

## Features

### Left Panel (Conversations)
- ✅ Thread list
- ✅ Toggle open/closed
- ✅ Width: 320px (80 units)
- ✅ Smooth animation

### Center Panel (Chat)
- ✅ User messages
- ✅ AI responses (text only, not full report)
- ✅ Model selector
- ✅ System prompt selector
- ✅ Input area
- ✅ Takes remaining space

### Right Panel (Reports) **NEW!**
- ✅ Shows streaming report in real-time
- ✅ Shows saved report when loaded
- ✅ Toggle open/closed
- ✅ Width: 600px
- ✅ Auto-opens when generation starts
- ✅ HTML iframe rendering
- ✅ Full interactivity

## Implementation Details

### State Added:
```typescript
const [isReportPanelOpen, setIsReportPanelOpen] = useState(true);
const [streamingContent, setStreamingContent] = useState<string>('');
```

### Right Panel Toggle Button:
Located in model selector bar (top right area):
```typescript
{!isReportPanelOpen && (
  <Button onClick={() => setIsReportPanelOpen(true)}>
    <ChevronLeft /> Show Report
  </Button>
)}
```

### Report Streaming:
```typescript
<ReportGenerator
  ...
  onContentUpdate={setStreamingContent} // Updates right panel in real-time
/>
```

### Right Panel Content:
```typescript
{pendingReportGeneration ? (
  // Show streaming content
  <iframe srcDoc={streamingContent} />
) : currentReport ? (
  // Show saved report
  <iframe srcDoc={currentReport.htmlContent} />
) : (
  // Empty state
  "No report generated yet"
)}
```

## User Experience

### Scenario 1: New Conversation
1. User creates new thread
2. Types message: "Analyze Apple stock"
3. Sends message
4. **Center**: Shows user message + AI thinking indicator
5. **Right**: Auto-opens, streams report in real-time
6. User can watch report build while chatting

### Scenario 2: Open Existing Thread
1. User clicks thread from left panel
2. **Center**: Loads all chat messages
3. **Right**: Shows saved report (if exists) OR auto-generates

### Scenario 3: Toggle Panels
1. User closes left panel → More space for center + right
2. User closes right panel → More space for chat
3. User can close both → Full-width chat experience

## Benefits

✅ **Separation of Concerns**:
- Chat = Conversation flow
- Report = Final output/analysis

✅ **Better UX**:
- Can reference report while chatting
- Can scroll report independently
- Can focus on chat or report

✅ **More Space**:
- Reports get dedicated 600px width
- Better for complex visualizations
- Chat not cramped by embedded reports

✅ **Flexibility**:
- Close panels you don't need
- Customize your workspace
- Responsive on all screens

## Toggle Buttons

### Left Panel:
- **Close**: Chevron in panel header
- **Open**: Chevron button in model bar (when closed)

### Right Panel:
- **Close**: Chevron in panel header
- **Open**: Chevron button in model bar (when closed)

## CSS Classes

```typescript
// Left Panel
isSidebarOpen ? "w-80" : "w-0 border-0"

// Center Panel  
"flex-1 flex flex-col min-w-0"

// Right Panel
isReportPanelOpen ? "w-[600px]" : "w-0 border-0"
```

All panels use width-based transitions for smooth, no-jank animations!

## Status

✅ 3-panel layout implemented
✅ Report panel toggleable
✅ Streaming to right panel
✅ Auto-opens on generation
✅ Smooth animations
✅ No layout breaking
✅ Responsive design

**Ready to use!** 🎉
