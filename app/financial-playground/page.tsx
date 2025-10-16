'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import './playground.css';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import AISummaryDashboard from '@/components/dashboard/AISummaryDashboard';
import {
  MessageSquare,
  FileText,
  Plus,
  Send,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Settings,
  Sparkles,
  Edit,
  X,
  Trash2,
  Search,
  MoreVertical,
  Check,
  StopCircle,
  Zap,
  Link2,
  Globe,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import InteractiveSection from '@/components/financial-playground/InteractiveSection';
import EditingContext from '@/components/financial-playground/EditingContext';
import AddSectionButton from '@/components/financial-playground/AddSectionButton';
import ReportMetricsTicker from '@/components/financial-playground/ReportMetricsTicker';
import ShareDialog from '@/components/financial-playground/ShareDialog';
import ContextProgressBar from '@/components/financial-playground/ContextProgressBar';
import ContextDetailsModal from '@/components/financial-playground/ContextDetailsModal';
import { EntityChips } from '@/components/entities/EntityChips';
import ChartRenderer from '@/components/financial-playground/ChartRenderer';
import MessageActions from '@/components/financial-playground/MessageActions';

interface Thread {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
  firstMessage?: {
    id: string;
    content: string;
    role: string;
    createdAt: string;
  } | null;
  messageCount?: number;
  reportCount?: number;
  isEmpty?: boolean;
}

interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
  reportId?: string;
}

interface Report {
  _id: string;
  htmlContent: string;
  isInteractiveMode?: boolean;
  sectionRefs?: string[];
  insights: Array<{
    id: string;
    text: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
  }>;
  sections: any[];
}

interface Section {
  _id: string;
  reportId: string;
  type: string;
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
  metadata: {
    originallyGeneratedBy: string;
    lastModifiedBy: string;
    model?: string;
    originalPrompt?: string;
  };
}

export default function FinancialPlaygroundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track initial page load
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Restore sidebar state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playground_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingUsage, setStreamingUsage] = useState<{inputTokens: number; outputTokens: number} | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextModalEntity, setContextModalEntity] = useState<{type: 'thread' | 'report'; id: string; tokens: number} | null>(null);

  // Interactive sections state
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<{
    type: 'edit' | 'add';
    sectionId?: string;
    section?: Section;
    position?: number;
  } | null>(null);
  const [sectionPreviewContent, setSectionPreviewContent] = useState<Record<string, string>>({});
  const [sectionStreamingState, setSectionStreamingState] = useState<Record<string, boolean>>({});

  // Thread management state
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingThreadTitle, setEditingThreadTitle] = useState('');
  const [showEmptyThreadDialog, setShowEmptyThreadDialog] = useState(false);
  const [emptyThread, setEmptyThread] = useState<Thread | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Restore collapsed sections state from localStorage
    if (typeof window !== 'undefined' && session?.user?.email) {
      const saved = localStorage.getItem(`playground_collapsed_sections_${session.user.email}`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // System Prompts state
  const [systemPrompts, setSystemPrompts] = useState<Array<{
    id: string;
    name: string;
    description: string;
  }>>([]);
  const [activeSystemPromptId, setActiveSystemPromptId] = useState<string>('web-report');
  const [showDashboard, setShowDashboard] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportEndRef = useRef<HTMLDivElement>(null);
  const justCreatedThreadRef = useRef<string | null>(null);
  const lastLoadedThreadRef = useRef<string | null>(null); // Track last loaded thread to prevent infinite loop
  const isCreatingThreadRef = useRef<boolean>(false); // Prevent simultaneous thread creation
  const isLoadingThreadRef = useRef<boolean>(false); // Prevent simultaneous thread loading
  const hasInitializedRef = useRef<boolean>(false); // Track if initial setup is complete

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load threads on mount and clean up localStorage
  useEffect(() => {
    if (session) {
      // Clean up any invalid localStorage values
      if (session.user?.email) {
        const lastThread = localStorage.getItem(`playground_last_thread_${session.user.email}`);
        if (lastThread === 'undefined' || lastThread === 'null' || !lastThread) {
          console.log('Cleaning up invalid localStorage thread value');
          localStorage.removeItem(`playground_last_thread_${session.user.email}`);
        }
      }

      loadThreads();
    }
  }, [session]);

  // Check if user should see dashboard (returning user with threads)
  useEffect(() => {
    if (!session || threads === undefined || hasInitializedRef.current) return;

    const threadIdFromUrl = searchParams.get('thread');
    const hasValidThreadParam = threadIdFromUrl && threadIdFromUrl !== 'undefined' && threadIdFromUrl !== 'null';

    console.log('🔍 Dashboard check:', {
      threadsCount: threads.length,
      threadIdFromUrl,
      hasValidThreadParam,
      hasCurrentThread: !!currentThread,
      justCreatedThreadRef: justCreatedThreadRef.current,
      isCreating: isCreatingThreadRef.current,
      hasInitialized: hasInitializedRef.current
    });

    // If user has threads and no valid thread in URL, show dashboard
    // BUT don't show dashboard if we just created a new thread
    if (threads.length > 0 && !hasValidThreadParam && !currentThread && !justCreatedThreadRef.current) {
      console.log('✅ Returning user detected - showing dashboard');
      setShowDashboard(true);
      hasInitializedRef.current = true; // Mark as initialized
      // Clear any invalid thread params from URL
      if (threadIdFromUrl) {
        console.log('🧹 Cleaning invalid thread param from URL');
        router.replace('/financial-playground', { scroll: false });
      }
    } else if (
      threads.length === 0 &&
      !currentThread &&
      !justCreatedThreadRef.current &&
      !isCreatingThreadRef.current
    ) {
      // New user with no threads - auto-create first thread (only if not already creating)
      console.log('🆕 No threads found - auto-creating first thread');
      hasInitializedRef.current = true; // Mark as initialized
      createNewThread();
    } else if (hasValidThreadParam && !isLoadingThreadRef.current) {
      // If we have a valid thread param and we're not already loading, mark as initialized
      // This prevents re-running this effect when the thread loads
      hasInitializedRef.current = true;
    }
  }, [threads, session, currentThread, searchParams]);

  // Handle URL thread parameter
  useEffect(() => {
    if (!session) return;

    const threadIdFromUrl = searchParams.get('thread');

    // Check if thread param is valid
    const hasValidThreadParam = threadIdFromUrl && threadIdFromUrl !== 'undefined' && threadIdFromUrl !== 'null';

    // Skip if we just created this thread - check ref first before any state
    if (hasValidThreadParam && justCreatedThreadRef.current === threadIdFromUrl) {
      return; // Don't clear the ref yet - keep it to prevent subsequent calls
    }

    // Skip if this thread is already loaded (compare with ref to avoid triggering re-renders)
    if (hasValidThreadParam && lastLoadedThreadRef.current === threadIdFromUrl) {
      return;
    }

    if (hasValidThreadParam) {
      // Hide dashboard and try to load the thread directly
      setShowDashboard(false);
      lastLoadedThreadRef.current = threadIdFromUrl;
      loadThread(threadIdFromUrl);
    }
  }, [searchParams, session]);

  // Clear justCreatedThreadRef once the thread is successfully loaded
  useEffect(() => {
    const threadIdFromUrl = searchParams.get('thread');
    if (
      currentThread &&
      threadIdFromUrl &&
      currentThread._id === threadIdFromUrl &&
      justCreatedThreadRef.current === threadIdFromUrl
    ) {
      // Thread is loaded and matches what we just created - clear the ref
      justCreatedThreadRef.current = null;
    }
  }, [currentThread, searchParams]);

  // Persist sidebar state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('playground_sidebar_open', JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen]);

  // Persist collapsed sections state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.email) {
      localStorage.setItem(
        `playground_collapsed_sections_${session.user.email}`,
        JSON.stringify(collapsedSections)
      );
    }
  }, [collapsedSections, session]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Track editingContext state changes for debugging
  useEffect(() => {
    console.log('🔄 editingContext changed:', {
      hasContext: !!editingContext,
      type: editingContext?.type,
      sectionId: editingContext?.sectionId,
      timestamp: new Date().toISOString()
    });
  }, [editingContext]);

  // Load playground settings and system prompts
  useEffect(() => {
    if (session) {
      loadPlaygroundSettings();
    }
  }, [session]);

  // Load playground settings
  const loadPlaygroundSettings = async () => {
    try {
      const response = await fetch('/api/playground/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.systemPrompts) {
          setSystemPrompts(data.settings.systemPrompts);
          setActiveSystemPromptId(data.settings.activeSystemPromptId || 'web-report');
        }
      }
    } catch (error) {
      console.error('Error loading playground settings:', error);
    }
  };

  // Switch system prompt
  const switchSystemPrompt = async (promptId: string) => {
    try {
      const response = await fetch('/api/playground/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSystemPromptId: promptId }),
      });

      if (response.ok) {
        setActiveSystemPromptId(promptId);
        toast.success(`Switched to ${systemPrompts.find(p => p.id === promptId)?.name || 'new prompt'}`);
      } else {
        toast.error('Failed to switch system prompt');
      }
    } catch (error) {
      console.error('Error switching system prompt:', error);
      toast.error('Failed to switch system prompt');
    }
  };

  // Load all threads
  const loadThreads = async () => {
    try {
      const response = await fetch('/api/playground/threads');
      if (response.ok) {
        const data = await response.json();
        // Normalize thread IDs (support both Prisma 'id' and MongoDB '_id')
        const normalizedThreads = data.threads.map((thread: any) => ({
          ...thread,
          _id: thread.id || thread._id
        }));
        setThreads(normalizedThreads);
      } else if (response.status === 401) {
        // Not authenticated, redirect will happen via useEffect
        console.log('Not authenticated, threads not loaded');
        return; // Exit early, don't show error
      } else {
        console.error('Failed to load threads, status:', response.status);
        toast.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      // Only show error if it's not an authentication issue
      if (error instanceof Error && !error.message.includes('401')) {
        toast.error('Failed to load conversations');
      }
    } finally {
      // Mark initialization as complete after loading threads
      setIsInitializing(false);
    }
  };

  // Create new thread
  const createNewThread = async () => {
    // Prevent simultaneous thread creation
    if (isCreatingThreadRef.current) {
      console.log('🚫 Thread creation already in progress, skipping...');
      return;
    }

    // Check for empty threads
    const existingEmptyThread = threads.find((t) => t.isEmpty === true);
    if (existingEmptyThread) {
      console.log('⚠️ Found existing empty thread:', existingEmptyThread);
      setEmptyThread(existingEmptyThread);
      setShowEmptyThreadDialog(true);
      return;
    }

    try {
      isCreatingThreadRef.current = true;
      console.log('✅ Starting thread creation...');

      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Financial Report',
          description: 'Generated report',
        }),
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Thread creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error(`Failed to create conversation: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('Thread creation response:', data);

      // Validate response structure
      if (!data.thread) {
        console.error('Invalid thread response - missing thread object:', data);
        toast.error('Failed to create conversation - invalid server response');
        return;
      }

      // Validate we got a valid thread ID (support both Prisma 'id' and MongoDB '_id')
      const threadId = data.thread.id || data.thread._id;
      if (!threadId || threadId === 'undefined' || threadId === 'null') {
        console.error('Invalid thread ID in response:', {
          threadId,
          hasId: !!data.thread.id,
          has_id: !!data.thread._id,
          thread: data.thread
        });
        toast.error('Failed to create conversation - invalid thread ID');
        return;
      }

      // Normalize the thread object to use _id for consistency with the interface
      const normalizedThread = { ...data.thread, _id: threadId };

      // Mark that we just created this thread to prevent useEffect from reloading it
      justCreatedThreadRef.current = threadId;

      // Clear all existing state
      setMessages([]);
      setCurrentReport(null);
      setStreamingContent('');
      setSections([]);
      setSelectedSectionId(null);
      setEditingContext(null);
      setSectionPreviewContent({});
      setSectionStreamingState({});
      setShowDashboard(false); // Hide dashboard when creating new thread

      // Set new thread as current
      setCurrentThread(normalizedThread);
      setThreads([normalizedThread, ...threads]);

      // Save as last opened thread and update URL
      if (session?.user?.email) {
        localStorage.setItem(`playground_last_thread_${session.user.email}`, threadId);
      }
      router.replace(`/financial-playground?thread=${threadId}`, { scroll: false });

      console.log('✅ Thread created successfully:', threadId);
      toast.success('New conversation started');
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create conversation');
    } finally {
      // Reset the flag after a short delay to allow state updates to propagate
      setTimeout(() => {
        isCreatingThreadRef.current = false;
        console.log('✅ Thread creation lock released');
      }, 1000);
    }
  };

  // Load specific thread
  const loadThread = async (threadId: string) => {
    // Validate thread ID
    if (!threadId || threadId === 'undefined' || threadId === 'null') {
      console.error('Invalid thread ID:', threadId);
      setShowDashboard(true);
      router.replace('/financial-playground', { scroll: false });
      return;
    }

    // Prevent loading the same thread multiple times
    if (isLoadingThreadRef.current || lastLoadedThreadRef.current === threadId) {
      console.log('⏭️ Skipping thread load - already loading or loaded:', threadId);
      return;
    }

    try {
      isLoadingThreadRef.current = true;
      console.log('📥 Loading thread:', threadId);

      const response = await fetch(`/api/playground/threads/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        // Normalize thread ID (support both Prisma 'id' and MongoDB '_id')
        const normalizedThread = {
          ...data.thread,
          _id: data.thread.id || data.thread._id
        };
        // Normalize message IDs (support both Prisma 'id' and MongoDB '_id')
        const normalizedMessages = data.messages.map((msg: any) => ({
          ...msg,
          _id: msg.id || msg._id
        }));

        // Update last loaded ref BEFORE setting state to prevent re-triggers
        lastLoadedThreadRef.current = threadId;

        setCurrentThread(normalizedThread);
        setMessages(normalizedMessages);
        setCurrentReport(data.currentReport);
        setStreamingContent('');

        // Save as last opened thread
        if (session?.user?.email) {
          localStorage.setItem(`playground_last_thread_${session.user.email}`, threadId);
        }

        // Update URL only if we have a valid thread ID
        router.replace(`/financial-playground?thread=${threadId}`, { scroll: false });

        // Load sections if report is in interactive mode
        if (data.currentReport?.isInteractiveMode) {
          await loadSections(data.currentReport._id);
        } else {
          setSections([]);
        }

        console.log('✅ Thread loaded successfully:', threadId);
      } else {
        console.error('Failed to load thread:', response.status);
        // If thread not found, clear it from refs
        lastLoadedThreadRef.current = null;
        toast.error('Thread not found');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      lastLoadedThreadRef.current = null;
      toast.error('Failed to load conversation');
    } finally {
      isLoadingThreadRef.current = false;
    }
  };

  // Load sections for a report
  const loadSections = async (reportId: string) => {
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Failed to load sections');
    }
  };

  // Send message and stream response
  const sendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputMessage;

    // Type guard: ensure messageToSend is a string
    if (typeof messageToSend !== 'string' || !messageToSend.trim()) {
      console.log('❌ Send blocked: empty message', { messageToSend, inputMessage });
      return;
    }

    if (!currentThread) {
      console.log('❌ Send blocked: no thread');
      toast.error('Please create a new conversation first');
      return;
    }

    console.log('✅ Sending message:', messageToSend);
    const userMessage = messageToSend.trim();
    setInputMessage('');
    setIsLoading(true);

    // Check if we're in editing context (editing or adding a section)
    // When in edit mode, don't add messages to chat - just handle the edit
    if (editingContext) {
      if (editingContext.type === 'edit' && editingContext.sectionId) {
        // Edit existing section (no chat message created)
        await handleSectionEdit(editingContext.sectionId, userMessage);
      } else if (editingContext.type === 'add') {
        // Add new section (no chat message created)
        await handleSectionAdd(userMessage, editingContext.position);
      }
      return;
    }

    // Normal message flow - only add to chat if NOT in edit mode
    setStreamingContent('');
    setStreamingUsage(null);

    // Add user message immediately
    const tempUserMessage: Message = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, tempUserMessage]);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(
        `/api/playground/threads/${currentThread._id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: userMessage,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'anthropic',
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Message send failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content') {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                } else if (data.type === 'usage') {
                  // Update streaming usage display
                  console.log('📊 Usage update received:', data);
                  setStreamingUsage({
                    inputTokens: data.inputTokens,
                    outputTokens: data.outputTokens,
                  });
                } else if (data.type === 'complete') {
                  // Reload thread to get the saved message and report
                  await loadThread(currentThread._id);
                  setStreamingContent('');
                  setStreamingUsage(null);
                  toast.success('Report generated successfully');
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.success('Report generation stopped');
        setStreamingContent('');
        setStreamingUsage(null);
      } else {
        console.error('Error sending message:', error);
        toast.error('Failed to generate report');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle section editing with streaming
  const handleSectionEdit = async (sectionId: string, prompt: string) => {
    if (!currentReport) return;

    try {
      // Set streaming state for this section
      setSectionStreamingState(prev => ({ ...prev, [sectionId]: true }));
      setSectionPreviewContent(prev => ({ ...prev, [sectionId]: '' }));

      const response = await fetch(
        `/api/playground/reports/${currentReport._id}/sections/${sectionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to edit section');
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content') {
                  accumulated += data.content;
                  setSectionPreviewContent(prev => ({ ...prev, [sectionId]: accumulated }));
                } else if (data.type === 'complete') {
                  // Update the section in state
                  await loadSections(currentReport._id);
                  setSectionPreviewContent(prev => {
                    const updated = { ...prev };
                    delete updated[sectionId];
                    return updated;
                  });
                  setSectionStreamingState(prev => ({ ...prev, [sectionId]: false }));
                  setEditingContext(null);

                  // Trigger immediate metrics refresh
                  if (typeof window !== 'undefined' && (window as any).__refreshReportMetrics) {
                    await (window as any).__refreshReportMetrics();
                  }

                  toast.success('Section updated successfully');
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error editing section:', error);
      toast.error('Failed to edit section');
      setSectionStreamingState(prev => ({ ...prev, [sectionId]: false }));
      setSectionPreviewContent(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new section with streaming
  const handleSectionAdd = async (prompt: string, position?: number) => {
    if (!currentReport) return;

    try {
      const response = await fetch(
        `/api/playground/reports/${currentReport._id}/sections`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            position
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add section');
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let newSectionId: string | null = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
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
                  setSectionPreviewContent(prev => ({
                    ...prev,
                    [newSectionId!]: (prev[newSectionId!] || '') + data.content
                  }));
                } else if (data.type === 'complete') {
                  // Reload sections
                  await loadSections(currentReport._id);
                  if (newSectionId) {
                    setSectionPreviewContent(prev => {
                      const updated = { ...prev };
                      delete updated[newSectionId!];
                      return updated;
                    });
                    setSectionStreamingState(prev => ({ ...prev, [newSectionId!]: false }));
                  }
                  setEditingContext(null);

                  // Trigger immediate metrics refresh
                  if (typeof window !== 'undefined' && (window as any).__refreshReportMetrics) {
                    await (window as any).__refreshReportMetrics();
                  }

                  toast.success('Section added successfully');
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error adding section:', error);
      toast.error('Failed to add section');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingContent('');
      setStreamingUsage(null);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Section operation handlers
  const handleEditSection = (sectionId: string) => {
    console.log('🔧 handleEditSection called:', { sectionId });
    const section = sections.find(s => s._id === sectionId);
    if (section) {
      console.log('✅ Setting editingContext:', {
        type: 'edit',
        sectionId,
        sectionTitle: section.title
      });
      setEditingContext({
        type: 'edit',
        sectionId,
        section,
      });
      // Scroll to chat input when entering edit mode
      setTimeout(() => {
        const chatInput = document.querySelector('.chat-input-field') as HTMLInputElement;
        if (chatInput) {
          chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          chatInput.focus();
        }
      }, 100);
    } else {
      console.error('❌ Section not found:', sectionId);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!currentReport) return;

    try {
      const response = await fetch(
        `/api/playground/reports/${currentReport._id}/sections/${sectionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadSections(currentReport._id);
        toast.success('Section deleted');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleDuplicateSection = async (sectionId: string) => {
    if (!currentReport) return;

    try {
      const response = await fetch(
        `/api/playground/reports/${currentReport._id}/sections/${sectionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'duplicate' }),
        }
      );

      if (response.ok) {
        await loadSections(currentReport._id);
        toast.success('Section duplicated');
      }
    } catch (error) {
      console.error('Error duplicating section:', error);
      toast.error('Failed to duplicate section');
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!currentReport) return;

    try {
      const response = await fetch(
        `/api/playground/reports/${currentReport._id}/sections/${sectionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: `move-${direction}` }),
        }
      );

      if (response.ok) {
        await loadSections(currentReport._id);
      }
    } catch (error) {
      console.error('Error moving section:', error);
      toast.error('Failed to move section');
    }
  };

  const handleDownloadSection = (sectionId: string, htmlContent: string, title: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Section downloaded');
  };

  const handleExportPDF = async () => {
    if (!currentReport) {
      toast.error('No report to export');
      return;
    }

    try {
      toast.loading('Generating branded PDF...');

      const response = await fetch(`/api/playground/reports/${currentReport._id}/export-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `AssetWorks_Report_${new Date().toISOString().split('T')[0]}.pdf`;

      // Download the PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.dismiss();
      toast.error('Failed to export PDF');
    }
  };

  const handleToggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Convert static report to interactive mode
  const convertToInteractive = async () => {
    if (!currentReport || currentReport.isInteractiveMode) return;

    try {
      const response = await fetch(`/api/playground/reports/${currentReport._id}/convert-to-interactive`, {
        method: 'POST',
      });

      if (response.ok) {
        // Reload thread to get updated report with sections
        await loadThread(currentThread!._id);
        toast.success('Report converted to interactive mode');
      }
    } catch (error) {
      console.error('Error converting report:', error);
      toast.error('Failed to convert report');
    }
  };

  // Thread management functions
  const deleteThread = async (threadId: string, skipConfirmation = false) => {
    if (!skipConfirmation && !confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/playground/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setThreads(threads.filter(t => t._id !== threadId));
        if (currentThread?._id === threadId) {
          setCurrentThread(null);
          setMessages([]);
          setCurrentReport(null);
          setSections([]);
        }
        toast.success('Conversation deleted');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const renameThread = async (threadId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/playground/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setThreads(threads.map(t =>
          t._id === threadId ? { ...t, title: newTitle } : t
        ));
        if (currentThread?._id === threadId) {
          setCurrentThread({ ...currentThread, title: newTitle });
        }
        setEditingThreadId(null);
        setEditingThreadTitle('');
        toast.success('Conversation renamed');
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
      toast.error('Failed to rename conversation');
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(threadSearchQuery.toLowerCase())
  );

  // Bulk delete all empty threads
  const handleBulkDeleteEmpty = async () => {
    setBulkDeleteLoading(true);
    try {
      const response = await fetch('/api/playground/threads/bulk-delete-empty', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete empty threads');
      }

      const data = await response.json();

      console.log('✅ Bulk delete result:', data);

      if (data.deletedCount === 0) {
        toast.success('No empty threads found to delete');
      } else {
        toast.success(`Successfully deleted ${data.deletedCount} empty thread${data.deletedCount !== 1 ? 's' : ''}`);

        // Reload threads to update the list
        await loadThreads();

        // If current thread was deleted, clear the view
        if (currentThread && data.threads.some((t: any) => t.id === currentThread._id)) {
          setCurrentThread(null);
          setMessages([]);
          setCurrentReport(null);
          setSections([]);
          router.replace('/financial-playground', { scroll: false });
        }
      }

      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error('Error bulk deleting empty threads:', error);
      toast.error('Failed to delete empty threads');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Handle using existing empty thread
  const handleUseEmptyThread = () => {
    if (emptyThread) {
      loadThread(emptyThread._id);
      setShowEmptyThreadDialog(false);
      setEmptyThread(null);
    }
  };

  // Handle deleting empty thread and creating new one
  const handleDeleteAndCreateNew = async () => {
    if (emptyThread) {
      try {
        await deleteThread(emptyThread._id, true); // Skip confirmation for empty threads
        setShowEmptyThreadDialog(false);
        setEmptyThread(null);
        // Now create new thread
        await createNewThreadForced();
      } catch (error) {
        console.error('Error deleting empty thread:', error);
        toast.error('Failed to delete empty thread');
      }
    }
  };

  // Force create new thread (bypass empty thread check)
  const createNewThreadForced = async () => {
    try {
      isCreatingThreadRef.current = true;
      console.log('✅ Force creating new thread...');

      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Financial Report',
          description: 'Generated report',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create thread');
      }

      const data = await response.json();
      const threadId = data.thread.id || data.thread._id;
      const normalizedThread = { ...data.thread, _id: threadId };

      justCreatedThreadRef.current = threadId;
      setMessages([]);
      setCurrentReport(null);
      setStreamingContent('');
      setSections([]);
      setSelectedSectionId(null);
      setEditingContext(null);
      setSectionPreviewContent({});
      setSectionStreamingState({});
      setShowDashboard(false);

      setCurrentThread(normalizedThread);
      setThreads([normalizedThread, ...threads]);

      if (session?.user?.email) {
        localStorage.setItem(`playground_last_thread_${session.user.email}`, threadId);
      }
      router.replace(`/financial-playground?thread=${threadId}`, { scroll: false });

      toast.success('New conversation started');
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create conversation');
    } finally {
      setTimeout(() => {
        isCreatingThreadRef.current = false;
      }, 1000);
    }
  };

  // Handle share button click - open dialog
  const handleShare = () => {
    if (!currentThread) {
      toast.error('No active thread to share');
      return;
    }
    setIsShareDialogOpen(true);
  };

  // Handle context progress bar click - open context modal
  const handleOpenContextModal = (type: 'thread' | 'report', id: string, tokens: number) => {
    setContextModalEntity({ type, id, tokens });
    setIsContextModalOpen(true);
  };

  // Show loading state while authenticating or initializing
  if (status === 'loading' || isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Financial Playground
          </h3>
          <p className="text-sm text-gray-600">
            {status === 'loading' ? 'Authenticating...' : 'Preparing your workspace...'}
          </p>
        </div>
      </div>
    );
  }

  // Show AI Summary Dashboard for returning users
  if (showDashboard) {
    return <AISummaryDashboard />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">
            Financial Playground
          </h1>
          {currentThread && (
            <span className="text-sm text-gray-500">
              · {currentThread.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/financial-playground/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!currentThread}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!currentReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="financial-playground-layout">
          {/* Chat Panel (Left) */}
          <Panel defaultSize={30} minSize={20} maxSize={50} id="chat-panel">
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
              {/* Sidebar Toggle */}
              <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={createNewThread}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Thread
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Thread List Sidebar */}
                {isSidebarOpen && (
                  <div className="w-72 border-r border-gray-200 flex flex-col">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-200 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={threadSearchQuery}
                          onChange={(e) => setThreadSearchQuery(e.target.value)}
                          placeholder="Search conversations..."
                          className="pl-10 h-9 text-sm"
                        />
                      </div>

                      {/* Bulk Delete Empty Threads Button */}
                      {threads.some(t => t.isEmpty) && (
                        <Button
                          onClick={() => setShowBulkDeleteDialog(true)}
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clean Up Empty Threads ({threads.filter(t => t.isEmpty).length})
                        </Button>
                      )}
                    </div>

                    {/* Thread List */}
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {filteredThreads.length === 0 ? (
                          <div className="text-center py-8 px-4">
                            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              {threadSearchQuery ? 'No conversations found' : 'No conversations yet'}
                            </p>
                          </div>
                        ) : (
                          filteredThreads.map((thread) => (
                            <div
                              key={thread._id}
                              className={`group relative rounded-lg transition-all ${
                                currentThread?._id === thread._id
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              {editingThreadId === thread._id ? (
                                <div className="p-2">
                                  <Input
                                    value={editingThreadTitle}
                                    onChange={(e) => setEditingThreadTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        renameThread(thread._id, editingThreadTitle);
                                      } else if (e.key === 'Escape') {
                                        setEditingThreadId(null);
                                        setEditingThreadTitle('');
                                      }
                                    }}
                                    onBlur={() => {
                                      if (editingThreadTitle.trim()) {
                                        renameThread(thread._id, editingThreadTitle);
                                      } else {
                                        setEditingThreadId(null);
                                        setEditingThreadTitle('');
                                      }
                                    }}
                                    autoFocus
                                    className="h-8 text-sm"
                                  />
                                  <div className="flex items-center gap-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => renameThread(thread._id, editingThreadTitle)}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        setEditingThreadId(null);
                                        setEditingThreadTitle('');
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => loadThread(thread._id)}
                                    className="w-full text-left p-3"
                                  >
                                    <div className="font-medium text-sm truncate pr-8">
                                      {thread.title}
                                    </div>
                                    {/* Show preview from first message or empty indicator */}
                                    {thread.isEmpty ? (
                                      <div className="text-xs text-gray-400 italic mt-1">
                                        Empty conversation
                                      </div>
                                    ) : thread.firstMessage ? (
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {thread.firstMessage.content.substring(0, 80)}
                                        {thread.firstMessage.content.length > 80 ? '...' : ''}
                                      </div>
                                    ) : null}
                                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span>{new Date(thread.updatedAt).toLocaleDateString()}</span>
                                        {thread.messageCount !== undefined && (
                                          <span className="text-xs text-gray-400">
                                            • {thread.messageCount} msg{thread.messageCount !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {new Date(thread.updatedAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </button>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingThreadId(thread._id);
                                          setEditingThreadTitle(thread.title);
                                        }}
                                        title="Rename"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteThread(thread._id);
                                        }}
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 && !currentThread && (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Start a New Conversation
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Create a financial report by starting a new thread
                        </p>
                        <Button onClick={createNewThread}>
                          <Plus className="w-4 h-4 mr-2" />
                          New Thread
                        </Button>
                      </div>
                    )}

                    {messages.length === 0 && currentThread && (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <Sparkles className="w-12 h-12 text-blue-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {currentThread.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Ready to generate your financial report. Describe what you'd like to create below.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`mb-4 group ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          {message.createdAt && (
                            <div className={`text-xs mt-1.5 ${
                              message.role === 'user'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                          {/* Message Actions - Copy, Feedback, Add to Report */}
                          <MessageActions
                            messageId={message._id}
                            content={message.content}
                            createdAt={message.createdAt}
                            threadId={currentThread?._id || ''}
                            role={message.role}
                            reportId={message.reportId || currentReport?._id}
                            metadata={message.metadata}
                          />
                        </div>
                      </div>
                    ))}

                    {streamingContent && (
                      <div className="mb-4 text-left">
                        <div className="inline-block max-w-[80%] p-3 rounded-lg bg-muted border border-blue-200">
                          <div className="flex flex-col gap-2">
                            <div className="text-sm text-foreground flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="font-medium">Generating report...</span>
                            </div>
                            {streamingUsage && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-blue-500" />
                                  <span>{streamingUsage.inputTokens + streamingUsage.outputTokens} tokens</span>
                                </div>
                                <div className="text-gray-300">|</div>
                                <div>
                                  <span className="text-green-600">{streamingUsage.inputTokens} in</span>
                                  <span className="mx-1">·</span>
                                  <span className="text-blue-600">{streamingUsage.outputTokens} out</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && !streamingContent && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Editing Context - Only show for edit mode */}
                  {editingContext && editingContext.type === 'edit' && (
                    <EditingContext
                      type={editingContext.type}
                      section={editingContext.section}
                      position={editingContext.position}
                      onCancel={() => setEditingContext(null)}
                      onDone={() => {
                        // Clear editing context and preview content
                        setEditingContext(null);
                        setSelectedSectionId(null);
                        toast.success('Editing complete');
                      }}
                      onSuggestionClick={(suggestion) => {
                        // Automatically send the suggestion (without creating chat message)
                        sendMessage(suggestion);
                      }}
                    />
                  )}

                  {/* Context Usage Progress Bar */}
                  {currentThread && (
                    <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                      <button
                        className="w-full flex items-center justify-between hover:bg-gray-100 transition-colors rounded px-2 py-1"
                        onClick={() => {
                          const currentTokens = messages.reduce((sum, m) => {
                            const tokens = m.metadata?.tokens;
                            return sum + (typeof tokens === 'number' ? tokens : 0);
                          }, 0) + (streamingUsage ? streamingUsage.inputTokens + streamingUsage.outputTokens : 0);
                          handleOpenContextModal('thread', currentThread._id, currentTokens);
                        }}
                        title="Click to view thread context"
                      >
                        <span className="text-xs font-medium text-gray-600">Context Usage:</span>
                        <ContextProgressBar
                          currentTokens={
                            messages.reduce((sum, m) => {
                              const tokens = m.metadata?.tokens;
                              return sum + (typeof tokens === 'number' ? tokens : 0);
                            }, 0) + (streamingUsage ? streamingUsage.inputTokens + streamingUsage.outputTokens : 0)
                          }
                          size="sm"
                          showLabel={false}
                        />
                      </button>
                    </div>
                  )}

                  {/* System Prompt Selector */}
                  {systemPrompts.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">AI Mode:</span>
                        <Select value={activeSystemPromptId} onValueChange={switchSystemPrompt}>
                          <SelectTrigger className="flex-1 h-8 text-xs min-w-0">
                            <SelectValue placeholder="Select a prompt" />
                          </SelectTrigger>
                          <SelectContent>
                            {systemPrompts.map((prompt) => (
                              <SelectItem
                                key={prompt.id}
                                value={prompt.id}
                                className="text-xs"
                              >
                                {prompt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          console.log('📝 Input changed:', newValue);
                          setInputMessage(newValue);
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder={
                          editingContext
                            ? editingContext.type === 'edit'
                              ? 'What would you like to change?'
                              : 'Describe the section to add...'
                            : 'Describe the financial report you want...'
                        }
                        disabled={isLoading || !currentThread}
                        className="flex-1 chat-input-field"
                        autoComplete="off"
                      />
                      {isLoading && streamingContent ? (
                        <Button
                          onClick={stopGeneration}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <StopCircle className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('🖱️ Send button clicked', {
                              inputMessage,
                              hasThread: !!currentThread,
                              isLoading,
                              trimmed: inputMessage.trim()
                            });
                            sendMessage();
                          }}
                          disabled={isLoading || !currentThread || !inputMessage.trim()}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-400 transition-colors" />

          {/* Report Panel (Right) */}
          <Panel defaultSize={70} minSize={50} id="report-panel">
            <div className="h-full flex flex-col bg-white">
              {/* Usage Metrics Ticker - Always show when thread exists */}
              {currentThread && (
                <ReportMetricsTicker
                  reportId={currentReport?._id || 'pending'}
                  streamingUsage={streamingUsage}
                  isStreaming={isLoading && !!streamingContent}
                  onContextClick={() => {
                    if (currentReport) {
                      const currentTokens = streamingUsage
                        ? streamingUsage.inputTokens + streamingUsage.outputTokens
                        : (currentReport.metadata?.tokens as number) || 0;
                      handleOpenContextModal('report', currentReport._id, currentTokens);
                    }
                  }}
                />
              )}

              {/* Insights Banner */}
              {currentReport && currentReport.insights.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Key Insights
                  </h3>
                  <div className="space-y-2">
                    {currentReport.insights.slice(0, 3).map((insight) => (
                      <div
                        key={insight.id}
                        className={`flex items-start gap-2 text-sm ${
                          insight.severity === 'critical'
                            ? 'text-red-700'
                            : insight.severity === 'warning'
                            ? 'text-yellow-700'
                            : insight.severity === 'success'
                            ? 'text-green-700'
                            : 'text-blue-700'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{insight.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entity Chips - Sticky below metrics ticker (only show when report exists) */}
              {currentReport && (
                <div className="sticky top-[40px] z-40 border-b border-gray-200 px-4 py-3 bg-gray-50/95 backdrop-blur-sm shadow-sm">
                  <EntityChips reportId={currentReport._id} />
                </div>
              )}

              {/* Report Content */}
              <ScrollArea className="flex-1 p-8">
                {!currentReport && !streamingContent ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Report Yet
                    </h3>
                    <p className="text-gray-500">
                      Start a conversation to generate your financial report
                    </p>
                  </div>
                ) : currentReport?.isInteractiveMode && sections.length > 0 ? (
                  <div className="max-w-5xl mx-auto space-y-6">
                    {/* Interactive Sections with Add Buttons */}
                    <AddSectionButton
                      reportId={currentReport._id}
                      position={0}
                      onSectionAdded={() => loadSections(currentReport._id)}
                    />

                    {sections.map((section, index) => {
                      const isEditing = editingContext?.type === 'edit' && editingContext?.sectionId === section._id;
                      const isOtherSectionEditing = editingContext && editingContext.sectionId !== section._id;

                      return (
                        <div
                          key={section._id}
                          className={`transition-all duration-300 ${
                            isOtherSectionEditing ? 'opacity-30 pointer-events-none' : 'opacity-100'
                          }`}
                        >
                          <InteractiveSection
                            sectionId={section._id}
                            reportId={section.reportId}
                            htmlContent={section.htmlContent}
                            title={section.title}
                            order={section.order}
                            isFirst={index === 0}
                            isLast={index === sections.length - 1}
                            isSelected={selectedSectionId === section._id}
                            isCollapsed={collapsedSections[section._id] || false}
                            isInEditMode={isEditing}
                            isStreaming={sectionStreamingState[section._id] || false}
                            previewContent={sectionPreviewContent[section._id]}
                            onSelect={() => {
                              console.log('📍 Section selected (not editing yet):', section._id);
                              setSelectedSectionId(section._id);
                            }}
                            onEdit={handleEditSection}
                            onCancelEdit={() => {
                              console.log('❌ Cancelled editing');
                              setEditingContext(null);
                              setSelectedSectionId(null);
                              toast.info('Editing cancelled');
                            }}
                            onDelete={handleDeleteSection}
                            onDuplicate={handleDuplicateSection}
                            onMoveUp={(id) => handleMoveSection(id, 'up')}
                            onMoveDown={(id) => handleMoveSection(id, 'down')}
                            onDownload={handleDownloadSection}
                            onToggleCollapse={handleToggleCollapse}
                          />

                          <AddSectionButton
                            reportId={currentReport._id}
                            position={section.order + 1}
                            onSectionAdded={() => loadSections(currentReport._id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto">
                    {/* Use ChartRenderer for interactive charts */}
                    <ChartRenderer
                      htmlContent={streamingContent || currentReport?.htmlContent || ''}
                    />
                  </div>
                )}
                <div ref={reportEndRef} />
              </ScrollArea>

              {/* Bottom Sticky Action Bar */}
              {currentReport && (() => {
                console.log('🔍 Bottom bar debug:', {
                  hasReport: !!currentReport,
                  isInteractive: currentReport?.isInteractiveMode,
                  hasEditingContext: !!editingContext,
                  editingType: editingContext?.type,
                  sectionsCount: sections.length
                });
                return true;
              })() && (
                <div className="sticky bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
                  <div className="px-4 py-3 flex items-center justify-between">
                    {/* Left side - Status */}
                    <div className="flex items-center gap-2">
                      {editingContext ? (
                        <>
                          <Edit className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-600">
                            Editing Mode Active
                          </span>
                          <span className="text-xs text-gray-500">
                            {editingContext.type === 'edit' ? 'Edit section via chat' : 'Add new section via chat'}
                          </span>
                        </>
                      ) : currentReport.isInteractiveMode ? (
                        <>
                          <Sparkles className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Interactive Mode
                          </span>
                          <span className="text-xs text-gray-500">
                            {sections.length} editable sections
                          </span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-600">
                            Static Report
                          </span>
                          <span className="text-xs text-gray-500">
                            Convert to enable editing
                          </span>
                        </>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-2">
                      {editingContext ? (
                        <Button
                          onClick={() => {
                            console.log('✅ Done Editing button clicked');
                            setEditingContext(null);
                            setSelectedSectionId(null);
                            toast.success('Exited editing mode');
                          }}
                          variant="default"
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-pulse-subtle"
                        >
                          <X className="w-4 h-4" />
                          Done Editing
                        </Button>
                      ) : !currentReport.isInteractiveMode && !streamingContent ? (
                        <Button
                          onClick={convertToInteractive}
                          size="sm"
                          className="gap-2 bg-primary hover:bg-primary/90"
                        >
                          <Sparkles className="w-4 h-4" />
                          Convert to Interactive Mode
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        threadId={currentThread?._id}
        reportId={currentReport?._id}
        userEmail={session?.user?.email}
      />

      {/* Context Details Modal */}
      {contextModalEntity && (
        <ContextDetailsModal
          isOpen={isContextModalOpen}
          onClose={() => {
            setIsContextModalOpen(false);
            setContextModalEntity(null);
          }}
          entityType={contextModalEntity.type}
          entityId={contextModalEntity.id}
          currentTokens={contextModalEntity.tokens}
        />
      )}

      {/* Empty Thread Dialog */}
      <Dialog open={showEmptyThreadDialog} onOpenChange={setShowEmptyThreadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Empty Conversation Found
            </DialogTitle>
            <DialogDescription>
              You have an empty conversation "{emptyThread?.title}". Would you like to:
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Button
              onClick={handleUseEmptyThread}
              className="w-full h-auto py-4 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span className="font-semibold">Use Existing Empty Conversation</span>
              </div>
              <span className="text-xs text-blue-100">
                Continue in the empty conversation instead of creating a new one
              </span>
            </Button>

            <Button
              onClick={handleDeleteAndCreateNew}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-700">Delete Empty & Create New</span>
              </div>
              <span className="text-xs text-gray-600">
                Remove the empty conversation and start a new one
              </span>
            </Button>

            <Button
              onClick={() => {
                setShowEmptyThreadDialog(false);
                setEmptyThread(null);
              }}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Empty Threads Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Clean Up Empty Threads
            </DialogTitle>
            <DialogDescription>
              You are about to delete {threads.filter(t => t.isEmpty).length} empty conversation
              {threads.filter(t => t.isEmpty).length !== 1 ? 's' : ''}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Threads to be deleted:
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {threads
                  .filter(t => t.isEmpty)
                  .slice(0, 10)
                  .map((thread) => (
                    <div
                      key={thread._id}
                      className="text-sm text-gray-600 flex items-center gap-2 py-1"
                    >
                      <MessageSquare className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{thread.title}</span>
                      <span className="text-xs text-gray-400">
                        ({new Date(thread.updatedAt).toLocaleDateString()})
                      </span>
                    </div>
                  ))}
                {threads.filter(t => t.isEmpty).length > 10 && (
                  <div className="text-sm text-gray-500 italic pt-2">
                    ... and {threads.filter(t => t.isEmpty).length - 10} more
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowBulkDeleteDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={bulkDeleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDeleteEmpty}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={bulkDeleteLoading}
              >
                {bulkDeleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
