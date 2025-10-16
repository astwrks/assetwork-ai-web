# Component Refactoring Example

## Breaking Down financial-playground-v2/page.tsx

The current file is 2,187 lines. Here's how to split it into manageable components:

## 🎯 Target Structure

```
app/financial-playground-v2/
├── page.tsx (150 lines - just the main layout)
├── components/
│   ├── PlaygroundHeader.tsx
│   ├── ThreadSidebar/
│   │   ├── index.tsx
│   │   ├── ThreadList.tsx
│   │   └── ThreadItem.tsx
│   ├── MessageArea/
│   │   ├── index.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   └── EmptyState.tsx
│   ├── ComposeBar/
│   │   ├── index.tsx
│   │   ├── InputArea.tsx
│   │   └── ToolButtons.tsx
│   ├── ReportPanel/
│   │   ├── index.tsx
│   │   ├── ReportViewer.tsx
│   │   └── SectionEditor.tsx
│   └── Modals/
│       ├── TemplateModal.tsx
│       ├── ShareModal.tsx
│       └── CalculatorModal.tsx
├── hooks/
│   ├── useThreads.ts
│   ├── useMessages.ts
│   ├── useReportGeneration.ts
│   └── useKeyboardShortcuts.ts
├── utils/
│   └── threadHelpers.ts
└── types/
    └── playground.types.ts
```

## 📝 Step-by-Step Refactoring

### Step 1: Extract Types (playground.types.ts)
```typescript
// app/financial-playground-v2/types/playground.types.ts

export interface Thread {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  currentReportId?: string;
  reportVersions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reportId?: string;
  metadata?: MessageMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  duration?: number;
}

export interface Section {
  _id: string;
  reportId: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'insight' | 'custom';
  title: string;
  htmlContent: string;
  order: number;
  version: number;
}

export interface EditingContext {
  type: 'edit' | 'add';
  sectionId?: string;
  section?: Section;
  position?: number;
}
```

### Step 2: Extract Custom Hooks (useThreads.ts)
```typescript
// app/financial-playground-v2/hooks/useThreads.ts

import useSWR from 'swr';
import { Thread } from '../types/playground.types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useThreads(userId?: string) {
  const { data, error, mutate } = useSWR(
    userId ? '/api/playground/threads?status=active' : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  const threads = (data?.threads || []).map((thread: any) => ({
    ...thread,
    _id: thread.id || thread._id
  }));

  const createThread = async (title: string) => {
    const response = await fetch('/api/playground/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: 'Financial analysis thread' }),
    });

    if (!response.ok) throw new Error('Failed to create thread');

    const data = await response.json();
    mutate(); // Refresh the list
    return data.thread;
  };

  const deleteThread = async (threadId: string) => {
    const response = await fetch(`/api/playground/threads/${threadId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete thread');
    mutate(); // Refresh the list
  };

  return {
    threads,
    isLoading: !error && !data,
    isError: error,
    createThread,
    deleteThread,
    mutate,
  };
}
```

### Step 3: Extract ThreadSidebar Component
```typescript
// app/financial-playground-v2/components/ThreadSidebar/index.tsx

import { Thread } from '../../types/playground.types';
import ThreadList from './ThreadList';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface ThreadSidebarProps {
  threads: Thread[];
  activeThread: Thread | null;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onThreadSelect: (thread: Thread) => void;
  onThreadCreate: () => void;
  onThreadDelete: (threadId: string) => void;
  onThreadRename: (threadId: string, newTitle: string) => void;
}

export default function ThreadSidebar({
  threads,
  activeThread,
  collapsed,
  onCollapse,
  onThreadSelect,
  onThreadCreate,
  onThreadDelete,
  onThreadRename,
}: ThreadSidebarProps) {
  if (collapsed) return null;

  return (
    <aside className="w-[260px] bg-[#001A3D] text-white flex flex-col border-r border-[#0066FF]/20">
      {/* Header */}
      <div className="h-[50px] px-4 flex items-center justify-between border-b border-[#0066FF]/20">
        <span className="font-semibold">Financial Reports</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onThreadCreate}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onCollapse(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* New Report Button */}
      <div className="px-3 py-2">
        <Button
          className="w-full justify-start bg-[#0066FF]"
          size="sm"
          onClick={onThreadCreate}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Thread List */}
      <ThreadList
        threads={threads}
        activeThread={activeThread}
        onSelect={onThreadSelect}
        onDelete={onThreadDelete}
        onRename={onThreadRename}
      />
    </aside>
  );
}
```

### Step 4: Extract MessageArea Component
```typescript
// app/financial-playground-v2/components/MessageArea/index.tsx

import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from './MessageList';
import EmptyState from './EmptyState';
import { Message, Thread } from '../../types/playground.types';

interface MessageAreaProps {
  thread: Thread | null;
  messages: Message[];
  isLoading: boolean;
  currentUser: any;
}

export default function MessageArea({
  thread,
  messages,
  isLoading,
  currentUser,
}: MessageAreaProps) {
  if (!thread) {
    return <EmptyState type="no-thread" />;
  }

  if (messages.length === 0 && !isLoading) {
    return <EmptyState type="no-messages" />;
  }

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      <MessageList
        messages={messages}
        currentUser={currentUser}
      />
    </ScrollArea>
  );
}
```

### Step 5: Main Page Component (Simplified)
```typescript
// app/financial-playground-v2/page.tsx

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import PlaygroundHeader from './components/PlaygroundHeader';
import ThreadSidebar from './components/ThreadSidebar';
import MessageArea from './components/MessageArea';
import ComposeBar from './components/ComposeBar';
import ReportPanel from './components/ReportPanel';
import { useThreads } from './hooks/useThreads';
import { useMessages } from './hooks/useMessages';
import { useReportGeneration } from './hooks/useReportGeneration';
import { Thread } from './types/playground.types';

export default function FinancialPlaygroundV2() {
  const { data: session, status } = useSession();
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Use custom hooks
  const { threads, createThread, deleteThread } = useThreads(session?.user?.id);
  const { messages, sendMessage } = useMessages(activeThread?._id);
  const { generateReport, isGenerating } = useReportGeneration();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <PlaygroundHeader
          user={session?.user}
          onSearch={(query) => console.log('Search:', query)}
        />

        <div className="flex-1 flex overflow-hidden">
          <ThreadSidebar
            threads={threads}
            activeThread={activeThread}
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            onThreadSelect={setActiveThread}
            onThreadCreate={createThread}
            onThreadDelete={deleteThread}
          />

          <main className="flex-1 flex flex-col">
            <MessageArea
              thread={activeThread}
              messages={messages}
              isLoading={false}
              currentUser={session?.user}
            />

            {activeThread && (
              <ComposeBar
                onSendMessage={sendMessage}
                isGenerating={isGenerating}
              />
            )}
          </main>

          {rightPanelOpen && (
            <ReportPanel
              thread={activeThread}
              messages={messages}
              onClose={() => setRightPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
```

## 🎨 Benefits of This Refactoring

### 1. **Maintainability**
- Each component has a single responsibility
- Easier to find and fix bugs
- Clear data flow

### 2. **Reusability**
- Components can be used elsewhere
- Shared hooks for common logic
- Type safety throughout

### 3. **Performance**
- Smaller bundle sizes with code splitting
- Better React rendering optimization
- Memoization opportunities

### 4. **Testing**
- Each component can be tested in isolation
- Hooks can be tested separately
- Better test coverage

### 5. **Developer Experience**
- Faster hot reload
- Easier onboarding
- Better code navigation

## 🛠️ Implementation Steps

1. **Create the directory structure** first
2. **Extract types** to a central location
3. **Move custom hooks** out of components
4. **Split components** starting with the smallest ones
5. **Test each component** as you extract it
6. **Update imports** throughout the app
7. **Remove the old mega-component**

## 📊 Measuring Success

**Before:**
- 1 file, 2,187 lines
- 15+ useState hooks in one component
- 20+ functions in one file
- Slow hot reload
- Hard to test

**After:**
- 15+ files, max 300 lines each
- 3-5 useState per component
- Single responsibility functions
- Fast hot reload
- 80% test coverage possible

## 🔄 Continuous Refactoring

This is just the beginning. Continue to:
1. Extract more custom hooks
2. Create compound components
3. Add proper error boundaries
4. Implement lazy loading
5. Add Storybook for component development

Remember: **Refactor incrementally, test frequently, commit often!**