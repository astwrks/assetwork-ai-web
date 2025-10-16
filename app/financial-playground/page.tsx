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
import { useWebSocket, useThreadWebSocket, WSEvents, ConnectionStatus } from '@/lib/websocket/client';
import { EnhancedThreadList } from '@/components/financial-playground/EnhancedThreadList';
import { ThreadListSkeleton } from '@/components/financial-playground/ThreadSkeleton';

// Types
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

interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    entities?: Entity[];
  };
  createdAt: string;
}

interface Report {
  id: string;
  threadId: string;
  title: string;
  content: string;
  format: 'html' | 'markdown' | 'json';
  sections: Section[];
  entities: Entity[];
  insights: Insight[];
  metadata: {
    model: string;
    tokens: number;
    cost: number;
    generationTime: number;
  };
  createdAt: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'insight';
  order: number;
  data?: any;
}

interface Entity {
  id: string;
  name: string;
  type: 'COMPANY' | 'STOCK' | 'PERSON' | 'PRODUCT' | 'CRYPTOCURRENCY' | 'INDEX';
  ticker?: string;
  description?: string;
  sentiment?: number;
  relevance?: number;
  metadata?: Record<string, any>;
}

interface Insight {
  id: string;
  type: 'trend' | 'risk' | 'opportunity' | 'metric';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
}

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  content: string;
  icon: React.ElementType;
  category: 'financial' | 'general' | 'technical' | 'creative';
}

// System Prompts
const SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    description: 'Expert financial analysis and market insights',
    content: 'You are a world-class financial analyst with deep expertise in market analysis, financial modeling, and investment strategies. Provide comprehensive, data-driven insights with clear recommendations.',
    icon: Database,
    category: 'financial',
  },
  {
    id: 'market-researcher',
    name: 'Market Researcher',
    description: 'In-depth market research and competitive analysis',
    content: 'You are a senior market researcher specializing in industry analysis, competitive intelligence, and market trends. Focus on actionable insights and strategic recommendations.',
    icon: Search,
    category: 'financial',
  },
  {
    id: 'risk-advisor',
    name: 'Risk Advisor',
    description: 'Risk assessment and mitigation strategies',
    content: 'You are a risk management expert focused on identifying, analyzing, and mitigating financial and operational risks. Provide balanced risk assessments with clear mitigation strategies.',
    icon: Shield,
    category: 'financial',
  },
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Helpful AI assistant for any task',
    content: 'You are a helpful AI assistant. Be concise, accurate, and provide well-structured responses.',
    icon: Bot,
    category: 'general',
  },
];

// Token Counter Component
const TokenCounter: React.FC<{ tokens: { input: number; output: number; total: number }, cost: number }> = ({ tokens, cost }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full"
  >
    <div className="flex items-center gap-1">
      <Gauge className="w-3 h-3" />
      <span>{tokens.input.toLocaleString()} in</span>
    </div>
    <Separator orientation="vertical" className="h-3" />
    <div className="flex items-center gap-1">
      <span>{tokens.output.toLocaleString()} out</span>
    </div>
    <Separator orientation="vertical" className="h-3" />
    <div className="flex items-center gap-1">
      <span className="font-medium">{tokens.total.toLocaleString()} total</span>
    </div>
    {cost > 0 && (
      <>
        <Separator orientation="vertical" className="h-3" />
        <span className="text-green-600 font-medium">${cost.toFixed(4)}</span>
      </>
    )}
  </motion.div>
);

// Entity Chip Component
const EntityChip: React.FC<{ entity: Entity; onClick: () => void }> = ({ entity, onClick }) => {
  const getEntityIcon = () => {
    switch (entity.type) {
      case 'COMPANY':
        return <Building className="w-3 h-3" />;
      case 'STOCK':
        return <Hash className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
        "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100",
        "dark:from-blue-950/50 dark:to-indigo-950/50 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50",
        "border border-blue-200 dark:border-blue-800",
        "transition-all duration-200"
      )}
    >
      {getEntityIcon()}
      <span>{entity.name}</span>
      {entity.ticker && <span className="opacity-60">({entity.ticker})</span>}
      {entity.sentiment && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded text-[10px]",
          entity.sentiment > 0 ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" :
          entity.sentiment < 0 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
        )}>
          {entity.sentiment > 0 ? '+' : ''}{(entity.sentiment * 100).toFixed(0)}%
        </span>
      )}
    </motion.button>
  );
};

export default function FinancialPlaygroundClean() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Core state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // WebSocket integration
  const { status: wsStatus, on, off, emit, isConnected } = useWebSocket({
    autoConnect: true,
    onConnect: () => toast.success('Real-time updates connected', { duration: 2000 }),
    onDisconnect: () => console.log('WebSocket disconnected'),
  });
  const { typingUsers, sendTyping } = useThreadWebSocket(currentThread?.id || null);

  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingTokens, setStreamingTokens] = useState({ input: 0, output: 0, total: 0 });
  const [streamingCost, setStreamingCost] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // System prompt state
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt>(SYSTEM_PROMPTS[0]);
  const [selectedModel, setSelectedModel] = useState('claude-3-sonnet-20240229');

  // Entity state
  const [reportEntities, setReportEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // UI state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load threads on mount and check URL for thread parameter
  useEffect(() => {
    if (session) {
      loadThreads().then(() => {
        // Check if there's a thread ID in the URL
        const threadId = searchParams.get('thread');
        if (threadId) {
          loadThread(threadId);
        }
      });
    }
  }, [session]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    if (!session || isLoadingThreads) return;

    const threadId = searchParams.get('thread');
    if (threadId) {
      // If there's a thread ID in the URL, load it if it's different from current
      if (currentThread?.id !== threadId) {
        loadThread(threadId);
      }
    } else {
      // If no thread ID in URL, clear the current thread
      if (currentThread) {
        setCurrentThread(null);
        setMessages([]);
        setCurrentReport(null);
      }
    }
  }, [searchParams, session, isLoadingThreads]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for real-time message updates
    const handleMessageCreated = (data: any) => {
      // Only add message if it's not already in the list and from another source
      setMessages(prev => {
        if (prev.some(m => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    };

    // Listen for thread updates
    const handleThreadUpdated = (data: any) => {
      if (data.threadId === currentThread?.id) {
        setCurrentThread(prev => prev ? { ...prev, ...data.changes } : null);
      }
      // Update in threads list
      setThreads(prev => prev.map(t =>
        t.id === data.threadId ? { ...t, ...data.changes } : t
      ));
    };

    // Listen for entity updates
    const handleEntityExtracted = (data: any) => {
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
  }, [isConnected, currentThread, currentReport, on, off]);

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

  const createNewThread = async () => {
    try {
      const response = await fetch('/api/v2/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: 'New Financial Report',
          description: `Created with ${selectedPrompt.name} prompt`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newThread = data.data;
        setThreads([newThread, ...threads]);
        setCurrentThread(newThread);
        setMessages([]);
        setCurrentReport(null);

        // Update URL with new thread ID
        const params = new URLSearchParams(searchParams.toString());
        params.set('thread', newThread.id);
        router.push(`/financial-playground?${params.toString()}`);

        toast.success('New conversation created');
        inputRef.current?.focus();
        return newThread; // Return the created thread
      }
      return null;
    } catch (error) {
      console.error('Failed to create thread:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  };

  const loadThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/v2/threads/${threadId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentThread(data.thread);

        // Messages are already loaded from the thread API
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages.map((msg: any) => ({
          ...msg,
          role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        })));

        setCurrentReport(data.report || null);

        if (data.report?.entities) {
          setReportEntities(data.report.entities);
        }
      }
    } catch (error) {
      console.error('Failed to load thread:', error);
      toast.error('Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Auto-create thread if none exists
    let activeThread = currentThread;
    if (!activeThread) {
      const newThread = await createNewThread();
      if (!newThread) {
        toast.error('Failed to create conversation thread');
        return;
      }
      activeThread = newThread;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingTokens({ input: 0, output: 0, total: 0 });
    setStreamingCost(0);

    // Save user message to database
    let userMessageId = `temp-${Date.now()}`;
    try {
      const messageResponse = await fetch('/api/v2/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          threadId: activeThread.id,
          role: 'user',
          content: userMessage,
        }),
      });

      if (messageResponse.ok) {
        const { data } = await messageResponse.json();
        userMessageId = data.id;
      }
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Add user message to UI
    const tempMessage: Message = {
      id: userMessageId,
      threadId: activeThread.id,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    // Create abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/v2/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          threadId: activeThread.id,
          prompt: userMessage,
          model: selectedModel,
          systemPrompt: selectedPrompt.content,
          options: {
            stream: true,
            extractEntities: true,
            generateCharts: true,
            includeMarketData: false, // Removed as requested
            language: 'en',
            format: 'html',
          },
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
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

                switch (data.type) {
                  case 'start':
                    toast.success('Starting report generation', { id: 'generation' });
                    break;

                  case 'content':
                    accumulated += data.content;
                    setStreamingContent(accumulated);
                    break;

                  case 'tokens':
                    setStreamingTokens({
                      input: data.tokens.input || 0,
                      output: data.tokens.output || 0,
                      total: (data.tokens.input || 0) + (data.tokens.output || 0),
                    });
                    setStreamingCost(data.cost || 0);
                    break;

                  case 'entity':
                    setReportEntities(prev => [...prev, data.entity]);
                    break;

                  case 'complete':
                    // Save assistant message to database
                    try {
                      const assistantResponse = await fetch('/api/v2/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          threadId: activeThread.id,
                          role: 'assistant',
                          content: accumulated,
                          metadata: {
                            model: selectedModel,
                            tokens: streamingTokens.total,
                            cost: streamingCost,
                            reportId: data.reportId,
                          },
                        }),
                      });

                      if (assistantResponse.ok) {
                        const { data: savedMessage } = await assistantResponse.json();
                        const assistantMessage: Message = {
                          id: savedMessage.id,
                          threadId: activeThread.id,
                          role: 'assistant',
                          content: accumulated,
                          metadata: {
                            model: selectedModel,
                            tokens: streamingTokens.total,
                            cost: streamingCost,
                          },
                          createdAt: savedMessage.createdAt,
                        };
                        setMessages(prev => [...prev, assistantMessage]);
                      }
                    } catch (error) {
                      console.error('Failed to save assistant message:', error);
                    }

                    setCurrentReport({
                      id: data.reportId,
                      threadId: activeThread.id,
                      title: activeThread.title,
                      content: accumulated,
                      format: 'html',
                      sections: [],
                      entities: reportEntities,
                      insights: [],
                      metadata: {
                        model: selectedModel,
                        tokens: streamingTokens.total,
                        cost: streamingCost,
                        generationTime: data.generationTime || 0,
                      },
                      createdAt: new Date().toISOString(),
                    });

                    setStreamingContent('');
                    toast.success('Report generated successfully', { id: 'generation' });
                    break;

                  case 'error':
                    toast.error(data.message || 'Generation error', { id: 'generation' });
                    break;
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
        toast.success('Generation stopped', { id: 'generation' });
      } else {
        console.error('Error sending message:', error);
        toast.error(error.message || 'Failed to generate report', { id: 'generation' });
      }
      setStreamingContent('');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingContent('');
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
        content += `**System Prompt:** ${selectedPrompt.name}\n`;
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

            {/* Token Counter */}
            {streamingTokens.total > 0 && (
              <TokenCounter tokens={streamingTokens} cost={streamingCost} />
            )}

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
                        <selectedPrompt.icon className="w-3 h-3 mr-2" />
                        {selectedPrompt.name}
                        <ChevronDown className="w-3 h-3 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 z-[100]">
                      <DropdownMenuLabel>System Prompts</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {SYSTEM_PROMPTS.map((prompt) => (
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
                          {selectedPrompt.id === prompt.id && (
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
                      <p className="text-xs">{selectedPrompt.content}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Model Selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
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
              {reportEntities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b px-4 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">Entities:</span>
                    {reportEntities.map(entity => (
                      <EntityChip
                        key={entity.id}
                        entity={entity}
                        onClick={() => setSelectedEntity(entity)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Messages/Report Area */}
              <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-4 md:p-8">
                  {messages.length === 0 && !currentThread ? (
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
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "mb-6 flex gap-3",
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          {/* Avatar */}
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            message.role === 'user'
                              ? "bg-primary text-primary-foreground"
                              : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                          )}>
                            {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>

                          {/* Message Content */}
                          <div className={cn(
                            "flex-1 max-w-[85%]",
                            message.role === 'user' ? 'text-right' : 'text-left'
                          )}>
                            <div className={cn(
                              "inline-block px-4 py-3 rounded-2xl",
                              message.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}>
                              {message.role === 'assistant' && message.content.includes('<') ? (
                                <div
                                  className="prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: message.content }}
                                />
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            {message.metadata && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {message.metadata.model} • {message.metadata.tokens} tokens
                                {message.metadata.cost && ` • $${message.metadata.cost.toFixed(4)}`}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Streaming Content */}
                      {streamingContent && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                          <div className="flex-1 max-w-[85%]">
                            <div className="inline-block px-4 py-3 rounded-2xl bg-muted border border-primary/20">
                              <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: streamingContent }}
                              />
                            </div>
                            {streamingTokens.total > 0 && (
                              <div className="mt-2">
                                <TokenCounter tokens={streamingTokens} cost={streamingCost} />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask for financial insights..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {isLoading && streamingContent ? (
                    <Button onClick={stopGeneration} variant="destructive" size="icon">
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={sendMessage} disabled={isLoading} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  )}
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
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Default System Prompt</label>
                <Select value={selectedPrompt.id} onValueChange={(id) => setSelectedPrompt(SYSTEM_PROMPTS.find(p => p.id === id) || SYSTEM_PROMPTS[0])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {SYSTEM_PROMPTS.map(prompt => (
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