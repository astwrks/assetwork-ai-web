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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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

  // UI state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        // Trigger report generation
        console.log('[FinancialPlayground] Setting pendingReportGeneration:', {
          threadId,
          prompt: messageContent.substring(0, 50) + '...',
          model: selectedModel,
          promptName: selectedPrompt?.name,
        });
        setPendingReportGeneration({
          threadId,
          prompt: messageContent,
          model: selectedModel,
          systemPrompt: selectedPrompt,
        });
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
        loadThread(threadId).then((data) => {
          if (data) {
            setCurrentThread(data.thread);
            setCurrentReport(data.report || null);
            if (data.report?.entities) {
              setReportEntities(data.report.entities);
            }
          }
        });
      }
    } else {
      // If no thread ID in URL, clear the current thread
      if (currentThread) {
        setCurrentThread(null);
        setMessages([]);
        setCurrentReport(null);
      }
    }
  }, [searchParams, session, isLoadingThreads, currentThread, loadThread, setMessages]);

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
  const handleReportComplete = (report: Report, message: Message) => {
    setCurrentReport(report);
    setMessages(prev => [...prev, message]);
    setPendingReportGeneration(null);
    if (report.entities) {
      setReportEntities(report.entities);
    }
  };

  const handleEntityExtracted = (entity: Entity) => {
    setReportEntities(prev => [...prev, entity]);
  };

  const handleReportCancel = () => {
    setPendingReportGeneration(null);
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
            "w-80 border-r bg-muted/30 flex-shrink-0 flex flex-col transition-all duration-300",
            !isSidebarOpen && "-ml-80 md:ml-0 md:w-0",
            isMobileMenuOpen && "fixed inset-0 z-50 bg-background md:relative md:inset-auto"
          )}>
            {/* Sidebar Header */}
            <div className="h-14 border-b px-4 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Conversations</h2>
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

            {/* Enhanced Thread List */}
            <EnhancedThreadList
              threads={threads}
              currentThreadId={currentThread?.id}
              isLoading={isLoadingThreads}
              onThreadSelect={handleThreadSelect}
              onThreadUpdate={handleThreadUpdate}
              onThreadDelete={handleThreadDelete}
              onNewThread={createNewThread}
            />
          </aside>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Model & Prompt Selector Bar */}
            <div className="border-b px-4 py-3 bg-muted/20 flex-shrink-0 min-h-[3.5rem]">
              <div className="flex items-center gap-3 flex-wrap h-full">
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

                {/* System Prompt Selector */}
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        {selectedPrompt && (
                          <>
                            <selectedPrompt.icon className="w-3 h-3 mr-2" />
                            {selectedPrompt.name}
                          </>
                        )}
                        <ChevronDown className="w-3 h-3 ml-2" />
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

                  {/* Show prompt content preview */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm">
                      <p className="text-xs">{selectedPrompt?.content || 'No prompt selected'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Model Selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                          className="mb-6"
                        />
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                <div className="max-w-4xl mx-auto flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputMessage)}
                    placeholder="Ask for financial insights..."
                    disabled={!!pendingReportGeneration}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!!pendingReportGeneration || !inputMessage.trim()}
                    size="icon"
                    data-testid="send-button"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </main>
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

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Default Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Default System Prompt</label>
                <Select value={selectedPrompt?.id} onValueChange={(id) => setSelectedPrompt(systemPrompts.find(p => p.id === id) || null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {systemPrompts.map(prompt => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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