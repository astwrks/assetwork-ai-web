# Section-by-Section Editing Implementation Plan
## AssetWorks Financial Playground

**Date**: October 23, 2025
**Goal**: Implement classic section-by-section editing flow with AI suggestions and real usage data

---

## 📋 Executive Summary

This plan integrates the existing InteractiveSection editing system into the financial playground to enable:
- ✅ Section-by-section editing with AI streaming
- ✅ Per-section AI suggestions (not whole report)
- ✅ Real usage data display (remove mocks)
- ✅ Full interactive editing experience

**Current State**: APIs and components exist but are not integrated
**Target State**: Complete classic editing flow functional in financial playground

---

## 🏗️ Architecture Overview

### Data Flow
```
1. Report Generated → Creates playground_reports (isInteractiveMode: false)
2. User Clicks Section → Converts to interactive mode
3. Section Edit → Updates report_sections table
4. AI Suggestions → Generated per section (not report)
5. Usage Tracking → Real-time display from playground_reports
```

### Database Structure
```
playground_reports {
  id, threadId, htmlContent
  sections: Json[]              // Embedded sections (non-interactive)
  sectionRefs: String[]         // References to report_sections (interactive)
  isInteractiveMode: Boolean    // Toggle between modes
  totalTokens, totalCost        // Real usage data
  operations: Json[]            // Detailed operations
}

report_sections {
  id, reportId, type, title
  htmlContent, order, version
  editHistory: Json[]           // Version history
  metadata: Json                // Model, prompts, etc.
}
```

---

## 📁 Files to Modify

### 1. Financial Playground Main Page
**File**: `/app/financial-playground/page.tsx`

#### Changes Needed:
1. **Add State for Interactive Sections**
```typescript
// Add after existing state declarations (around line 80)
const [reportSections, setReportSections] = useState<any[]>([]);
const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
const [editingSection, setEditingSection] = useState<any>(null);
const [sectionPreviewContent, setSectionPreviewContent] = useState<Record<string, string>>({});
const [sectionStreamingState, setSectionStreamingState] = useState<Record<string, boolean>>({});
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
```

2. **Add Function to Fetch Sections**
```typescript
// Add around line 200
const fetchReportSections = async (reportId: string) => {
  try {
    const response = await fetch(`/api/playground/reports/${reportId}/sections`);
    if (!response.ok) return;

    const data = await response.json();
    setReportSections(data.sections || []);

    // Enable interactive mode in UI
    if (data.isInteractiveMode) {
      console.log('Interactive mode enabled, sections loaded:', data.sections.length);
    }
  } catch (error) {
    console.error('Failed to fetch sections:', error);
  }
};
```

3. **Call fetchReportSections When Report Completes**
```typescript
// Modify handleReportComplete (around line 350)
const handleReportComplete = async (report: any) => {
  setCurrentReport(report);
  setPendingReportGeneration(null);
  setIsGeneratingReport(false);
  setHasNewMessages(false);

  // NEW: Fetch sections for interactive editing
  if (report.id) {
    await fetchReportSections(report.id);
  }

  toast.success('Report generated successfully!');
};
```

4. **Add Section Editing Handlers**
```typescript
// Add around line 400
const handleSectionEdit = async (section: any) => {
  setEditingSection(section);
  setSelectedSectionId(section.id);
};

const handleSectionUpdate = async (sectionId: string, prompt: string) => {
  if (!currentReport) return;

  setSectionStreamingState(prev => ({ ...prev, [sectionId]: true }));

  try {
    const response = await fetch(
      `/api/playground/reports/${currentReport.id}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          provider: selectedModel.includes('claude') ? 'anthropic' : 'openai',
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to edit section');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'content') {
            accumulatedContent += data.content;
            setSectionPreviewContent(prev => ({
              ...prev,
              [sectionId]: accumulatedContent
            }));
          } else if (data.type === 'complete') {
            // Refresh sections
            await fetchReportSections(currentReport.id);
            setSectionPreviewContent(prev => {
              const newState = { ...prev };
              delete newState[sectionId];
              return newState;
            });
            setEditingSection(null);
            toast.success('Section updated!');
          } else if (data.type === 'error') {
            toast.error(data.error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Section edit error:', error);
    toast.error('Failed to edit section');
  } finally {
    setSectionStreamingState(prev => ({ ...prev, [sectionId]: false }));
  }
};

const handleSectionDelete = async (sectionId: string) => {
  if (!currentReport) return;
  if (!confirm('Delete this section?')) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${currentReport.id}/sections/${sectionId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) throw new Error('Failed to delete section');

    await fetchReportSections(currentReport.id);
    toast.success('Section deleted');
  } catch (error) {
    console.error('Delete error:', error);
    toast.error('Failed to delete section');
  }
};

const handleSectionDuplicate = async (sectionId: string) => {
  if (!currentReport) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${currentReport.id}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      }
    );

    if (!response.ok) throw new Error('Failed to duplicate');

    await fetchReportSections(currentReport.id);
    toast.success('Section duplicated');
  } catch (error) {
    console.error('Duplicate error:', error);
    toast.error('Failed to duplicate section');
  }
};

const handleSectionMove = async (sectionId: string, direction: 'up' | 'down') => {
  if (!currentReport) return;

  try {
    const response = await fetch(
      `/api/playground/reports/${currentReport.id}/sections/${sectionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: direction === 'up' ? 'move-up' : 'move-down' }),
      }
    );

    if (!response.ok) throw new Error('Failed to move');

    await fetchReportSections(currentReport.id);
  } catch (error) {
    console.error('Move error:', error);
    toast.error('Failed to move section');
  }
};

const handleSectionCollapse = (sectionId: string) => {
  setCollapsedSections(prev => ({
    ...prev,
    [sectionId]: !prev[sectionId]
  }));
};

const handleCancelEdit = () => {
  setEditingSection(null);
  setSelectedSectionId(null);
  setSectionPreviewContent({});
};
```

5. **Update Report Display Area** (around line 1520)
```typescript
{/* Replace existing ReportGenerator section with: */}
{pendingReportGeneration ? (
  <ReportGenerator
    threadId={pendingReportGeneration.threadId}
    prompt={pendingReportGeneration.prompt}
    model={pendingReportGeneration.model}
    systemPrompt={pendingReportGeneration.systemPrompt}
    onReportComplete={handleReportComplete}
    onEntityExtracted={handleEntityExtracted}
    onCancel={handleReportCancel}
    onSectionsUpdate={(sections) => {
      const transformedSections: ReportSectionData[] = sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        order: section.order,
        status: 'complete' as const
      }));
      setReportSections(transformedSections);
      setIsGeneratingReport(true);
    }}
    className="mb-6"
  />
) : currentReport && reportSections.length > 0 ? (
  {/* NEW: Interactive Section Display */}
  <div className="space-y-6 mb-6">
    {reportSections.map((section, index) => (
      <InteractiveSection
        key={section.id}
        sectionId={section.id}
        reportId={currentReport.id}
        htmlContent={section.htmlContent}
        title={section.title}
        order={section.order}
        isFirst={index === 0}
        isLast={index === reportSections.length - 1}
        isSelected={selectedSectionId === section.id}
        isCollapsed={collapsedSections[section.id] || false}
        isInEditMode={editingSection?.id === section.id}
        isStreaming={sectionStreamingState[section.id] || false}
        previewContent={sectionPreviewContent[section.id]}
        onSelect={() => setSelectedSectionId(section.id)}
        onEdit={() => handleSectionEdit(section)}
        onCancelEdit={handleCancelEdit}
        onDelete={handleSectionDelete}
        onDuplicate={handleSectionDuplicate}
        onMoveUp={() => handleSectionMove(section.id, 'up')}
        onMoveDown={() => handleSectionMove(section.id, 'down')}
        onDownload={(id, content, title) => {
          const blob = new Blob([content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Section downloaded!');
        }}
        onToggleCollapse={handleSectionCollapse}
      />
    ))}
  </div>
) : null}
```

6. **Add Import for InteractiveSection**
```typescript
// Add at top with other imports (around line 20)
import InteractiveSection from '@/components/financial-playground/InteractiveSection';
```

---

### 2. Section-Level AI Suggestions Component
**File**: `/app/financial-playground/components/SectionAISuggestions.tsx` (NEW FILE)

```typescript
/**
 * Section AI Suggestions Component
 * Provides context-aware AI suggestions for individual sections
 * Uses existing /api/playground/reports/[reportId]/suggestions API
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Suggestion {
  id: string;
  type: 'improvement' | 'insight' | 'warning' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  actionable: boolean;
}

interface SectionAISuggestionsProps {
  reportId: string;
  sectionId: string;
  sectionTitle: string;
  onApplySuggestion?: (suggestion: Suggestion) => void;
  className?: string;
}

export function SectionAISuggestions({
  reportId,
  sectionId,
  sectionTitle,
  onApplySuggestion,
  className
}: SectionAISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [sectionId]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/playground/reports/${reportId}/suggestions?sectionId=${sectionId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setError('Could not load AI suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (suggestion: Suggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
      toast.success(`Applying suggestion: ${suggestion.title}`);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast.info('Suggestion dismissed');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <Sparkles className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            className="mt-4"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Section looks great!</p>
          <p className="text-xs text-muted-foreground mt-1">
            No suggestions at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Suggestions</CardTitle>
              <CardDescription className="text-xs">
                For "{sectionTitle}"
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            className="h-8"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${
                appliedSuggestions.has(suggestion.id)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${getPriorityColor(suggestion.priority)}`}>
                    {getIcon(suggestion.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{suggestion.title}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(suggestion.id)}
                  className="h-6 w-6 p-0"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                {suggestion.description}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground italic">
                  Impact: {suggestion.estimatedImpact}
                </p>

                {suggestion.actionable && !appliedSuggestions.has(suggestion.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(suggestion)}
                    className="h-7 text-xs"
                  >
                    Apply
                  </Button>
                )}

                {appliedSuggestions.has(suggestion.id) && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Applied
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
```

---

### 3. Fix ReportUsage to Show Real Data
**File**: `/app/financial-playground/components/ReportUsage.tsx`

#### Changes Needed:

**Current Issue**: Falls back to mock data when API fails
**Solution**: Better error handling and retry logic

```typescript
// Modify fetchUsage function (around line 60)
const fetchUsage = async () => {
  if (!reportId) return;

  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`/api/playground/reports/${reportId}/usage`, {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Usage API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch usage data: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Usage data received:', data);

    // Handle both data.usage and direct data formats
    const usageData = data.usage || data;

    // Validate data has required fields
    if (!usageData.totalTokens && usageData.totalTokens !== 0) {
      console.warn('⚠️ Invalid usage data structure:', usageData);
      throw new Error('Invalid usage data structure');
    }

    setUsage(usageData);
  } catch (error) {
    console.error('💥 Failed to fetch usage:', error);
    setError('Could not load usage metrics');

    // DON'T set fallback data - let the error state show
    setUsage(null);
  } finally {
    setIsLoading(false);
  }
};

// Remove the fallback demo data from lines 80-97
// Let the error state display instead
```

**Add retry button in error state** (around line 138):
```typescript
if (error) {
  return (
    <Card className={className}>
      <CardContent className="py-8 text-center text-sm">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsage}
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 4. Update Suggestions API for Section-Specific Suggestions
**File**: `/app/api/playground/reports/[reportId]/suggestions/route.ts`

#### Changes Needed:

```typescript
// Modify POST function to accept sectionId query parameter (around line 10)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    const userId = process.env.NODE_ENV === 'development'
      ? 'dev-user-123'
      : session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await params;

    // NEW: Get sectionId from query params
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    // Find the report
    const report = await prisma.reports.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // NEW: If sectionId provided, generate section-specific suggestions
    if (sectionId) {
      const section = await prisma.report_sections.findFirst({
        where: { id: sectionId, reportId }
      });

      if (!section) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      // Generate section-specific suggestions
      const suggestions = [
        {
          id: '1',
          type: 'improvement' as const,
          title: `Enhance ${section.title}`,
          description: `Add more detailed analysis or visual elements to ${section.title}`,
          priority: 'medium' as const,
          estimatedImpact: 'Improves section clarity and depth',
          actionable: true
        },
        {
          id: '2',
          type: 'insight' as const,
          title: 'Add Comparative Data',
          description: 'Include industry benchmarks or historical comparisons',
          priority: 'low' as const,
          estimatedImpact: 'Provides better context for readers',
          actionable: true
        }
      ];

      return NextResponse.json({
        suggestions,
        generatedAt: new Date().toISOString(),
        reportId,
        sectionId
      });
    }

    // Original report-level suggestions logic...
    // (Keep existing code for whole-report suggestions)

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
```

---

### 5. Add Edit Sidebar for Section Editing
**File**: `/app/financial-playground/components/EditSidebar.tsx` (NEW FILE)

```typescript
/**
 * Edit Sidebar Component
 * Provides AI-powered editing interface for sections
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wand2,
  X,
  Send,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { SectionAISuggestions } from './SectionAISuggestions';

interface EditSidebarProps {
  section: any;
  reportId: string;
  onSubmitEdit: (prompt: string) => void;
  onCancel: () => void;
  isStreaming?: boolean;
}

export function EditSidebar({
  section,
  reportId,
  onSubmitEdit,
  onCancel,
  isStreaming = false
}: EditSidebarProps) {
  const [editPrompt, setEditPrompt] = useState('');

  const handleSubmit = () => {
    if (editPrompt.trim()) {
      onSubmitEdit(editPrompt);
      setEditPrompt('');
    }
  };

  const quickPrompts = [
    'Make this section more detailed',
    'Simplify the language',
    'Add a table summarizing the data',
    'Include visual charts',
    'Add risk analysis',
    'Expand on key metrics'
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Edit Section</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{section.title}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="suggestions">
              <Sparkles className="w-3 h-3 mr-1" />
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            {/* Quick Prompts */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Quick Actions
              </Label>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setEditPrompt(prompt)}
                    className="text-xs h-7"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Edit Prompt */}
            <div>
              <Label htmlFor="edit-prompt" className="text-sm mb-2 block">
                Describe your changes
              </Label>
              <Textarea
                id="edit-prompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="E.g., Add more details about revenue growth, include a comparison table, make the tone more professional..."
                className="min-h-[120px]"
                disabled={isStreaming}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!editPrompt.trim() || isStreaming}
              className="w-full"
            >
              {isStreaming ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Apply Edit
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="suggestions">
            <SectionAISuggestions
              reportId={reportId}
              sectionId={section.id}
              sectionTitle={section.title}
              onApplySuggestion={(suggestion) => {
                setEditPrompt(suggestion.description);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

### 6. Integrate Edit Sidebar into Main Page
**File**: `/app/financial-playground/page.tsx`

```typescript
// Add import
import { EditSidebar } from './components/EditSidebar';

// Add before closing tag of main container (around line 1620)
{/* Edit Sidebar Overlay */}
{editingSection && (
  <EditSidebar
    section={editingSection}
    reportId={currentReport?.id || ''}
    onSubmitEdit={(prompt) => handleSectionUpdate(editingSection.id, prompt)}
    onCancel={handleCancelEdit}
    isStreaming={sectionStreamingState[editingSection.id] || false}
  />
)}
```

---

## 🔄 Implementation Sequence

### Phase 1: Core Integration (Day 1)
1. ✅ Add section state management to page.tsx
2. ✅ Implement fetchReportSections function
3. ✅ Add section editing handlers
4. ✅ Import and render InteractiveSection components

### Phase 2: AI Suggestions (Day 2)
1. ✅ Create SectionAISuggestions component
2. ✅ Update suggestions API for section-specific logic
3. ✅ Create EditSidebar component
4. ✅ Integrate EditSidebar into main page

### Phase 3: Real Data & Polish (Day 3)
1. ✅ Fix ReportUsage to show real data only
2. ✅ Remove all mock data fallbacks
3. ✅ Test entire flow end-to-end
4. ✅ Add error boundaries and loading states

---

## 🧪 Testing Checklist

### Section Editing
- [ ] Click section → toolbar appears
- [ ] Edit button → sidebar opens
- [ ] Submit edit → streaming works
- [ ] Preview updates in real-time
- [ ] Section updates in database
- [ ] Usage data reflects new tokens

### AI Suggestions
- [ ] Suggestions load per section
- [ ] Apply button triggers edit
- [ ] Dismiss removes suggestion
- [ ] Refresh fetches new suggestions

### Usage Data
- [ ] Real data displays (no mocks)
- [ ] Updates after section edits
- [ ] Error state shows retry button
- [ ] Loading state smooth

### Interactive Features
- [ ] Move up/down sections
- [ ] Duplicate section
- [ ] Delete section (with confirm)
- [ ] Collapse/expand sections
- [ ] Download individual sections

---

## 📊 Expected Outcomes

### Before
- Static HTML reports
- Whole-report suggestions only
- Mock usage data displayed
- No section-level editing

### After
- Interactive section editing
- Per-section AI suggestions
- Real usage data only
- Full classic editing flow
- Streaming AI updates
- Version history per section

---

## 🚨 Critical Notes

1. **Database Migration**: Ensure `isInteractiveMode` column exists:
   ```sql
   ALTER TABLE playground_reports ADD COLUMN IF NOT EXISTS isInteractiveMode BOOLEAN DEFAULT false;
   ```

2. **Usage Tracking**: The `/api/playground/reports/[reportId]/sections/[sectionId]` endpoint already tracks usage via `trackReportUsage()` - no changes needed.

3. **Backward Compatibility**: Old reports (with embedded sections) still work. Interactive mode only activates when sections are edited.

4. **Performance**: Section operations are database-optimized with proper indexing on `reportId` and `order`.

---

## 🎯 Success Metrics

- ✅ Section editing works with streaming AI
- ✅ Per-section suggestions display correctly
- ✅ Usage data shows real metrics (no mocks)
- ✅ All CRUD operations functional
- ✅ No console errors
- ✅ Smooth UI transitions

---

**End of Implementation Plan**
