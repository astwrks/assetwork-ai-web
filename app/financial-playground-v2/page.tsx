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
  Database,
  Edit2,
  Trash2,
  Check
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
import ShareDialog from '@/components/financial-playground/ShareDialog';
import ReportMetricsTicker from '@/components/financial-playground/ReportMetricsTicker';
import MessageActions from '@/components/financial-playground/MessageActions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingThreadTitle, setEditingThreadTitle] = useState('');

  // Financial tool state
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDataImport, setShowDataImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);

  // Share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // System prompts / AI Mode state
  const [systemPrompts, setSystemPrompts] = useState<Array<{
    id: string;
    name: string;
    description: string;
  }>>([]);
  const [activeSystemPromptId, setActiveSystemPromptId] = useState<string>('web-report');

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
  const lastLoadedThreadRef = useRef<string | null>(null);
  const isUpdatingUrlRef = useRef(false);

  // Fetch threads with SWR
  const { data: threadsData, error: threadsError, mutate: mutateThreads } = useSWR(
    session?.user ? '/api/playground/threads?status=active' : null,
    fetcher,
    {
      refreshInterval: 0, // Disable auto-refresh to prevent flickering
      revalidateOnFocus: false,
    }
  );

  // Fetch messages for active thread
  const { data: messagesData, error: messagesError, mutate: mutateMessages } = useSWR(
    activeThread?._id ? `/api/playground/threads/${activeThread._id}/messages` : null,
    fetcher,
    {
      refreshInterval: 0, // Disable auto-refresh to prevent flickering
      revalidateOnFocus: false,
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
    if (threads.length === 0 || !session || isUpdatingUrlRef.current) return;

    const threadIdFromUrl = searchParams.get('thread');

    if (threadIdFromUrl) {
      // Skip if this thread is already loaded
      if (lastLoadedThreadRef.current === threadIdFromUrl) {
        return;
      }

      // Load thread from URL parameter
      const thread = threads.find(t => t._id === threadIdFromUrl);
      if (thread) {
        console.log('🔗 Loading thread from URL:', threadIdFromUrl);
        lastLoadedThreadRef.current = threadIdFromUrl;
        setActiveThread(thread);
        // Save to localStorage
        if (session?.user?.email) {
          localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, threadIdFromUrl);
        }
      }
    } else if (!activeThread && lastLoadedThreadRef.current === null) {
      // No URL parameter and no active thread - load last opened thread (only once)
      if (session?.user?.email) {
        const lastThreadId = localStorage.getItem(`playground_v2_last_thread_${session.user.email}`);
        if (lastThreadId) {
          const thread = threads.find(t => t._id === lastThreadId);
          if (thread) {
            console.log('💾 Restoring last thread from localStorage:', lastThreadId);
            lastLoadedThreadRef.current = lastThreadId;
            isUpdatingUrlRef.current = true;
            setActiveThread(thread);
            // Update URL without reload
            router.replace(`/financial-playground-v2?thread=${lastThreadId}`, { scroll: false });
            setTimeout(() => { isUpdatingUrlRef.current = false; }, 100);
          }
        }
      }
    }
  }, [threads, searchParams, session]);

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

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Thread creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        toast.error(`Failed to create thread: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('Thread creation response:', data);

      // Validate response structure
      if (!data.thread) {
        console.error('Invalid thread response - missing thread object:', data);
        toast.error('Failed to create thread - invalid server response');
        return null;
      }

      // Normalize thread ID (support both Prisma 'id' and MongoDB '_id')
      const threadId = data.thread.id || data.thread._id;
      if (!threadId || threadId === 'undefined' || threadId === 'null') {
        console.error('Invalid thread ID in response:', {
          threadId,
          hasId: !!data.thread.id,
          has_id: !!data.thread._id,
          thread: data.thread
        });
        toast.error('Failed to create thread - invalid thread ID');
        return null;
      }

      // Normalize the thread object to use _id for consistency
      const normalizedThread = { ...data.thread, _id: threadId };

      // Set refs to prevent infinite loop
      lastLoadedThreadRef.current = threadId;
      isUpdatingUrlRef.current = true;

      setActiveThread(normalizedThread);

      // Update URL to new thread
      router.replace(`/financial-playground-v2?thread=${threadId}`, { scroll: false });

      // Save to localStorage
      if (session?.user?.email) {
        localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, threadId);
      }

      // Reset URL update flag
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 100);

      mutateThreads();
      toast.success('New thread created!');
      return normalizedThread;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create thread');
      return null;
    }
  }, [mutateThreads, router, session]);

  const handleThreadClick = useCallback((thread: Thread) => {
    // Prevent re-loading the same thread
    if (lastLoadedThreadRef.current === thread._id) {
      console.log('🔄 Thread already loaded, skipping:', thread._id);
      return;
    }

    console.log('👆 Thread clicked:', thread._id);
    lastLoadedThreadRef.current = thread._id;
    isUpdatingUrlRef.current = true;
    
    setActiveThread(thread);
    
    // Update URL
    router.replace(`/financial-playground-v2?thread=${thread._id}`, { scroll: false });
    
    // Save to localStorage
    if (session?.user?.email) {
      localStorage.setItem(`playground_v2_last_thread_${session.user.email}`, thread._id);
    }
    
    // Reset the URL update flag after a short delay
    setTimeout(() => {
      isUpdatingUrlRef.current = false;
    }, 100);
    
    // Messages will be automatically fetched by SWR when activeThread changes
  }, [router, session]);

  const handleThreadDelete = useCallback(async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/playground/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete thread');

      // If we're deleting the active thread, clear it
      if (activeThread?._id === threadId) {
        lastLoadedThreadRef.current = null;
        isUpdatingUrlRef.current = true;
        setActiveThread(null);
        setSections([]);
        router.replace('/financial-playground-v2', { scroll: false });
        setTimeout(() => {
          isUpdatingUrlRef.current = false;
        }, 100);
      }

      // Refresh threads list
      mutateThreads();
      toast.success('Thread deleted');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread');
    }
  }, [activeThread, router, mutateThreads]);

  const handleThreadRename = useCallback(async (threadId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingThreadId(null);
      setEditingThreadTitle('');
      return;
    }

    try {
      const response = await fetch(`/api/playground/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) throw new Error('Failed to rename thread');

      // Update active thread if it's the one being renamed
      if (activeThread?._id === threadId) {
        setActiveThread({ ...activeThread, title: newTitle });
      }

      // Refresh threads list
      mutateThreads();
      setEditingThreadId(null);
      setEditingThreadTitle('');
      toast.success('Thread renamed');
    } catch (error) {
      console.error('Error renaming thread:', error);
      toast.error('Failed to rename thread');
    }
  }, [activeThread, mutateThreads]);

  const handleShareThread = useCallback(() => {
    if (!activeThread) {
      toast.error('No active thread to share');
      return;
    }
    setIsShareDialogOpen(true);
  }, [activeThread]);

  const handleExportPDF = async () => {
    // Find the latest report from messages
    const latestReportMessage = messages?.length
      ? [...messages].reverse().find((msg: any) => msg.role === 'assistant' && msg.reportId)
      : null;

    if (!latestReportMessage?.reportId) {
      toast.error('No report to export');
      return;
    }

    try {
      toast.loading('Generating branded PDF...');

      const response = await fetch(`/api/playground/reports/${latestReportMessage.reportId}/export-pdf`, {
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
        <header className="h-[38px] bg-[#001A3D] text-white flex items-center justify-between px-4 flex-shrink-0">
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
            "bg-[#001A3D] text-white flex flex-col transition-all duration-200 flex-shrink-0",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-[260px] border-r border-[#0066FF]/20"
          )}>
            {/* Workspace Header */}
            <div className="h-[50px] px-4 flex items-center justify-between border-b border-[#0066FF]/20">
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
                className="w-full justify-start h-8 px-2 bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
                size="sm"
                onClick={() => handleCreateNewThread()}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Report
              </Button>
            </div>

            <Separator className="bg-[#0066FF]/20" />

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

              <Separator className="my-2 bg-[#0066FF]/20" />

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
                      <div
                        key={thread._id}
                        className={cn(
                          "relative rounded-lg transition-all duration-150 mb-1 group",
                          activeThread?._id === thread._id && "bg-white/15"
                        )}
                      >
                        {editingThreadId === thread._id ? (
                          <div className="px-3 py-2">
                            <Input
                              value={editingThreadTitle}
                              onChange={(e) => setEditingThreadTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleThreadRename(thread._id, editingThreadTitle);
                                } else if (e.key === 'Escape') {
                                  setEditingThreadId(null);
                                  setEditingThreadTitle('');
                                }
                              }}
                              onBlur={() => {
                                if (editingThreadTitle.trim()) {
                                  handleThreadRename(thread._id, editingThreadTitle);
                                } else {
                                  setEditingThreadId(null);
                                  setEditingThreadTitle('');
                                }
                              }}
                              autoFocus
                              className="h-7 text-sm bg-white/20 border-white/30 text-white"
                            />
                            <div className="flex items-center gap-1 mt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1.5 text-xs text-white hover:bg-white/20"
                                onClick={() => handleThreadRename(thread._id, editingThreadTitle)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1.5 text-xs text-white hover:bg-white/20"
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
                              onClick={() => handleThreadClick(thread)}
                              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-150"
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
                                <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-medium bg-[#0066FF]/20 text-blue-200 border-0">
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
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/60 hover:bg-white/20 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingThreadId(thread._id);
                                  setEditingThreadTitle(thread.title);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-white/60 hover:bg-red-500 hover:text-white"
                                onClick={(e) => handleThreadDelete(thread._id, e)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className={cn(
            "flex flex-col bg-white transition-all duration-200",
            rightPanelOpen ? "w-[420px] flex-shrink-0" : "flex-1"
          )}>
            {/* Thread Header - Compact for narrow layout */}
            {activeThread && (
              <header className="h-[56px] px-4 flex items-center justify-between border-b bg-white">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {sidebarCollapsed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-gray-100 flex-shrink-0"
                      onClick={() => setSidebarCollapsed(false)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="font-semibold text-sm text-gray-900 truncate">{activeThread.title}</h1>
                      {activeThread.isTemplate && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-medium bg-blue-50 text-blue-600 border-blue-200 flex-shrink-0">
                          Template
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Actions Menu */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Thread actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Thread Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setRightPanelOpen(true);
                        setRightPanelMode('report');
                      }}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareThread}>
                        <Users className="w-4 h-4 mr-2" />
                        Share Thread
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF} disabled={!messages || messages.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/financial-playground-v2/settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4 py-4">
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
                        "flex gap-3 group",
                        message.role === 'assistant' && "bg-gray-50/70 py-4 px-3 rounded-lg"
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
                            <AvatarFallback className="bg-gradient-to-br from-[#0066FF] to-[#001A3D] text-white">
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
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">Financial Report Generated</p>
                              <p className="text-xs text-blue-600 mt-0.5">View report in the right panel →</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setRightPanelOpen(true);
                                setRightPanelMode('report');
                              }}
                            >
                              View Report
                            </Button>
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
                        {/* Message Actions - Copy, Feedback, Add to Report */}
                        <MessageActions
                          messageId={message._id}
                          content={message.content}
                          createdAt={message.createdAt}
                          threadId={activeThread?._id || ''}
                          role={message.role}
                          reportId={message.reportId}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Compose Bar */}
            {activeThread && (
              <div className="px-4 py-3 border-t bg-white">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="flex items-center gap-1 mb-2 flex-wrap">
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
                        
                        {/* Overflow Menu for Additional Tools */}
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Insert Elements</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Insert Elements</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setInputValue(inputValue + '\n[Insert bar chart: revenue by quarter]');
                                inputRef.current?.focus();
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Bar Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setInputValue(inputValue + '\n[Insert table: financial metrics]');
                                inputRef.current?.focus();
                              }}
                            >
                              <Table className="w-4 h-4 mr-2" />
                              Table
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setInputValue(inputValue + '\n[Insert pie chart: expense breakdown]');
                                inputRef.current?.focus();
                              }}
                            >
                              <PieChart className="w-4 h-4 mr-2" />
                              Pie Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setInputValue(inputValue + '\n[Insert trend analysis: revenue growth]');
                                inputRef.current?.focus();
                              }}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Trend Analysis
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowCalculator(true)}>
                              <Calculator className="w-4 h-4 mr-2" />
                              Financial Calculator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowDataImport(true)}>
                              <Database className="w-4 h-4 mr-2" />
                              Import Data
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPDF}>
                              <Download className="w-4 h-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        className="w-full min-h-[70px] max-h-[150px] p-2.5 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
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

                        {/* System Prompt Selector - Only show when not in edit mode */}
                        {!editingContext && systemPrompts.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-md">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-700 flex-shrink-0">AI:</span>
                            <Select value={activeSystemPromptId} onValueChange={switchSystemPrompt}>
                              <SelectTrigger className="flex-1 h-6 text-xs min-w-0 bg-white border-0">
                                <SelectValue placeholder="Select mode" />
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
                        )}

                        <div className="flex items-center justify-end mt-2 gap-2">
                          <kbd className="text-xs bg-muted px-2 py-0.5 rounded">⌘↵</kbd>
                          <Button
                            size="sm"
                            disabled={!inputValue.trim()}
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-1.5" />
                            Send
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Panel */}
          {rightPanelOpen && (
            <aside className="flex-1 bg-gray-50 border-l border-gray-200 flex flex-col min-w-0">
              <header className="h-[56px] px-6 flex items-center justify-between border-b bg-white">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-base">
                    {rightPanelMode === 'info' && 'Thread Details'}
                    {rightPanelMode === 'report' && 'Financial Report'}
                    {rightPanelMode === 'settings' && 'AI Settings'}
                    {rightPanelMode === 'activity' && 'Activity'}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-gray-100"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </header>

              {rightPanelMode === 'report' ? (
                <>
                  {/* Report Metrics Ticker at the top of right panel */}
                  {messages && messages.length > 0 && (() => {
                    const latestReportMessage = [...messages].reverse().find((msg: any) => msg.role === 'assistant' && msg.reportId);
                    return latestReportMessage?.reportId ? (
                      <ReportMetricsTicker reportId={latestReportMessage.reportId} />
                    ) : null;
                  })()}
                  
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
                </>
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

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          threadId={activeThread?._id}
          reportId={messages?.length ? [...messages].reverse().find((msg: any) => msg.role === 'assistant' && msg.reportId)?.reportId : undefined}
          userEmail={session?.user?.email}
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