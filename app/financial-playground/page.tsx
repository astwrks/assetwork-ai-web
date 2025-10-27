'use client';

/**
 * Financial Playground v3 - Clean Modern Design
 * Slack-inspired layout with Framer/Wix aesthetics
 * Real-time token streaming and system prompt visibility
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
  X,
  Trash2,
  Search,
  StopCircle,
  Zap,
  Activity,
  Bell,
  Copy,
  ChevronDown,
  Eye,
  RefreshCw,
  Info,
  BookOpen,
  Hash,
  Building,
  Menu,
  Bot,
  User,
  Code,
  Database,
  Shield,
  Gauge,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useWebSocket, useThreadWebSocket, WSEvents, ConnectionStatus } from '@/lib/websocket/client';
import { EnhancedThreadList } from '@/components/financial-playground/EnhancedThreadList';
import { ThreadListSkeleton } from '@/components/financial-playground/ThreadSkeleton';
import { ProgressiveLoader, useProgressiveLoader } from '@/components/ui/progressive-loader';
import { MessageList } from './components/MessageList';
import { EntityBar } from './components/EntityBar';
import { ReportSection, ReportSectionsContainer, type ReportSectionData } from './components/ReportSection';
import { AISuggestions } from './components/AISuggestions';
import { ReportUsage } from './components/ReportUsage';
import { TemplatesPanel } from './components/TemplatesPanel';
import { ReportEditor } from './components/ReportEditor';
import { ThreadSummary } from './components/ThreadSummary';
import { PlaygroundSettings } from './components/PlaygroundSettings';
import { CollapsibleSection } from './components/CollapsibleSection';
import InteractiveSection from '@/components/financial-playground/InteractiveSection';
import { EditSidebar } from './components/EditSidebar';
import ContextDetailsModal from '@/components/financial-playground/ContextDetailsModal';

// Dynamic import for ReportGenerator to reduce initial bundle size
const ReportGenerator = dynamic(() => import('./components/ReportGenerator').then(mod => ({ default: mod.ReportGenerator })), {
  loading: () => (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="inline-block px-4 py-3 rounded-2xl bg-muted">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Initializing report generator...</span>
          </div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});
import type {
  Report,
  Entity,
  SystemPrompt,
  Message,
  SystemPromptWithIcon,
  WSMessageCreatedEvent,
  WSThreadUpdatedEvent,
  WSEntityExtractedEvent,
} from './components/types';
import ErrorBoundary from '@/components/error-boundary';

// Additional local types (most types are imported from ./components/types)
interface Thread {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isBookmarked?: boolean;
  customName?: string;
  lastMessage?: {
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
  };
}

// Main Component
function FinancialPlayground() {
  // Session and routing
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // System Prompts
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptWithIcon[]>([]);

  // System prompt state
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPromptWithIcon | null>(null);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');

  // Entity state
  const [reportEntities, setReportEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Section state for animated loading
  const [reportSections, setReportSections] = useState<ReportSectionData[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Interactive section editing state
  const [interactiveSections, setInteractiveSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [sectionPreviewContent, setSectionPreviewContent] = useState<Record<string, string>>({});
  const [sectionStreamingState, setSectionStreamingState] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Report usage state
  const [reportUsage, setReportUsage] = useState<{totalTokens: number; totalCost: number; model: string} | null>(null);

  // Report view mode state
  const [reportViewMode, setReportViewMode] = useState<'preview' | 'edit'>('preview');

  // UI state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [contextMarkdown, setContextMarkdown] = useState('');
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  // Close sidebar by default when loading a specific thread URL
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !searchParams.get('thread'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(true);
  const [generationMode, setGenerationMode] = useState<'manual' | 'auto'>('manual');
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Context modal state
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [contextEntityType, setContextEntityType] = useState<'thread' | 'report'>('thread');
  const [contextEntityId, setContextEntityId] = useState<string>('');
  const [contextTokenCount, setContextTokenCount] = useState<number>(0);

  // Thread state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingCurrentThread, setIsLoadingCurrentThread] = useState(false);

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  // Report state
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [pendingReportGeneration, setPendingReportGeneration] = useState<{
    threadId: string;
    prompt: string;
    model: string;
    systemPrompt?: SystemPromptWithIcon | null;
  } | null>(null);

  // WebSocket connection
  const { isConnected, on, off } = useWebSocket();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper functions for managing messages
  const loadThread = async (threadId: string) => {
    setIsLoadingCurrentThread(true);
    try {
      const response = await fetch(`/api/v2/threads/${threadId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentThread(data.thread);
        setMessages(data.messages || []);
        return data;
      }
    } catch (error) {
      console.error('Failed to load thread:', error);
      toast.error('Failed to load conversation');
    } finally {
      setIsLoadingCurrentThread(false);
    }
    return null;
  };

  const loadMoreMessages = async () => {
    if (!currentThread || isLoadingMoreMessages) return;

    setIsLoadingMoreMessages(true);
    try {
      const oldestMessage = messages[0];
      const response = await fetch(`/api/v2/threads/${currentThread.id}/messages?before=${oldestMessage?.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...data.messages, ...messages]);
        setHasMoreMessages(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage;
    if (!messageContent.trim()) return;

    console.log('[FinancialPlayground] sendMessage called:', {
      messagePreview: messageContent.substring(0, 50) + '...',
      hasCurrentThread: !!currentThread,
      currentThreadId: currentThread?.id,
    });

    // Create or use existing thread
    let threadId = currentThread?.id;
    if (!threadId) {
      console.log('[FinancialPlayground] No current thread, creating new thread...');
      const newThread = await createNewThread();
      if (!newThread) {
        console.error('[FinancialPlayground] Failed to create new thread');
        return;
      }
      threadId = newThread.id;
      console.log('[FinancialPlayground] New thread created:', threadId);
    }

    // Create user message
    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      threadId: threadId,
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    console.log('[FinancialPlayground] Adding user message to state:', tempId);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      // Save user message to database
      console.log('[FinancialPlayground] Saving message to database...');
      const response = await fetch('/api/v2/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          threadId: threadId,
          role: 'user',
          content: messageContent,
        }),
      });

      if (response.ok) {
        const { data: savedMessage } = await response.json();
        console.log('[FinancialPlayground] Message saved successfully:', savedMessage.id);

        // Update message with saved ID
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMessage.id, status: 'sent' } : m
        ));

        // Generate AI chat response first
        await generateChatResponse(messageContent, threadId);

        // Then trigger report generation based on mode
        if (generationMode === 'auto') {
          console.log('[FinancialPlayground] Auto-generating report...');
          setReportSections([]); // Clear previous sections
          setIsGeneratingReport(true); // Start generating animation
          setPendingReportGeneration({
            threadId,
            prompt: messageContent,
            model: selectedModel,
            systemPrompt: selectedPrompt,
          });
        } else {
          // Manual mode: just mark that there are new messages
          console.log('[FinancialPlayground] Manual mode - marking new messages available');
          setHasNewMessages(true);
        }
      } else {
        throw new Error('Failed to save message');
      }
    } catch (error) {
      console.error('[FinancialPlayground] Error sending message:', error);
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));
      toast.error('Failed to send message');
    }
  };

  const generateChatResponse = async (userMessage: string, threadId: string) => {
    const tempAssistantId = `temp-assistant-${Date.now()}`;

    try {
      // Add temporary assistant message with loading state
      const assistantMessage: Message = {
        id: tempAssistantId,
        threadId,
        role: 'assistant',
        content: 'Analyzing your question...',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Build conversation history
      const conversationHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-5) // Last 5 messages for context
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Call AI stream endpoint for chat response
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: conversationHistory,
          model: selectedModel,
          systemPrompt: `You are a knowledgeable financial analyst assistant. Provide clear, concise, and actionable insights about financial topics, stocks, investments, and market analysis.

When analyzing stocks or investment opportunities:
- Provide key metrics and fundamentals
- Discuss risks and opportunities
- Give balanced perspectives
- Be specific with data when available
- Keep responses conversational but professional

Important: Provide text-only responses without any HTML or formatting tags. After your analysis, mention that a detailed report is being generated if applicable.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  // Strip HTML tags if present
                  let textContent = data.content;
                  if (textContent.includes('<') && textContent.includes('>')) {
                    textContent = textContent.replace(/<[^>]*>/g, '');
                    textContent = textContent.replace(/style="[^"]*"/g, '');
                  }

                  accumulatedContent += textContent;
                  // Update the assistant message with accumulated content
                  setMessages(prev => prev.map(m =>
                    m.id === tempAssistantId
                      ? { ...m, content: accumulatedContent, status: 'streaming' }
                      : m
                  ));
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }
      }

      // If no content was accumulated, provide a fallback response
      if (!accumulatedContent || accumulatedContent.trim().length === 0) {
        accumulatedContent = `I'm analyzing your question: "${userMessage}"

I'll provide you with comprehensive financial insights and analysis. Key factors to consider include:

• Market fundamentals and current conditions
• Company performance metrics and financials
• Risk assessment and opportunities
• Industry trends and competitive positioning

A detailed report is being generated with in-depth analysis. Click "Generate Report" to view the comprehensive analysis in the report panel.`;
      }

      // Save the complete assistant message to database
      const msgResponse = await fetch('/api/v2/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          threadId,
          role: 'assistant',
          content: accumulatedContent,
        }),
      });

      if (msgResponse.ok) {
        const { data: savedMessage } = await msgResponse.json();
        // Update with real ID and mark as sent
        setMessages(prev => prev.map(m =>
          m.id === tempAssistantId
            ? { ...m, id: savedMessage.id, content: accumulatedContent, status: 'sent' }
            : m
        ));
      } else {
        // Still show the message even if saving failed
        setMessages(prev => prev.map(m =>
          m.id === tempAssistantId
            ? { ...m, content: accumulatedContent, status: 'sent' }
            : m
        ));
      }

    } catch (error) {
      console.error('[FinancialPlayground] Error generating chat response:', error);
      // Provide a fallback response instead of removing the message
      const fallbackContent = `I understand you're asking about "${userMessage}". While I'm having trouble connecting to the AI service right now, I can tell you that investment decisions should be based on thorough analysis of company fundamentals, market conditions, and your personal financial goals.

Please click "Generate Report" to get a detailed analysis, or try sending your message again.`;

      setMessages(prev => prev.map(m =>
        m.id === tempAssistantId
          ? { ...m, content: fallbackContent, status: 'sent' }
          : m
      ));
    }
  };

  const retrySendMessage = async (message: Message) => {
    setMessages(prev => prev.filter(m => m.id !== message.id));
    setInputMessage(message.content);
    await sendMessage(message.content);
  };

  // Load threads on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadThreads();
    }
  }, [status]);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load system prompts on mount
  useEffect(() => {
    const loadSystemPrompts = async () => {
      try {
        const response = await fetch('/api/v2/prompts');
        if (response.ok) {
          const data = await response.json();
          const promptsWithIcons: SystemPromptWithIcon[] = data.map((prompt: SystemPrompt & { icon?: string }) => {
            let icon = Bot;
            if (prompt.icon === 'Database') icon = Database;
            if (prompt.icon === 'Search') icon = Search;
            if (prompt.icon === 'Shield') icon = Shield;
            return { ...prompt, icon };
          });
          setSystemPrompts(promptsWithIcons);
          setSelectedPrompt(promptsWithIcons[0]);
        }
      } catch (error) {
        console.error('Failed to load system prompts:', error);
        toast.error('Failed to load system prompts');
      }
    };

    loadSystemPrompts();
  }, []);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    if (!session || isLoadingThreads) return;

    const threadId = searchParams.get('thread');
    if (threadId) {
      // If there's a thread ID in the URL, load it if it's different from current
      if (currentThread?.id !== threadId) {
        loadThread(threadId).then(async (data) => {
          if (data) {
            setCurrentThread(data.thread);
            // Map report content to htmlContent for consistency
            if (data.report) {
              const report = {
                ...data.report,
                htmlContent: data.report.content || data.report.htmlContent, // API returns 'content', not 'htmlContent'
              };
              setCurrentReport(report);
              if (data.report.entities) {
                setReportEntities(data.report.entities);
              }

              // Fetch interactive sections for edit mode
              if (report.id) {
                await fetchReportSections(report.id);
              }
            } else {
              setCurrentReport(null);
            }
          }
        });
      }
    } else {
      // If no thread ID in URL, load the latest thread
      if (threads.length > 0 && !currentThread) {
        // Auto-load the most recent thread
        const latestThread = threads[0]; // Threads are sorted by updatedAt desc
        console.log('[FinancialPlayground] Auto-loading latest thread:', latestThread.id);

        // Update URL with latest thread ID
        const params = new URLSearchParams(searchParams.toString());
        params.set('thread', latestThread.id);
        router.push(`/financial-playground?${params.toString()}`);

        // Load the thread
        loadThread(latestThread.id);
      } else if (threads.length === 0 && currentThread) {
        // Clear if no threads exist
        setCurrentThread(null);
        setMessages([]);
        setCurrentReport(null);
      }
    }
  }, [searchParams, session, isLoadingThreads, currentThread, threads, loadThread, setMessages, router]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debug: Log when pendingReportGeneration changes
  useEffect(() => {
    if (pendingReportGeneration) {
      console.log('[FinancialPlayground] pendingReportGeneration state updated:', {
        threadId: pendingReportGeneration.threadId,
        prompt: pendingReportGeneration.prompt.substring(0, 50) + '...',
        model: pendingReportGeneration.model,
        systemPromptName: pendingReportGeneration.systemPrompt?.name,
      });
    } else {
      console.log('[FinancialPlayground] pendingReportGeneration cleared');
    }
  }, [pendingReportGeneration]);

  // WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for real-time message updates
    const handleMessageCreated = (data: WSMessageCreatedEvent) => {
      // Only add message if it's not already in the list and from another source
      setMessages(prev => {
        if (prev.some(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    };

    // Listen for thread updates
    const handleThreadUpdated = (data: WSThreadUpdatedEvent) => {
      if (data.threadId === currentThread?.id) {
        setCurrentThread(prev => prev ? { ...prev, ...data.changes } : null);
      }
      // Update in threads list
      setThreads(prev => prev.map(t =>
        t.id === data.threadId ? { ...t, ...data.changes } : t
      ));
    };

    // Listen for entity updates
    const handleEntityExtracted = (data: WSEntityExtractedEvent) => {
      if (data.reportId === currentReport?.id) {
        setReportEntities(prev => [...prev, ...data.entities]);
      }
    };

    on('message:created', handleMessageCreated);
    on('thread:updated', handleThreadUpdated);
    on('entity:extracted', handleEntityExtracted);

    return () => {
      off('message:created', handleMessageCreated);
      off('thread:updated', handleThreadUpdated);
      off('entity:extracted', handleEntityExtracted);
    };
  }, [isConnected, currentThread, currentReport, on, off, setMessages]);

  // API calls
  const loadThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const response = await fetch('/api/v2/threads', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.data || []);
        return data.data || [];
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingThreads(false);
    }
    return [];
  };

  // Thread management handlers
  const handleThreadUpdate = (updatedThread: Thread) => {
    setThreads(prev => prev.map(t => t.id === updatedThread.id ? updatedThread : t));
    if (currentThread?.id === updatedThread.id) {
      setCurrentThread(updatedThread);
    }
  };

  const handleThreadDelete = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (currentThread?.id === threadId) {
      setCurrentThread(null);
      setMessages([]);
      setCurrentReport(null);

      // Clear thread from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('thread');
      const newUrl = params.toString() ? `/financial-playground?${params.toString()}` : '/financial-playground';
      router.push(newUrl);
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    // Update URL with thread ID
    const params = new URLSearchParams(searchParams.toString());
    params.set('thread', thread.id);
    router.push(`/financial-playground?${params.toString()}`);
    loadThread(thread.id);
    setIsMobileMenuOpen(false);
  };

  // Report generation handlers
  const handleReportComplete = async (report: Report) => {
    try {
      setIsGeneratingReport(false);

      // Save report to database
      const response = await fetch('/api/v2/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          threadId: currentThread?.id,
          title: `Report: ${currentThread?.title || 'Financial Analysis'}`,
          description: pendingReportGeneration?.prompt?.substring(0, 200) || '',
          htmlContent: report.htmlContent || report.content,
          sections: report.sections || reportSections,
          metadata: {
            ...report.metadata,
            model: pendingReportGeneration?.model,
            systemPrompt: pendingReportGeneration?.systemPrompt?.name,
          }
        })
      });

      if (response.ok) {
        const { data: savedReport } = await response.json();
        console.log('[FinancialPlayground] Report saved successfully:', savedReport.id);

        // Update state with saved report
        setCurrentReport({
          ...savedReport,
          htmlContent: savedReport.htmlContent,
        });
        setPendingReportGeneration(null);
        setHasNewMessages(false); // Clear new messages flag
        setIsReportPanelOpen(true); // Auto-open report panel

        if (report.entities) {
          setReportEntities(report.entities);
        }

        // NEW: Fetch interactive sections for editing
        if (savedReport.id) {
          await fetchReportSections(savedReport.id);
          await fetchReportUsage(savedReport.id);
        }

        toast.success('Report generated and saved successfully');
      } else {
        console.error('[FinancialPlayground] Failed to save report');
        toast.error('Report generated but failed to save');
        // Still show the report even if saving failed
        setCurrentReport(report);
        setPendingReportGeneration(null);
        setIsReportPanelOpen(true);
      }
    } catch (error) {
      console.error('[FinancialPlayground] Error saving report:', error);
      toast.error('Failed to save report');
      // Still show the report even if saving failed
      setCurrentReport(report);
      setPendingReportGeneration(null);
      if (report.entities) {
        setReportEntities(report.entities);
      }
    }
  };

  // Section management functions
  const fetchReportSections = async (reportId: string) => {
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections`);
      if (!response.ok) return;

      const data = await response.json();
      setInteractiveSections(data.sections || []);

      if (data.isInteractiveMode) {
        console.log('[Section Editing] Interactive mode enabled, sections loaded:', data.sections.length);
      }
    } catch (error) {
      console.error('[Section Editing] Failed to fetch sections:', error);
    }
  };

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
      console.error('[Section Editing] Edit error:', error);
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
      console.error('[Section Editing] Delete error:', error);
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
      console.error('[Section Editing] Duplicate error:', error);
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
      console.error('[Section Editing] Move error:', error);
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

  const handleShowContext = (entityType: 'thread' | 'report', entityId: string, tokenCount?: number) => {
    setContextEntityType(entityType);
    setContextEntityId(entityId);
    setContextTokenCount(tokenCount || 0);
    setContextModalOpen(true);
  };

  const fetchReportUsage = async (reportId: string) => {
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/usage`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Usage API error:', response.status);
        return;
      }

      const data = await response.json();
      const usage = data.usage || data;

      if (usage && typeof usage.totalTokens !== 'undefined') {
        setReportUsage({
          totalTokens: usage.totalTokens || 0,
          totalCost: usage.totalCost || 0,
          model: usage.model || 'Unknown'
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const handleEntityExtracted = (entity: Entity) => {
    setReportEntities(prev => [...prev, entity]);
  };

  const handleReportCancel = () => {
    console.log('[FinancialPlayground] Cancelling report generation...');

    // Abort the fetch request if it's ongoing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear pending state and sections
    setPendingReportGeneration(null);
    setIsGeneratingReport(false);
    setReportSections([]);
    
    toast.success('Report generation cancelled');
  };

  // Message action handlers
  const handleMessageEdit = (message: Message) => {
    // For now, set the message content in input for editing
    setInputMessage(message.content.replace(/<[^>]*>/g, '')); // Strip HTML
    // TODO: Could implement in-place editing in future
  };

  const handleMessageDelete = async (message: Message) => {
    try {
      const response = await fetch(`/api/v2/messages/${message.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== message.id));
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleMessageCopy = (message: Message) => {
    // Copy is handled internally by MessageList component
    // This is just for tracking/analytics if needed
  };

  const handleMessageRegenerate = async (message: Message) => {
    // Find the previous user message
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const previousMessage = messages[messageIndex - 1];
      if (previousMessage.role === 'user') {
        // Remove the assistant message and regenerate
        setMessages(prev => prev.filter(m => m.id !== message.id));

        // Trigger new report generation
        setPendingReportGeneration({
          threadId: message.threadId,
          prompt: previousMessage.content,
          model: selectedModel,
          systemPrompt: selectedPrompt,
        });
      }
    }
  };

  const createNewThread = async () => {
    try {
      console.log('[FinancialPlayground] Creating new thread...');
      const response = await fetch('/api/v2/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'New Financial Report',
          description: `Created with ${selectedPrompt?.name} prompt`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newThread = data.data;
        console.log('[FinancialPlayground] Thread created successfully:', newThread.id);

        setThreads([newThread, ...threads]);
        setCurrentThread(newThread);
        setMessages([]);
        setCurrentReport(null);

        // Update URL with new thread ID
        const params = new URLSearchParams(searchParams.toString());
        params.set('thread', newThread.id);
        const newUrl = `/financial-playground?${params.toString()}`;
        console.log('[FinancialPlayground] Updating URL to:', newUrl);
        router.push(newUrl);

        toast.success('New conversation created');
        inputRef.current?.focus();
        return newThread; // Return the created thread
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FinancialPlayground] Failed to create thread:', response.status, errorData);
      }
      return null;
    } catch (error) {
      console.error('[FinancialPlayground] Error creating thread:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  };

  const exportPDF = async () => {
    if (!currentReport) {
      toast.error('No report to export');
      return;
    }

    try {
      const toastId = toast.loading('Generating PDF...');

      const response = await fetch(`/api/v2/reports/${currentReport.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          format: 'pdf',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${currentReport.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF exported successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const shareReport = async () => {
    if (!currentReport) return;

    try {
      const response = await fetch(`/api/v2/reports/${currentReport.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          expiresIn: '7d',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.data.shareUrl);
        toast.success('Share link copied to clipboard');
        setShowShareDialog(false);
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  // Export thread context as markdown
  const exportThreadContext = async (format: 'markdown' | 'json' = 'markdown') => {
    if (!currentThread || messages.length === 0) {
      toast.error('No conversation to export');
      return;
    }

    try {
      let content = '';
      const timestamp = new Date().toLocaleString();

      if (format === 'markdown') {
        // Generate markdown
        content = `# ${currentThread.title}\n\n`;
        content += `**Created:** ${new Date(currentThread.createdAt).toLocaleString()}\n`;
        content += `**System Prompt:** ${selectedPrompt?.name}\n`;
        content += `**Model:** ${selectedModel}\n\n`;
        content += `---\n\n`;
        content += `## Conversation\n\n`;

        messages.forEach(msg => {
          const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          const time = new Date(msg.createdAt).toLocaleTimeString();
          content += `### ${role} (${time})\n\n`;

          // Remove HTML tags for markdown export
          const plainText = msg.content.replace(/<[^>]*>/g, '');
          content += `${plainText}\n\n`;

          if (msg.metadata) {
            if (msg.metadata.tokens) {
              content += `*Tokens: ${msg.metadata.tokens}*\n`;
            }
            if (msg.metadata.cost) {
              content += `*Cost: $${msg.metadata.cost.toFixed(4)}*\n`;
            }
            content += '\n';
          }
        });

        // Add entities if present
        if (reportEntities.length > 0) {
          content += `---\n\n`;
          content += `## Extracted Entities\n\n`;
          reportEntities.forEach(entity => {
            content += `- **${entity.name}**`;
            if (entity.ticker) content += ` (${entity.ticker})`;
            content += ` - ${entity.type}`;
            if (entity.sentiment) {
              content += ` | Sentiment: ${(entity.sentiment * 100).toFixed(0)}%`;
            }
            content += '\n';
          });
        }

        content += `\n---\n*Exported from AssetWorks Financial Playground on ${timestamp}*\n`;
      } else {
        // Generate JSON
        const exportData = {
          thread: currentThread,
          messages: messages,
          entities: reportEntities,
          report: currentReport,
          metadata: {
            systemPrompt: selectedPrompt,
            model: selectedModel,
            exportedAt: timestamp,
          },
        };
        content = JSON.stringify(exportData, null, 2);
      }

      // Create download
      const blob = new Blob([content], {
        type: format === 'markdown' ? 'text/markdown' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentThread.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${format === 'markdown' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Thread exported as ${format}`, { duration: 3000 });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export thread');
    }
  };

  // Fetch context for thread or report
  const fetchContext = async (type: 'thread' | 'report') => {
    if (!currentThread && type === 'thread') {
      toast.error('No thread selected');
      return;
    }
    if (!currentReport && type === 'report') {
      toast.error('No report available');
      return;
    }

    setIsLoadingContext(true);
    try {
      const endpoint = type === 'thread'
        ? `/api/playground/threads/${currentThread?.id}/context-markdown`
        : `/api/playground/reports/${currentReport?.id}/context-markdown`;

      const response = await fetch(endpoint, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setContextMarkdown(data.markdown || data.content || 'No context available');
        setShowContextDialog(true);
      } else {
        toast.error('Failed to fetch context');
      }
    } catch (error) {
      console.error('Failed to fetch context:', error);
      toast.error('Failed to fetch context');
    } finally {
      setIsLoadingContext(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading playground...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Modern Header */}
        <header className="h-14 border-b bg-background px-4 flex items-center justify-between z-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold hidden sm:block">Financial Playground</h1>
            </div>

            {/* Current Thread */}
            {currentThread && (
              <Badge variant="secondary" className="hidden lg:flex">
                {currentThread.title}
              </Badge>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* WebSocket Status Indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{isConnected ? 'Real-time updates connected' : 'Connecting...'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Token Counter - removed as it's now handled by ReportGenerator */}

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsDialog(true)}
              title="Playground Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!currentThread || messages.length === 0}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[100]">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportThreadContext('markdown')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportThreadContext('json')}>
                  <Code className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportPDF} disabled={!currentReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fetchContext('thread')} disabled={!currentThread}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Thread Context
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fetchContext('report')} disabled={!currentReport}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Report Context
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShareDialog(true)}
              disabled={!currentReport}
            >
              <Share2 className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <aside className={cn(
            "border-r bg-muted/30 flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden",
            isSidebarOpen ? "w-80 max-w-[25vw] min-w-[280px] xl:min-w-[320px] lg:max-w-[30vw]" : "w-0 border-0",
            isMobileMenuOpen && "fixed inset-0 z-50 bg-background md:relative md:inset-auto"
          )}>
            {/* Sidebar Header */}
            <div className="h-14 border-b px-4 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Conversations</h2>
              <div className="flex items-center gap-1">
                {currentThread && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShowContext('thread', currentThread.id, 0)}
                    title="View Thread Context"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 flex flex-col">
              <EnhancedThreadList
                threads={threads}
                currentThreadId={currentThread?.id}
                isLoading={isLoadingThreads}
                onThreadSelect={handleThreadSelect}
                onThreadUpdate={handleThreadUpdate}
                onThreadDelete={handleThreadDelete}
                onNewThread={createNewThread}
                onShowContext={(threadId) => handleShowContext('thread', threadId, 0)}
              />
            </div>
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Simple Header Bar */}
            <div className="border-b px-4 py-3 bg-muted/20 flex-shrink-0 flex items-center justify-between">
              {/* Sidebar Toggle */}
              {!isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}

              <div className="flex-1" />

              {/* Report Panel Toggle */}
              {!isReportPanelOpen && currentReport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReportPanelOpen(true)}
                  className="h-8 gap-2 flex-shrink-0"
                >
                  <FileText className="w-3 h-3" />
                  Show Report
                  <ChevronLeft className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Report View with Entities */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Entity Bar */}
              <EntityBar
                entities={reportEntities}
                onEntityClick={setSelectedEntity}
              />

              {/* Messages/Report Area */}
              <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-4 md:p-8">
                  {hasMoreMessages && (
                    <div className="text-center mb-4">
                      <Button onClick={loadMoreMessages} disabled={isLoadingMoreMessages}>
                        {isLoadingMoreMessages ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                  {isLoadingCurrentThread ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center min-h-[60vh]"
                    >
                      <ProgressiveLoader
                        isLoading={isLoadingCurrentThread}
                        message="Loading thread..."
                        estimatedDuration={1000}
                        variant="default"
                        showElapsedTime={true}
                        showEstimatedTime={true}
                        className="max-w-md"
                      />
                    </motion.div>
                  ) : messages.length === 0 && !currentThread ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
                        <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Welcome to Financial Playground</h2>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Create intelligent financial reports with AI. Start by asking a question below.
                      </p>
                      <div className="flex flex-col gap-4">
                        <Button onClick={createNewThread} size="lg" variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Thread
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Or simply type a message below to start
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Message List Component */}
                      <MessageList
                        messages={messages}
                        isLoading={!!pendingReportGeneration}
                        onRetry={retrySendMessage}
                        onEdit={handleMessageEdit}
                        onDelete={handleMessageDelete}
                        onCopy={handleMessageCopy}
                        onRegenerate={handleMessageRegenerate}
                        showActions={true}
                      />

                      {/* Generate Report Button - Shows when in manual mode with new messages */}
                      {hasNewMessages && !pendingReportGeneration && messages.length > 0 && (
                        <div className="flex gap-2 p-4 mb-6 border rounded-lg bg-muted/30">
                          <Button
                            onClick={() => {
                              const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                              if (lastUserMessage) {
                                setReportSections([]); // Clear previous sections
                                setIsGeneratingReport(true); // Start generating animation
                                setPendingReportGeneration({
                                  threadId: currentThread?.id || '',
                                  prompt: lastUserMessage.content,
                                  model: selectedModel,
                                  systemPrompt: selectedPrompt,
                                });
                                setHasNewMessages(false);
                              }
                            }}
                            className="flex-1"
                            variant="default"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                          </Button>
                          {currentReport && (
                            <Button
                              onClick={() => {
                                toast.info('Add to Report feature coming soon!');
                              }}
                              variant="outline"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add to Report
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Report Generator Component */}
                      {pendingReportGeneration && (
                        <ReportGenerator
                          threadId={pendingReportGeneration.threadId}
                          prompt={pendingReportGeneration.prompt}
                          model={pendingReportGeneration.model}
                          systemPrompt={pendingReportGeneration.systemPrompt}
                          onReportComplete={handleReportComplete}
                          onEntityExtracted={handleEntityExtracted}
                          onCancel={handleReportCancel}
                          onSectionsUpdate={(sections) => {
                            // Transform sections to ReportSectionData format with animation states
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
                      )}

                      {/* Interactive Section Display */}
                      {!pendingReportGeneration && currentReport && interactiveSections.length > 0 && (
                        <div className="space-y-6 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-muted-foreground">
                              Interactive Sections ({interactiveSections.length})
                            </h2>
                            <Badge variant="secondary" className="text-xs">
                              Click any section to edit
                            </Badge>
                          </div>

                          {interactiveSections.map((section, index) => (
                            <InteractiveSection
                              key={section.id}
                              sectionId={section.id}
                              reportId={currentReport.id}
                              htmlContent={section.htmlContent}
                              title={section.title}
                              order={section.order}
                              isFirst={index === 0}
                              isLast={index === interactiveSections.length - 1}
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
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Thread Summary - Compact above input */}
              {currentThread && messages.length >= 2 && (
                <div className="border-t bg-muted/20 px-4 py-2">
                  <CollapsibleSection
                    title="Thread Summary"
                    icon={<Sparkles className="w-4 h-4" />}
                    defaultOpen={true}
                    compact={true}
                    className="bg-background/50 border-muted/50"
                    headerClassName="py-1.5"
                    contentClassName="pt-2"
                  >
                    <ThreadSummary
                      threadId={currentThread.id}
                      messages={messages}
                      autoGenerate={messages.length >= 3}
                      onSummaryGenerated={(summary) => {
                        console.log('Thread summary generated:', summary);
                      }}
                    />
                  </CollapsibleSection>
                </div>
              )}

              {/* Templates Section - Above Input */}
              <CollapsibleSection
                title="Quick Templates"
                icon={<FileText className="w-4 h-4" />}
                defaultOpen={false}
                compact={true}
                className="bg-background/50 border-t border-muted/50"
                headerClassName="py-1.5"
                contentClassName="pt-2"
              >
                <TemplatesPanel
                  currentPrompt={inputMessage}
                  currentSystemPrompt={selectedPrompt?.content}
                  onApplyTemplate={(template) => {
                    setInputMessage(template.content);
                    if (template.systemPrompt) {
                      console.log('Template system prompt:', template.systemPrompt);
                      toast.success(`Applied template: ${template.name}`);
                    }
                  }}
                />
              </CollapsibleSection>

              {/* Input Area */}
              <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                <div className="max-w-4xl mx-auto space-y-2">
                  {/* Compact Controls Bar Above Input */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {/* System Prompt Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-7 text-xs gap-1 flex-shrink-0">
                          {selectedPrompt && (
                            <selectedPrompt.icon className="w-3 h-3" />
                          )}
                          <span className="max-w-32 truncate">{selectedPrompt?.name || 'Select Prompt'}</span>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-72 z-[100]">
                        <DropdownMenuLabel>System Prompts</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {systemPrompts.map((prompt) => (
                          <DropdownMenuItem
                            key={prompt.id}
                            onClick={() => setSelectedPrompt(prompt)}
                            className="flex items-start gap-3 py-3"
                          >
                            <prompt.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{prompt.name}</div>
                              <div className="text-xs text-muted-foreground">{prompt.description}</div>
                            </div>
                            {selectedPrompt?.id === prompt.id && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Model Selector */}
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-7 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Generation Mode Switch */}
                    <div className="flex items-center gap-2 ml-auto">
                      <Label htmlFor="input-generation-mode" className="text-xs text-muted-foreground">
                        {generationMode === 'manual' ? 'AI Chat' : 'Analysis'}
                      </Label>
                      <Switch
                        id="input-generation-mode"
                        checked={generationMode === 'auto'}
                        onCheckedChange={(checked) => setGenerationMode(checked ? 'auto' : 'manual')}
                        className="h-4 w-7"
                      />
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputMessage)}
                      placeholder="Ask for financial insights..."
                      disabled={!!pendingReportGeneration}
                      className="flex-1"
                    />
                    {pendingReportGeneration ? (
                      <Button
                        onClick={handleReportCancel}
                        variant="destructive"
                        size="icon"
                        title="Stop generation"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => sendMessage(inputMessage)}
                        disabled={!inputMessage.trim()}
                        size="icon"
                        data-testid="send-button"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Report Panel - Shows Generated Reports */}
          <aside className={cn(
            "border-l bg-muted/30 flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden",
            isReportPanelOpen ? "w-[600px] max-w-[45vw] min-w-[350px] xl:min-w-[400px] lg:max-w-[50vw]" : "w-0 border-0"
          )}>
            <div className="h-14 border-b px-4 flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">Generated Report</h2>
                </div>
                {currentReport && interactiveSections.length > 0 && (
                  <div className="flex items-center gap-2 ml-2 px-2 py-1 rounded-md bg-muted/50">
                    <Label htmlFor="view-mode" className="text-xs text-muted-foreground cursor-pointer">
                      {reportViewMode === 'preview' ? 'Preview' : 'Edit'}
                    </Label>
                    <Switch
                      id="view-mode"
                      checked={reportViewMode === 'edit'}
                      onCheckedChange={(checked) => {
                        setReportViewMode(checked ? 'edit' : 'preview');
                        if (checked) {
                          // Auto-convert to interactive if not already
                          if (!interactiveSections.length) {
                            fetch(`/api/playground/reports/${currentReport.id}/convert-to-interactive`, {
                              method: 'POST',
                              credentials: 'include'
                            }).then(async (res) => {
                              if (res.ok) {
                                await fetchReportSections(currentReport.id);
                                toast.success('Report converted to edit mode');
                              }
                            });
                          }
                        }
                      }}
                      className="h-4 w-7 data-[state=checked]:bg-primary"
                    />
                  </div>
                )}
                {currentReport && currentReport.htmlContent && interactiveSections.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const response = await fetch(`/api/playground/reports/${currentReport.id}/convert-to-interactive`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      if (response.ok) {
                        await fetchReportSections(currentReport.id);
                        toast.success('Report converted to interactive mode');
                      } else {
                        toast.error('Failed to convert report');
                      }
                    }}
                    className="h-7 text-xs gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Enable Editing
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {currentReport && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShowContext('report', currentReport.id, reportUsage?.totalTokens || 0)}
                    title="View Report Context"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsReportPanelOpen(false)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Token and Cost Display - Real API Data */}
            {reportUsage && !isGeneratingReport && !pendingReportGeneration && (
              <div className="border-b px-4 py-2 bg-muted/20 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono">
                      {reportUsage.totalTokens.toLocaleString()} tokens
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-green-600 dark:text-green-400">
                      ${reportUsage.totalCost.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportUsage.model}
                </div>
              </div>
            )}

            {/* Entity Chips Display */}
            {reportEntities.length > 0 && (
              <div className="border-b px-4 py-3 bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Entities Mentioned ({reportEntities.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reportEntities.map((entity, index) => (
                    <Badge
                      key={entity.id || index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSelectedEntity(entity)}
                    >
                      {entity.name}
                      {entity.ticker && (
                        <span className="ml-1 opacity-70">({entity.ticker})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Metrics Only */}
            {currentReport && (
              <CollapsibleSection
                title="Usage Metrics"
                icon={<Activity className="w-4 h-4" />}
                defaultOpen={false}
                compact={true}
                className="border-b"
              >
                <ReportUsage reportId={currentReport.id} />
              </CollapsibleSection>
            )}

            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Display sections with animation if available, fallback to HTML */}
                {reportSections.length > 0 || isGeneratingReport ? (
                  <ReportSectionsContainer
                    sections={reportSections}
                    isGenerating={isGeneratingReport}
                  />
                ) : currentReport?.htmlContent ? (
                  currentReport.htmlContent.includes('<!DOCTYPE html>') ? (
                    <iframe
                      srcDoc={currentReport.htmlContent}
                      className="w-full min-h-[800px] border-0 rounded-lg bg-white"
                      sandbox="allow-scripts allow-same-origin"
                      title="Report"
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentReport.htmlContent }} />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground">No report generated yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        </div>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Report</DialogTitle>
              <DialogDescription>
                Generate a shareable link for this report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anyone with this link will be able to view the report for 7 days.
              </p>
              <Button onClick={shareReport} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog - Enhanced with PlaygroundSettings component */}
        <PlaygroundSettings
          isOpen={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
        />

        {/* Context View Dialog */}
        <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Context View</DialogTitle>
              <DialogDescription>
                Complete context being used by the AI model
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 mt-4">
              {isLoadingContext ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading context...</span>
                </div>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap p-4 bg-muted rounded-lg">
                  {contextMarkdown || 'No context available'}
                </pre>
              )}
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(contextMarkdown);
                  toast.success('Context copied to clipboard');
                }}
                disabled={!contextMarkdown}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button onClick={() => setShowContextDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        {/* Context Details Modal */}
        <ContextDetailsModal
          isOpen={contextModalOpen}
          onClose={() => setContextModalOpen(false)}
          entityType={contextEntityType}
          entityId={contextEntityId}
          currentTokens={contextTokenCount}
        />
      </div>
    </TooltipProvider>
  );
}

// Export wrapped with Error Boundary for enhanced error handling
export default function FinancialPlaygroundWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FinancialPlayground />
    </ErrorBoundary>
  );
}
