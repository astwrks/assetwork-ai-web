'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import toast from 'react-hot-toast';
import {
  Hash,
  Star,
  Archive,
  MessageSquare,
  Search,
  Plus,
  Settings,
  HelpCircle,
  Bell,
  ChevronDown,
  X,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Bold,
  Italic,
  Code,
  Link,
  ListOrdered,
  MoreHorizontal,
  ChevronRight,
  Clock,
  Users,
  FileText,
  Sparkles,
  Command,
  BarChart3,
  PieChart,
  TrendingUp,
  Table,
  Download,
  Upload,
  Calculator,
  DollarSign,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatModelName } from '@/lib/utils/modelFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import CommandPalette from '@/components/financial-playground/CommandPalette';
import ReportDisplay from '@/components/financial-playground/ReportDisplay';
import StreamingProgress from '@/components/financial-playground/StreamingProgress';
import EditingContext from '@/components/financial-playground/EditingContext';
import TemplateCard from '@/components/financial-playground/TemplateCard';
import TemplateDetailDialog from '@/components/financial-playground/TemplateDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ITemplate } from '@/lib/db/models/Template';

// SWR fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};

// Types
interface Thread {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  currentReportId?: string;
  reportVersions: string[];
  sharedWith: any[];
  isTemplate: boolean;
  templateName?: string;
  templateDescription?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reportId?: string;
  metadata?: {
    model?: string;
    provider?: string;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost?: number;
    duration?: number;
    error?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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

export default function FinancialPlaygroundV2() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core state
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<'info' | 'report' | 'settings' | 'activity'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Financial tool state
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);

  // Streaming progress state
  const [streamingStage, setStreamingStage] = useState('');

  // Section management - for interactive report editing
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

  // Preview & streaming states for sections
  const [sectionPreviewContent, setSectionPreviewContent] = useState<Record<string, string>>({});
  const [sectionStreamingState, setSectionStreamingState] = useState<Record<string, boolean>>({});
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingError, setStreamingError] = useState('');
  const [streamingTokens, setStreamingTokens] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch threads with SWR
  const { data: threadsData, error: threadsError, mutate: mutateThreads } = useSWR(
    session?.user ? '/api/playground/threads?status=active' : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  // Fetch messages for active thread
  const { data: messagesData, error: messagesError, mutate: mutateMessages } = useSWR(
    activeThread?._id ? `/api/playground/threads/${activeThread._id}/messages` : null,
    fetcher,
    {
      refreshInterval: 2000, // Refresh every 2 seconds for near real-time updates
    }
  );

  // Fetch templates
  const { data: templatesData, error: templatesError, mutate: mutateTemplates } = useSWR(
    session?.user ? '/api/playground/templates' : null,
    fetcher
  );

  const threads = threadsData?.threads || [];
  const messages = messagesData?.messages || [];
  const templates = templatesData?.templates || [];

  // Handle URL-based thread routing
  useEffect(() => {
    if (threads.length === 0 || !session) return;

    const threadIdFromUrl = searchParams.get('thread');

    if (threadIdFromUrl) {
      // Load thread from URL parameter
      const thread = threads.find(t => t._id === threadIdFromUrl);
      if (thread && (!activeThread || activeThread._id !== threadIdFromUrl)) {
        console.log('🔗 Loading thread from URL:', threadIdFromUrl);
        setActiveThread(thread);
        // Save to localStorage
        if (session?.user?.email) {
          localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, threadIdFromUrl);
        }
      }
    } else if (!activeThread) {
      // No URL parameter and no active thread - load last opened thread
      if (session?.user?.email) {
        const lastThreadId = localStorage.getItem(`playground_v2_last_thread_${session.user.email}`);
        if (lastThreadId) {
          const thread = threads.find(t => t._id === lastThreadId);
          if (thread) {
            console.log('💾 Restoring last thread from localStorage:', lastThreadId);
            setActiveThread(thread);
            // Update URL without reload
            router.replace(`/financial-playground-v2?thread=${lastThreadId}`, { scroll: false });
          }
        }
      }
    }
  }, [threads, searchParams, session, activeThread, router]);

  // Update URL when active thread changes
  useEffect(() => {
    if (activeThread && session?.user?.email) {
      // Update URL to reflect current thread
      const currentUrlThreadId = searchParams.get('thread');
      if (currentUrlThreadId !== activeThread._id) {
        router.replace(`/financial-playground-v2?thread=${activeThread._id}`, { scroll: false });
      }
      // Save to localStorage
      localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, activeThread._id);
    }
  }, [activeThread, session, router, searchParams]);

  // Auto-switch to report mode when a report exists
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Check if any message has a reportId
      const hasReport = messages.some((msg: any) => msg.role === 'assistant' && msg.reportId);

      if (hasReport && rightPanelMode !== 'report') {
        console.log('📊 Auto-switching to report mode - report detected in messages');
        setRightPanelMode('report');
        setRightPanelOpen(true);
      }
    }
  }, [messages, rightPanelMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Send message
      if (e.metaKey && e.key === 'Enter' && inputValue) {
        e.preventDefault();
        handleSendMessage();
      }
      // Toggle sidebar
      if (e.metaKey && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Toggle right panel
      if (e.metaKey && e.key === '.') {
        e.preventDefault();
        setRightPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputValue]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sections when a report is detected
  const loadSections = useCallback(async (reportId: string) => {
    try {
      console.log('📂 Loading sections for report:', reportId);
      const response = await fetch(`/api/playground/reports/${reportId}/sections`);

      if (!response.ok) {
        console.error('❌ Failed to fetch sections:', response.status);
        return;
      }

      const data = await response.json();
      console.log('✅ Sections loaded:', data.sections?.length || 0);

      // If no sections, try to convert the report to interactive mode
      if (!data.sections || data.sections.length === 0) {
        console.log('🔄 No sections found, attempting to convert to interactive mode...');
        try {
          const convertResponse = await fetch(`/api/playground/reports/${reportId}/convert-to-interactive`, {
            method: 'POST',
          });

          if (convertResponse.ok) {
            console.log('✅ Report converted to interactive mode');
            // Retry loading sections
            const retryResponse = await fetch(`/api/playground/reports/${reportId}/sections`);
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log('✅ Sections loaded after conversion:', retryData.sections?.length || 0);
              setSections(retryData.sections || []);
            }
          } else {
            console.warn('⚠️ Could not convert report to interactive mode');
            setSections([]);
          }
        } catch (convertError) {
          console.error('💥 Error converting report:', convertError);
          setSections([]);
        }
      } else {
        setSections(data.sections || []);
      }

      // Clear any previous preview/streaming states
      setSectionPreviewContent({});
      setSectionStreamingState({});
      setEditingContext(null);
      setSelectedSectionId(null);
    } catch (error) {
      console.error('💥 Error loading sections:', error);
      toast.error('Failed to load report sections');
    }
  }, []);

  // Load sections when report changes
  useEffect(() => {
    if (messages && messages.length > 0) {
      // Find the latest report
      const latestReportMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant' && msg.reportId);

      if (latestReportMessage && latestReportMessage.reportId) {
        console.log('🔄 Report detected, loading sections for:', latestReportMessage.reportId);
        loadSections(latestReportMessage.reportId);
      } else {
        // No report, clear sections
        setSections([]);
      }
    }
  }, [messages, loadSections]);

  // Section operation handlers
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
    console.log('📌 Section selected:', sectionId);
  }, []);

  const handleSectionEdit = useCallback((sectionOrId: Section | string) => {
    // Handle both Section object or sectionId string
    const section = typeof sectionOrId === 'string'
      ? sections.find(s => s._id === sectionOrId)
      : sectionOrId;

    if (!section) {
      console.error('❌ Section not found for edit');
      return;
    }

    console.log('✏️ Edit section:', section._id);
    setEditingContext({
      type: 'edit',
      sectionId: section._id,
      section,
    });
    setSelectedSectionId(section._id);
    // Focus input
    inputRef.current?.focus();
    toast('Click to edit this section', { icon: '✏️' });
  }, [sections]);

  const handleSectionAdd = useCallback((position: number) => {
    console.log('➕ Add section at position:', position);
    setEditingContext({
      type: 'add',
      position,
    });
    // Focus input
    inputRef.current?.focus();
    toast('Add a new section', { icon: '➕' });
  }, []);

  const handleSectionDelete = useCallback(async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    console.log('🗑️ Delete section:', sectionId);
    try {
      const response = await fetch(`/api/playground/reports/sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete section');

      // Remove from local state
      setSections(prev => prev.filter(s => s._id !== sectionId));
      toast.success('Section deleted');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  }, []);

  const handleSectionDuplicate = useCallback(async (sectionId: string) => {
    console.log('📋 Duplicate section:', sectionId);
    try {
      const response = await fetch(`/api/playground/reports/sections/${sectionId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to duplicate section');

      const data = await response.json();
      // Add to local state
      setSections(prev => [...prev, data.section].sort((a, b) => a.order - b.order));
      toast.success('Section duplicated');
    } catch (error) {
      console.error('Error duplicating section:', error);
      toast.error('Failed to duplicate section');
    }
  }, []);

  const handleSectionMove = useCallback(async (sectionId: string, direction: 'up' | 'down') => {
    console.log('↕️ Move section:', sectionId, direction);
    try {
      const response = await fetch(`/api/playground/reports/sections/${sectionId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });

      if (!response.ok) throw new Error('Failed to move section');

      const data = await response.json();
      // Update local state with new order
      setSections(data.sections);
      toast.success(`Section moved ${direction}`);
    } catch (error) {
      console.error('Error moving section:', error);
      toast.error('Failed to move section');
    }
  }, []);

  const handleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeThread?._id || isSending) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsSending(true);
    setStreamingStage('analyzing');
    setStreamingProgress(10);
    setStreamingError('');
    setStreamingTokens(0);

    try {
      // Check if we're in editing mode
      if (editingContext) {
        console.log('📝 Section edit/add mode detected:', editingContext.type);

        if (editingContext.type === 'edit' && editingContext.sectionId && editingContext.section) {
          // EDIT SECTION MODE
          console.log('✏️ Editing section:', editingContext.sectionId);

          const response = await fetch(`/api/playground/reports/${editingContext.section.reportId}/sections/${editingContext.sectionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: message,
              model: 'claude-3-5-sonnet-20241022',
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to edit section: ${response.statusText}`);
          }

          // Handle SSE streaming for section edit
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedHTML = '';

          if (reader) {
            // Only set section-specific streaming state, NOT global streaming
            setSectionStreamingState(prev => ({ ...prev, [editingContext.sectionId!]: true }));

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
                      accumulatedHTML += data.content;
                      setSectionPreviewContent(prev => ({
                        ...prev,
                        [editingContext.sectionId!]: accumulatedHTML
                      }));
                      setStreamingProgress(Math.min(90, 30 + (accumulatedHTML.length / 1000) * 60));
                    } else if (data.type === 'complete') {
                      setStreamingStage('formatting');
                      setStreamingProgress(95);

                      // Update local sections state
                      setSections(prev => prev.map(s =>
                        s._id === editingContext.sectionId
                          ? { ...s, htmlContent: data.section.htmlContent, version: data.section.version }
                          : s
                      ));

                      // Clear streaming states
                      setSectionStreamingState(prev => ({ ...prev, [editingContext.sectionId!]: false }));
                      setSectionPreviewContent(prev => {
                        const updated = { ...prev };
                        delete updated[editingContext.sectionId!];
                        return updated;
                      });

                      setStreamingStage('complete');
                      setStreamingProgress(100);

                      toast.success('Section updated successfully!');
                    }
                  } catch (e) {
                    console.debug('Skipping invalid line:', line);
                  }
                }
              }
            }
          }

        } else if (editingContext.type === 'add' && editingContext.position !== undefined) {
          // ADD SECTION MODE
          console.log('➕ Adding section at position:', editingContext.position);

          // Find the report ID from the latest message
          const latestReportMessage = [...(messages || [])]
            .reverse()
            .find(msg => msg.role === 'assistant' && msg.reportId);

          if (!latestReportMessage?.reportId) {
            throw new Error('No report found to add section to');
          }

          const response = await fetch(`/api/playground/reports/${latestReportMessage.reportId}/sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: message,
              position: editingContext.position,
              model: 'claude-3-5-sonnet-20241022',
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to add section: ${response.statusText}`);
          }

          // Handle SSE streaming for section add
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedHTML = '';
          let tempSectionId = 'temp-' + Date.now();

          if (reader) {
            setStreamingStage('generating');
            setStreamingProgress(30);
            setSectionStreamingState(prev => ({ ...prev, [tempSectionId]: true }));

            // Add temporary section placeholder
            const tempSection: Section = {
              _id: tempSectionId,
              reportId: latestReportMessage.reportId,
              type: 'text',
              title: 'New Section',
              htmlContent: '',
              order: editingContext.position,
              version: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            setSections(prev => [...prev, tempSection].sort((a, b) => a.order - b.order));

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
                      accumulatedHTML += data.content;
                      setSectionPreviewContent(prev => ({
                        ...prev,
                        [tempSectionId]: accumulatedHTML
                      }));
                      setStreamingProgress(Math.min(90, 30 + (accumulatedHTML.length / 1000) * 60));
                    } else if (data.type === 'complete') {
                      setStreamingStage('formatting');
                      setStreamingProgress(95);

                      // Replace temp section with real section
                      setSections(prev =>
                        prev
                          .filter(s => s._id !== tempSectionId)
                          .concat([data.section])
                          .sort((a, b) => a.order - b.order)
                      );

                      // Clear streaming states
                      setSectionStreamingState(prev => {
                        const updated = { ...prev };
                        delete updated[tempSectionId];
                        return updated;
                      });
                      setSectionPreviewContent(prev => {
                        const updated = { ...prev };
                        delete updated[tempSectionId];
                        return updated;
                      });

                      setStreamingStage('complete');
                      setStreamingProgress(100);

                      toast.success('Section added successfully!');
                    }
                  } catch (e) {
                    console.debug('Skipping invalid line:', line);
                  }
                }
              }
            }
          }
        }

      } else {
        // NORMAL REPORT GENERATION MODE
        console.log('📊 Normal report generation mode');

        const response = await fetch(`/api/playground/threads/${activeThread._id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'anthropic'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          setStreamingStage('fetching');
          setStreamingProgress(30);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            setStreamingStage('generating');
            setStreamingProgress(60);

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'content') {
                    accumulatedContent += data.content;
                    setStreamingTokens(prev => prev + (data.content?.length || 0));
                    setStreamingProgress(Math.min(90, 60 + (accumulatedContent.length / 1000)));
                  } else if (data.type === 'complete') {
                    setStreamingStage('formatting');
                    setStreamingProgress(95);

                    // Refresh messages to show the new report
                    await mutateMessages();

                    setStreamingStage('complete');
                    setStreamingProgress(100);

                    // Open right panel to show report
                    setRightPanelOpen(true);
                    setRightPanelMode('report');

                    toast.success('Report generated successfully!');
                  } else if (data.type === 'error') {
                    setStreamingError(data.error);
                    throw new Error(data.error);
                  }
                } catch (e) {
                  console.debug('Skipping invalid line:', line);
                }
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setInputValue(message); // Restore the message on error
    } finally {
      setIsSending(false);
      setStreamingStage('');
      setStreamingProgress(0);
    }
  }, [inputValue, activeThread, isSending, editingContext, messages, mutateMessages]);

  const handleCreateNewThread = useCallback(async (title?: string) => {
    try {
      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `New Report ${new Date().toLocaleDateString()}`,
          description: 'Financial analysis thread',
        }),
      });

      if (!response.ok) throw new Error('Failed to create thread');

      const data = await response.json();
      setActiveThread(data.thread);

      // Update URL to new thread
      router.replace(`/financial-playground-v2?thread=${data.thread._id}`, { scroll: false });

      // Save to localStorage
      if (session?.user?.email) {
        localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, data.thread._id);
      }

      mutateThreads();
      toast.success('New thread created!');
      return data.thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
      return null;
    }
  }, [mutateThreads, router, session]);

  const handleThreadClick = useCallback((thread: Thread) => {
    setActiveThread(thread);
    // Update URL
    router.replace(`/financial-playground-v2?thread=${thread._id}`, { scroll: false });
    // Save to localStorage
    if (session?.user?.email) {
      localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, thread._id);
    }
    // Messages will be automatically fetched by SWR when activeThread changes
  }, [router, session]);

  const handleShareThread = useCallback(async () => {
    if (!activeThread) {
      toast.error('No active thread to share');
      return;
    }

    try {
      const threadUrl = `${window.location.origin}/financial-playground-v2/${activeThread._id}`;
      await navigator.clipboard.writeText(threadUrl);
      toast.success('Thread URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for browsers that don't support clipboard API
      const threadUrl = `${window.location.origin}/financial-playground-v2/${activeThread._id}`;
      toast.success(`Share this URL: ${threadUrl}`);
    }
  }, [activeThread]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type.includes('csv') || file.type.includes('excel') || file.type.includes('spreadsheet')) {
        toast.success(`Uploading ${file.name}...`);
        // TODO: Implement actual file upload logic
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result;
          // Process the file content
          setInputValue(inputValue + `\n[Uploaded file: ${file.name}]\n[Processing data...]`);
        };
        reader.readAsText(file);
      } else {
        toast.error('Please upload a CSV or Excel file');
      }
    }
  };

  const handleExportReport = () => {
    if (!activeThread) {
      toast.error('No active report to export');
      return;
    }

    // TODO: Implement actual export logic
    toast.success('Preparing export...');
    setTimeout(() => {
      toast.success('Report exported successfully!');
    }, 2000);
  };

  // Template handlers
  const handleTemplatePreview = useCallback((template: ITemplate) => {
    console.log('👁️ Preview template:', template.name);
    setSelectedTemplate(template);
    setShowTemplateDetail(true);
  }, []);

  const handleTemplateUse = useCallback(async (template: ITemplate) => {
    console.log('📋 Using template:', template.name);
    setIsCreatingFromTemplate(true);

    try {
      // Call the "use template" API endpoint
      const response = await fetch(`/api/playground/templates/${template._id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTitle: `${template.name} - ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          // Premium template without subscription
          toast.error(`This is a ${errorData.tier} template. Please upgrade your subscription.`);
          return;
        }
        throw new Error(errorData.error || 'Failed to create thread from template');
      }

      const data = await response.json();

      // Close dialogs first (before state changes)
      setShowTemplates(false);
      setShowTemplateDetail(false);
      setSelectedTemplate(null);

      // Save to localStorage (doesn't trigger re-render)
      if (session?.user?.email) {
        localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, data.thread._id);
      }

      // Set the new thread as active
      // NOTE: The useEffect watching activeThread will handle URL update automatically
      // so we don't need to call router.replace() here
      setActiveThread(data.thread);

      // Refresh threads list in background (optimistic update)
      mutateThreads();

      // Show success message
      toast.success(
        <div>
          <p className="font-medium">Report created from template!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Using: {template.name}
          </p>
        </div>
      );

      console.log('✅ Thread created successfully from template');
    } catch (error) {
      console.error('❌ Error creating thread from template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create report from template');
    } finally {
      setIsCreatingFromTemplate(false);
    }
  }, [router, session, mutateThreads]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          onAction={(action, data) => {
            console.log('Command action:', action, data);
            // Handle different actions
            switch (action) {
              case 'new-report':
                handleCreateNewThread();
                break;
              case 'template':
                // Create new thread with template
                handleCreateNewThread(`${data} Report`);
                break;
              case 'generate-report':
                // Create new thread with specific report type
                handleCreateNewThread(`${data} Report`);
                break;
              case 'set-ai-mode':
                // Switch AI mode - will implement with AI integration
                toast.success(`AI mode switched to: ${data}`);
                break;
              case 'go-to-threads':
              case 'go-to-starred':
              case 'go-to-archive':
                // Navigation actions - handled by sidebar
                toast.info('Navigate to ' + action.replace('go-to-', ''));
                break;
              // Add more action handlers as needed
            }
          }}
        />
        {/* Top Navigation Bar */}
        <header className="h-[38px] bg-[#350d36] text-white flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">AssetWorks Financial</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search reports, threads, and more..."
                className="w-full h-7 pl-8 pr-8 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm focus:bg-white/20 focus:border-white/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-white/10 px-1 py-0.5 rounded text-white/50">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-7 w-7 p-0 hover:bg-white/10">
                  <Bell className="w-4 h-4 text-white/80" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-white/10">
                  <HelpCircle className="w-4 h-4 text-white/80" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help & Feedback</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-white/10">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="text-xs bg-primary text-white">
                      {session?.user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{session?.user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className={cn(
            "bg-[#3f0e40] text-white flex flex-col transition-all duration-200 flex-shrink-0",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-[260px] border-r border-[#522653]"
          )}>
            {/* Workspace Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-[#522653]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Financial Reports</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-white/10"
                onClick={() => setSidebarCollapsed(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-2 space-y-1">
              <Button
                className="w-full justify-start h-8 px-2 bg-white/10 hover:bg-white/20 text-white"
                size="sm"
                onClick={() => handleCreateNewThread()}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </div>

            <Separator className="bg-[#522653]" />

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <div className="px-3 py-2 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 px-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  All Threads
                  <Badge variant="secondary" className="ml-auto bg-white/10 text-white">
                    {threads.length}
                  </Badge>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 px-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Starred
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 px-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Drafts
                  <Badge variant="secondary" className="ml-auto bg-white/10 text-white">
                    1
                  </Badge>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 px-2 text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </div>

              <Separator className="my-2 bg-[#522653]" />

              {/* Thread List */}
              <div className="px-2 py-2">
                <div className="text-xs font-semibold text-white/50 px-2 mb-3 uppercase tracking-wide">
                  Recent
                </div>
                {threads.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">No threads yet</p>
                    <p className="text-[10px] text-white/40 mt-1">Create your first report</p>
                  </div>
                ) : (
                  threads.map((thread) => {
                    const lastUpdated = new Date(thread.updatedAt);
                    const now = new Date();
                    const diffMs = now.getTime() - lastUpdated.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    let timeAgo = 'just now';
                    if (diffDays > 0) timeAgo = `${diffDays}d ago`;
                    else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
                    else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

                    return (
                      <button
                        key={thread._id}
                        onClick={() => handleThreadClick(thread)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-150 mb-1 group",
                          activeThread?._id === thread._id && "bg-white/15 hover:bg-white/15"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <Hash className={cn(
                            "w-4 h-4 mt-0.5 flex-shrink-0 transition-colors",
                            activeThread?._id === thread._id ? "text-white/90" : "text-white/40 group-hover:text-white/60"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={cn(
                                "text-sm font-medium truncate transition-colors",
                                activeThread?._id === thread._id ? "text-white" : "text-white/90 group-hover:text-white"
                              )}>
                                {thread.title}
                              </span>
                              {thread.isTemplate && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-medium bg-blue-500/20 text-blue-200 border-0">
                                  Template
                                </Badge>
                              )}
                            </div>
                            {thread.description && (
                              <p className="text-[11px] text-white/50 truncate leading-tight">
                                {thread.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-white/40 flex-shrink-0 mt-0.5">
                            {timeAgo}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col bg-white">
            {/* Thread Header */}
            {activeThread && (
              <header className="h-[64px] px-6 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  {sidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={() => setSidebarCollapsed(false)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="font-semibold text-base text-gray-900">{activeThread.title}</h1>
                      {activeThread.isTemplate && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium bg-blue-50 text-blue-600 border-blue-200">
                          Template
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Created {new Date(activeThread.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      <span className="text-gray-300">•</span>
                      <span>Updated {new Date(activeThread.updatedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-8 hover:bg-gray-100">
                    <Star className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Star</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 hover:bg-gray-100"
                    onClick={handleShareThread}
                  >
                    <Users className="w-4 h-4 mr-1.5" />
                    <span className="text-sm">Share</span>
                  </Button>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={() => {
                      setRightPanelOpen(!rightPanelOpen);
                      setRightPanelMode('info');
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </header>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-6 py-4">
              {!activeThread ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Select a thread to start</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a thread from the sidebar or create a new report
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-3" />
                  <p className="font-medium mb-1">Ready to create financial reports</p>
                  <p className="text-xs">Start by describing what financial analysis you need</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message._id}
                      className={cn(
                        "flex gap-4 -mx-6 px-6",
                        message.role === 'assistant' && "bg-gray-50/70 py-6 rounded-lg mx-0"
                      )}
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-white shadow-sm">
                        {message.role === 'user' ? (
                          <>
                            <AvatarImage src={session?.user?.image || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                              {session?.user?.name?.[0] || 'U'}
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                              <Sparkles className="w-4 h-4" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-900">
                            {message.role === 'user' ? session?.user?.name : 'AssetWorks AI'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.metadata?.model && (
                            <Badge variant="secondary" className="text-[10px] h-5 font-medium bg-gray-100 text-gray-600 border-0">
                              {formatModelName(message.metadata.model)}
                            </Badge>
                          )}
                        </div>
                        {message.reportId ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <div className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: message.content }}
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                        {message.metadata?.cost && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Tokens:</span> {message.metadata.tokens?.total?.toLocaleString() || 0}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Cost:</span> ${message.metadata.cost.toFixed(4)}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Duration:</span> {message.metadata.duration}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Compose Bar */}
            {activeThread && (
              <div className="px-6 py-4 border-t">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="flex items-center gap-1 mb-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const currentValue = inputValue;
                                setInputValue(currentValue + '\n[Insert bar chart: revenue by quarter]');
                                inputRef.current?.focus();
                              }}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Insert Chart</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const currentValue = inputValue;
                                setInputValue(currentValue + '\n[Insert table: financial metrics]');
                                inputRef.current?.focus();
                              }}
                            >
                              <Table className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add Table</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const currentValue = inputValue;
                                setInputValue(currentValue + '\n[Insert pie chart: expense breakdown]');
                                inputRef.current?.focus();
                              }}
                            >
                              <PieChart className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pie Chart</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const currentValue = inputValue;
                                setInputValue(currentValue + '\n[Insert trend analysis: revenue growth]');
                                inputRef.current?.focus();
                              }}
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Trend Analysis</TooltipContent>
                        </Tooltip>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setShowCalculator(true);
                              }}
                            >
                              <Calculator className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Financial Calculator</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setShowDataImport(true);
                              }}
                            >
                              <Database className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Import Data</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                fileInputRef.current?.click();
                              }}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Upload CSV/Excel</TooltipContent>
                        </Tooltip>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setShowTemplates(true);
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Templates</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={handleExportReport}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export Report</TooltipContent>
                        </Tooltip>
                      </div>
                      <textarea
                        ref={inputRef}
                        placeholder={
                          editingContext?.type === 'edit'
                            ? `Edit "${editingContext.section?.title}"...`
                            : editingContext?.type === 'add'
                            ? 'Describe the new section you want to add...'
                            : 'Describe the financial report you want...'
                        }
                        className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.metaKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />

                      {/* AI Editing Suggestions - appears when editing/adding sections */}
                      {editingContext && (
                        <div className="mt-2">
                          <EditingContext
                            type={editingContext.type}
                            section={editingContext.section}
                            position={editingContext.position}
                            onCancel={() => {
                              console.log('❌ Cancel editing clicked');
                              setEditingContext(null);
                              setSelectedSectionId(null);
                              toast('Editing cancelled', { icon: '✖️' });
                            }}
                            onDone={() => {
                              console.log('✅ Done editing clicked');
                              setEditingContext(null);
                              setSelectedSectionId(null);
                              toast.success('Done editing!');
                            }}
                            onSuggestionClick={(suggestion) => {
                              console.log('💡 Suggestion clicked:', suggestion);
                              setInputValue(suggestion);
                              // Auto-submit the suggestion
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">
                            AI-powered financial analysis
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="text-xs bg-muted px-2 py-1 rounded">⌘ Enter</kbd>
                          <Button
                            size="sm"
                            disabled={!inputValue.trim()}
                            onClick={handleSendMessage}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Panel */}
          {rightPanelOpen && (
            <aside className="w-[480px] bg-background border-l flex flex-col">
              <header className="h-[60px] px-4 flex items-center justify-between border-b">
                <h2 className="font-semibold">
                  {rightPanelMode === 'info' && 'Thread Details'}
                  {rightPanelMode === 'report' && 'Financial Report'}
                  {rightPanelMode === 'settings' && 'AI Settings'}
                  {rightPanelMode === 'activity' && 'Activity'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </header>

              {rightPanelMode === 'report' ? (
                <ReportDisplay
                  threadId={activeThread?._id}
                  messages={messages}
                  onClose={() => setRightPanelOpen(false)}
                  // Interactive section props
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  editingContext={editingContext}
                  sectionPreviewContent={sectionPreviewContent}
                  sectionStreamingState={sectionStreamingState}
                  collapsedSections={collapsedSections}
                  // Handlers
                  onSectionSelect={handleSectionSelect}
                  onSectionEdit={handleSectionEdit}
                  onSectionAdd={handleSectionAdd}
                  onSectionDelete={handleSectionDelete}
                  onSectionDuplicate={handleSectionDuplicate}
                  onSectionMove={handleSectionMove}
                  onSectionCollapse={handleSectionCollapse}
                  onCancelEdit={() => {
                    console.log('❌ Cancel editing clicked (from section toolbar)');
                    setEditingContext(null);
                    setSelectedSectionId(null);
                    toast('Editing cancelled', { icon: '✖️' });
                  }}
                />
              ) : (
                <ScrollArea className="flex-1 p-4">
                  {rightPanelMode === 'info' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">About this thread</h3>
                        <p className="text-sm text-muted-foreground">
                          Financial analysis and reporting thread
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-medium mb-2">Created by</h3>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session?.user?.image || ''} />
                            <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                            <p className="text-xs text-muted-foreground">2 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              )}
            </aside>
          )}
        </div>

        {/* Hidden file input for CSV/Excel upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Financial Calculator Modal */}
        <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Financial Calculator</DialogTitle>
              <DialogDescription>
                Perform quick financial calculations for your reports
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
                  <Button
                    key={btn}
                    variant={['÷', '×', '-', '+', '='].includes(btn) ? 'default' : 'outline'}
                    className="h-12"
                    onClick={() => toast.info(`Calculator: ${btn}`)}
                  >
                    {btn}
                  </Button>
                ))}
              </div>
              <div className="pt-2">
                <Input placeholder="0" className="text-right text-2xl" readOnly />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Data Import Modal */}
        <Dialog open={showDataImport} onOpenChange={setShowDataImport}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Financial Data</DialogTitle>
              <DialogDescription>
                Connect to data sources or import files to analyze
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Database className="w-8 h-8" />
                  <span>Connect Database</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-8 h-8" />
                  <span>Upload CSV/Excel</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Templates Modal - NEW */}
        <Dialog open={showTemplates} onOpenChange={(open) => {
          setShowTemplates(open);
          if (!open) {
            // Clean up when closing
            setSelectedTemplate(null);
            setShowTemplateDetail(false);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Report Templates</DialogTitle>
              <DialogDescription>
                Browse and preview professional report templates. Click any template to see details.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] pr-4">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-2">No templates available</p>
                  <p className="text-sm text-muted-foreground/70">
                    Templates will appear here once they're created
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template: ITemplate) => (
                    <TemplateCard
                      key={template._id}
                      template={template}
                      onPreview={handleTemplatePreview}
                      onUse={handleTemplateUse}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Template Detail Dialog - NEW */}
        <TemplateDetailDialog
          template={selectedTemplate}
          open={showTemplateDetail}
          onClose={() => {
            setShowTemplateDetail(false);
            setSelectedTemplate(null);
          }}
          onUse={handleTemplateUse}
          isLoading={isCreatingFromTemplate}
        />

        {/* Streaming Progress Indicator */}
        <StreamingProgress
          isGenerating={isSending}
          currentStage={streamingStage}
          progress={streamingProgress}
          error={streamingError}
          tokens={streamingTokens}
          provider="anthropic"
          model="claude-3-5-sonnet"
        />
      </div>
    </TooltipProvider>
  );
}