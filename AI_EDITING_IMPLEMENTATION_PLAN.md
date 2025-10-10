# AI Editing & Section Management - V2 Implementation Plan

## Executive Summary

Implementation plan for bringing advanced AI editing, section-wise management, and contextual suggestions from the original Financial Playground into the V2 UI with improved visual design.

**Estimated Implementation Time**: 4-6 hours
**Complexity**: High
**Dependencies**: Existing APIs from v1 (all endpoints already exist)

---

## Phase 1: Foundation & State Management (1 hour)

### 1.1 Add State Variables to page.tsx

```typescript
// Section management
const [sections, setSections] = useState<Section[]>([]);
const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

// Editing context - special mode where input changes purpose
const [editingContext, setEditingContext] = useState<{
  type: 'edit' | 'add';
  sectionId?: string;
  section?: Section;
  position?: number;
} | null>(null);

// Preview & streaming states
const [sectionPreviewContent, setSectionPreviewContent] = useState<Record<string, string>>({});
const [sectionStreamingState, setSectionStreamingState] = useState<Record<string, boolean>>({});
```

### 1.2 Section Interface

```typescript
interface Section {
  _id: string;
  reportId: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'insight' | 'custom';
  title: string;
  htmlContent: string;
  order: number;
  version: number;
  editHistory?: Array<{
    version: number;
    htmlContent: string;
    prompt?: string;
    editedBy: string;
    editedAt: string;
  }>;
  metadata?: {
    originallyGeneratedBy?: string;
    lastModifiedBy?: string;
    model?: string;
    originalPrompt?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 1.3 Load Sections Function

```typescript
const loadSections = async (reportId: string) => {
  try {
    const response = await fetch(`/api/playground/reports/${reportId}/sections`);
    if (response.ok) {
      const data = await response.json();
      setSections(data.sections || []);
    }
  } catch (error) {
    console.error('Error loading sections:', error);
  }
};
```

---

## Phase 2: ReportDisplay Enhancement (1.5 hours)

### 2.1 Convert ReportDisplay to Support Interactive Sections

**Current**: Displays static HTML with `dangerouslySetInnerHTML`
**Target**: Display array of interactive sections with toolbars

**New Props**:
```typescript
interface ReportDisplayProps {
  threadId?: string;
  reportId?: string;
  messages?: any[];
  sections?: Section[];  // NEW
  selectedSectionId?: string | null;  // NEW
  editingContext?: any | null;  // NEW
  sectionPreviewContent?: Record<string, string>;  // NEW
  sectionStreamingState?: Record<string, boolean>;  // NEW
  onSelectSection?: (sectionId: string) => void;  // NEW
  onEditSection?: (sectionId: string) => void;  // NEW
  onDeleteSection?: (sectionId: string) => void;  // NEW
  onDuplicateSection?: (sectionId: string) => void;  // NEW
  onMoveSection?: (sectionId: string, direction: 'up' | 'down') => void;  // NEW
  onToggleCollapse?: (sectionId: string) => void;  // NEW
  collapsedSections?: Record<string, boolean>;  // NEW
  onClose?: () => void;
}
```

### 2.2 Render Logic

```typescript
// Check if report has sections (interactive mode)
const hasInteractiveSections = sections && sections.length > 0;

return (
  <div className="flex flex-col h-full">
    {hasInteractiveSections ? (
      // New: Interactive Section Mode
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <InteractiveSection
              key={section._id}
              section={section}
              isSelected={selectedSectionId === section._id}
              isEditing={editingContext?.sectionId === section._id}
              isStreaming={sectionStreamingState?.[section._id]}
              previewContent={sectionPreviewContent?.[section._id]}
              isCollapsed={collapsedSections?.[section._id]}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
              onSelect={() => onSelectSection?.(section._id)}
              onEdit={() => onEditSection?.(section._id)}
              onDelete={() => onDeleteSection?.(section._id)}
              onDuplicate={() => onDuplicateSection?.(section._id)}
              onMoveUp={() => onMoveSection?.(section._id, 'up')}
              onMoveDown={() => onMoveSection?.(section._id, 'down')}
              onToggleCollapse={() => onToggleCollapse?.(section._id)}
            />
          ))}
        </div>
      </ScrollArea>
    ) : (
      // Existing: Static HTML Mode
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="prose max-w-none report-content"
          dangerouslySetInnerHTML={{ __html: report.htmlContent }}
        />
      </ScrollArea>
    )}
  </div>
);
```

---

## Phase 3: InteractiveSection Component (1.5 hours)

### 3.1 Component Structure

```typescript
// File: /components/financial-playground/InteractiveSection.tsx

interface InteractiveSectionProps {
  section: Section;
  isSelected: boolean;
  isEditing: boolean;
  isStreaming: boolean;
  previewContent?: string;
  isCollapsed: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleCollapse: () => void;
}

export default function InteractiveSection({
  section,
  isSelected,
  isEditing,
  isStreaming,
  previewContent,
  isCollapsed,
  isFirst,
  isLast,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onToggleCollapse,
}: InteractiveSectionProps) {
  const contentToDisplay = previewContent || section.htmlContent;

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 transition-all duration-200 group",
        "hover:border-gray-300 cursor-pointer",
        isSelected && "border-blue-500 ring-2 ring-blue-200",
        isEditing && "border-blue-500 ring-2 ring-blue-400 animate-pulse",
        !isSelected && !isEditing && "border-gray-200"
      )}
      onClick={onSelect}
    >
      {/* Streaming Shimmer Overlay */}
      {isStreaming && (
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Edit Badge */}
      {isEditing && (
        <div className="absolute -top-3 left-4 z-10">
          <Badge className="bg-blue-500 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            {isStreaming ? 'AI Generating...' : 'Editing'}
          </Badge>
        </div>
      )}

      {/* Floating Toolbar - only show when selected */}
      {isSelected && !isEditing && (
        <div className="absolute -top-3 right-4 z-10 flex items-center gap-1 bg-white border rounded-lg shadow-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {isCollapsed ? (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-700">{section.title}</h3>
            <Badge variant="outline" className="text-xs">Collapsed</Badge>
          </div>
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: contentToDisplay }}
          />
        )}
      </div>

      {/* Hover Tooltip */}
      {!isSelected && !isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded">
            Click to select
          </span>
        </div>
      )}
    </div>
  );
}
```

### 3.2 Required CSS Animations

```css
/* Add to globals.css or playground.css */

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

---

## Phase 4: EditingContext Component (1 hour)

### 4.1 Component Purpose

Displays above chat input when in edit mode, showing:
- Section being edited
- 5 AI-generated contextual suggestions
- Cancel button

### 4.2 Component Structure

```typescript
// File: /components/financial-playground/EditingContext.tsx

interface EditingContextProps {
  type: 'edit' | 'add';
  section?: Section;
  position?: number;
  onCancel: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function EditingContext({
  type,
  section,
  position,
  onCancel,
  onSuggestionClick,
}: EditingContextProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/playground/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            sectionTitle: section?.title,
            sectionContent: section?.htmlContent.substring(0, 500),
            position,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [type, section, position]);

  return (
    <div className="border-t bg-blue-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {type === 'edit'
              ? `Editing: ${section?.title}`
              : `Add new section at position ${(position || 0) + 1}`
            }
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>

      {/* AI Suggestions */}
      <div className="space-y-2">
        <p className="text-xs text-blue-700 font-medium">AI Suggestions:</p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Generating suggestions...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 text-xs hover:bg-blue-100 hover:border-blue-300"
                onClick={() => onSuggestionClick(suggestion)}
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 5: Editing Logic Integration (1 hour)

### 5.1 Modify sendMessage Function

```typescript
const sendMessage = async (messageOverride?: string) => {
  const userMessage = messageOverride || inputValue.trim();
  if (!userMessage || !activeThread) return;

  // **CRITICAL: Check if we're in editing mode**
  if (editingContext) {
    if (editingContext.type === 'edit' && editingContext.sectionId) {
      // Edit existing section (NO CHAT MESSAGE)
      await handleSectionEdit(editingContext.sectionId, userMessage);
      setInputValue('');
      return; // Exit early - don't create chat message
    } else if (editingContext.type === 'add') {
      // Add new section (NO CHAT MESSAGE)
      await handleSectionAdd(userMessage, editingContext.position);
      setInputValue('');
      return; // Exit early - don't create chat message
    }
  }

  // Normal chat message flow...
  // (existing code for regular messages)
};
```

### 5.2 Section Edit Handler (Streaming)

```typescript
const handleSectionEdit = async (sectionId: string, prompt: string) => {
  if (!activeThread?.currentReportId) return;

  try {
    // Set streaming state
    setSectionStreamingState(prev => ({ ...prev, [sectionId]: true }));
    setSectionPreviewContent(prev => ({ ...prev, [sectionId]: '' }));

    const response = await fetch(
      `/api/playground/reports/${activeThread.currentReportId}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
        }),
      }
    );

    if (!response.ok) throw new Error('Edit failed');

    // Stream response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content') {
              accumulated += data.content;
              setSectionPreviewContent(prev => ({
                ...prev,
                [sectionId]: accumulated,
              }));
            } else if (data.type === 'complete') {
              // Reload sections to get updated version
              await loadSections(activeThread.currentReportId!);
              toast.success('Section updated successfully');
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('Section edit error:', error);
    toast.error('Failed to edit section');
  } finally {
    // Clear states
    setSectionStreamingState(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
    setSectionPreviewContent(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
    setEditingContext(null);
    setSelectedSectionId(null);
  }
};
```

### 5.3 Section Add Handler

```typescript
const handleSectionAdd = async (prompt: string, position?: number) => {
  if (!activeThread?.currentReportId) return;

  try {
    let newSectionId: string | null = null;

    const response = await fetch(
      `/api/playground/reports/${activeThread.currentReportId}/sections`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          position,
          type: 'custom',
          model: 'claude-3-5-sonnet-20241022',
          provider: 'anthropic',
        }),
      }
    );

    if (!response.ok) throw new Error('Add section failed');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'section_id') {
              newSectionId = data.sectionId;
              setSectionStreamingState(prev => ({ ...prev, [newSectionId!]: true }));
              setSectionPreviewContent(prev => ({ ...prev, [newSectionId!]: '' }));
            } else if (data.type === 'content' && newSectionId) {
              accumulated += data.content;
              setSectionPreviewContent(prev => ({
                ...prev,
                [newSectionId!]: accumulated,
              }));
            } else if (data.type === 'complete') {
              await loadSections(activeThread.currentReportId!);
              toast.success('Section added successfully');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error('Section add error:', error);
    toast.error('Failed to add section');
  } finally {
    setEditingContext(null);
  }
};
```

### 5.4 Other Section Operations

```typescript
const handleSectionDelete = async (sectionId: string) => {
  if (!activeThread?.currentReportId) return;

  if (!confirm('Are you sure you want to delete this section?')) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${activeThread.currentReportId}/sections/${sectionId}`,
      { method: 'DELETE' }
    );

    if (response.ok) {
      await loadSections(activeThread.currentReportId);
      toast.success('Section deleted');
      setSelectedSectionId(null);
    }
  } catch (error) {
    toast.error('Failed to delete section');
  }
};

const handleSectionDuplicate = async (sectionId: string) => {
  if (!activeThread?.currentReportId) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${activeThread.currentReportId}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      }
    );

    if (response.ok) {
      await loadSections(activeThread.currentReportId);
      toast.success('Section duplicated');
    }
  } catch (error) {
    toast.error('Failed to duplicate section');
  }
};

const handleSectionMove = async (sectionId: string, direction: 'up' | 'down') => {
  if (!activeThread?.currentReportId) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${activeThread.currentReportId}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `move-${direction}` }),
      }
    );

    if (response.ok) {
      await loadSections(activeThread.currentReportId);
    }
  } catch (error) {
    toast.error(`Failed to move section ${direction}`);
  }
};
```

---

## Phase 6: UI Polish & Input Changes (30 minutes)

### 6.1 Dynamic Input Placeholder

```typescript
<textarea
  ref={inputRef}
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder={
    editingContext
      ? (editingContext.type === 'edit'
          ? "What would you like to change?"
          : "Describe the new section to add...")
      : "Send a message..."
  }
  className={cn(
    "flex-1 resize-none border-0 focus:ring-0 text-sm",
    editingContext && "bg-blue-50"
  )}
/>
```

### 6.2 EditingContext Placement

```typescript
{/* Compose Bar */}
{activeThread && (
  <div className="border-t">
    {/* Editing Context Bar */}
    {editingContext && (
      <EditingContext
        type={editingContext.type}
        section={editingContext.section}
        position={editingContext.position}
        onCancel={() => setEditingContext(null)}
        onSuggestionClick={(suggestion) => setInputValue(suggestion)}
      />
    )}

    {/* Regular Input */}
    <div className="px-6 py-4">
      {/* ... existing compose bar UI ... */}
    </div>
  </div>
)}
```

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Add state variables to page.tsx
- [ ] Create Section interface
- [ ] Implement loadSections()
- [ ] Add useEffect to load sections on report change

### Phase 2: ReportDisplay ✅
- [ ] Add new props to interface
- [ ] Implement conditional rendering (sections vs HTML)
- [ ] Map sections to InteractiveSection components
- [ ] Pass all handlers

### Phase 3: InteractiveSection ✅
- [ ] Create new component file
- [ ] Implement visual states (selected, editing, streaming)
- [ ] Add floating toolbar
- [ ] Add streaming shimmer overlay
- [ ] Add edit badge
- [ ] Add collapse functionality

### Phase 4: EditingContext ✅
- [ ] Create new component file
- [ ] Implement suggestion fetching
- [ ] Add suggestion pills
- [ ] Add cancel button
- [ ] Style with blue theme

### Phase 5: Editing Logic ✅
- [ ] Modify sendMessage() with editing check
- [ ] Implement handleSectionEdit() with streaming
- [ ] Implement handleSectionAdd() with streaming
- [ ] Implement handleSectionDelete()
- [ ] Implement handleSectionDuplicate()
- [ ] Implement handleSectionMove()

### Phase 6: Polish ✅
- [ ] Add dynamic input placeholder
- [ ] Add EditingContext to compose bar
- [ ] Add CSS animations
- [ ] Test all operations
- [ ] Handle edge cases

---

## Testing Plan

### 1. Basic Section Display
- [ ] Load report with sections
- [ ] Verify all sections render
- [ ] Test section selection
- [ ] Test collapse/expand

### 2. Editing Flow
- [ ] Click Edit on section
- [ ] Verify EditingContext appears
- [ ] Verify AI suggestions load
- [ ] Click suggestion → populates input
- [ ] Submit edit → streams preview
- [ ] Verify section updates

### 3. Adding Sections
- [ ] Click Add Section (to be added)
- [ ] Verify EditingContext with position
- [ ] Submit prompt → streams new section
- [ ] Verify section appears at correct position

### 4. Section Operations
- [ ] Test delete with confirmation
- [ ] Test duplicate
- [ ] Test move up/down
- [ ] Test toolbar button states (disabled when first/last)

### 5. Edge Cases
- [ ] Edit while another section streaming
- [ ] Cancel edit mode
- [ ] Network errors
- [ ] Empty sections
- [ ] Very long sections

---

## Success Criteria

✅ **Core Functionality**:
- Section-wise editing works without creating chat messages
- AI suggestions are contextual to each section
- Real-time streaming preview during edits
- All section operations (edit, add, delete, duplicate, move) work

✅ **UX**:
- Smooth transitions and animations
- Clear visual feedback (selected, editing, streaming states)
- Intuitive toolbar placement
- Helpful AI suggestions

✅ **Performance**:
- No lag during streaming
- Smooth scrolling with many sections
- Quick section operations

✅ **Polish**:
- Matches V2 UI design system
- Consistent spacing and typography
- Professional animations
- Error handling with toast notifications

---

## Next Steps After Implementation

1. **Add Section Button**: Implement floating "+" button between sections
2. **Version History**: Add modal to view/restore previous versions
3. **Keyboard Shortcuts**: Add Cmd+E for edit, Escape to cancel
4. **Drag & Drop**: Allow reordering by dragging sections
5. **Undo/Redo**: Implement operation history
6. **Section Templates**: Quick add common section types

---

## Estimated Timeline

| Phase | Time | Status |
|-------|------|--------|
| Phase 1: Foundation | 1h | ⏳ Pending |
| Phase 2: ReportDisplay | 1.5h | ⏳ Pending |
| Phase 3: InteractiveSection | 1.5h | ⏳ Pending |
| Phase 4: EditingContext | 1h | ⏳ Pending |
| Phase 5: Editing Logic | 1h | ⏳ Pending |
| Phase 6: Polish | 0.5h | ⏳ Pending |
| **Total** | **6.5 hours** | ⏳ Pending |

---

## Ready to Begin!

All APIs already exist from V1. We're primarily doing UI work and state management integration. Let's start with Phase 1!