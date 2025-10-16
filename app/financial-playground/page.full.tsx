'use client';

/**
 * Financial Playground v2
 * Complete rebuild with world-class architecture
 * Features: Real-time streaming, WebSocket, Market Data, Entity Intelligence
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
  Edit,
  X,
  Trash2,
  Search,
  Check,
  StopCircle,
  Zap,
  Globe,
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  Bell,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  ExternalLink,
  Info,
  BookOpen,
  Target,
  Users,
  Calendar,
  MapPin,
  Link2,
  Hash,
  Building,
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
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

// Types
interface Thread {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
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

interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
}

// Custom hooks
const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const initWebSocket = async () => {
      try {
        // Get WebSocket token from API
        const response = await fetch('/api/v2/ws', {
          headers: {
            'Authorization': `Bearer ${(session as any).accessToken}`,
          },
        });

        if (response.ok) {
          const { data } = await response.json();
          const ws = new WebSocket(data.url);

          ws.onopen = () => {
            console.log('WebSocket connected');
            setConnected(true);

            // Authenticate
            ws.send(JSON.stringify({
              type: 'auth',
              token: data.token,
            }));

            // Subscribe to channels
            ws.send(JSON.stringify({
              type: 'subscribe',
              channels: ['reports', 'market', 'notifications'],
            }));
          };

          ws.onclose = () => {
            setConnected(false);
            // Reconnect after delay
            setTimeout(initWebSocket, 5000);
          };

          setSocket(ws);
        }
      } catch (error) {
        console.error('WebSocket initialization failed:', error);
      }
    };

    initWebSocket();

    return () => {
      socket?.close();
    };
  }, [session]);

  return { socket, connected };
};

export default function FinancialPlaygroundV2() {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingTokens, setStreamingTokens] = useState({ input: 0, output: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Market data state
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT', 'BTC', 'ETH']);

  // Entity state
  const [reportEntities, setReportEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // UI state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-3-opus-20240229');

  // WebSocket
  const { socket, connected: wsConnected } = useWebSocket();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load threads on mount
  useEffect(() => {
    if (session) {
      loadThreads();
      loadMarketData();
    }
  }, [session]);

  // WebSocket message handler
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
  }, [socket]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'report_progress':
        handleReportProgress(message.data);
        break;
      case 'market_update':
        handleMarketUpdate(message.data);
        break;
      case 'notification':
        showNotification(message.data);
        break;
    }
  };

  const handleReportProgress = (data: any) => {
    if (data.reportId === currentReport?.id) {
      // Update report generation progress
      toast.loading(`Generating report: ${data.progress}%`, { id: 'report-progress' });
    }
  };

  const handleMarketUpdate = (data: any) => {
    // Update market quotes
    setMarketQuotes(prev => {
      const updated = [...prev];
      const index = updated.findIndex(q => q.symbol === data.symbol);
      if (index >= 0) {
        updated[index] = { ...updated[index], ...data };
      }
      return updated;
    });
  };

  const showNotification = (data: any) => {
    switch (data.severity) {
      case 'success':
        toast.success(data.message);
        break;
      case 'error':
        toast.error(data.message);
        break;
      case 'warning':
        toast(data.message, { icon: '⚠️' });
        break;
      default:
        toast(data.message);
    }
  };

  // API calls
  const loadThreads = async () => {
    try {
      const response = await fetch('/api/v2/threads', {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setThreads(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadMarketData = async () => {
    try {
      const symbols = watchlist.join(',');
      const response = await fetch(`/api/v2/market/quotes?symbols=${symbols}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMarketQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load market data:', error);
    }
  };

  const createNewThread = async () => {
    try {
      const response = await fetch('/api/v2/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          title: 'New Financial Report',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newThread = data.data;
        setThreads([newThread, ...threads]);
        setCurrentThread(newThread);
        setMessages([]);
        setCurrentReport(null);
        toast.success('New conversation created');
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      toast.error('Failed to create conversation');
    }
  };

  const loadThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/v2/threads/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentThread(data.thread);
        setMessages(data.messages || []);
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
    if (!inputMessage.trim() || !currentThread) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingTokens({ input: 0, output: 0 });

    // Add user message to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      threadId: currentThread.id,
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
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          prompt: userMessage,
          model: selectedModel,
          options: {
            stream: true,
            extractEntities: true,
            generateCharts: true,
            includeMarketData: true,
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
                    toast.success('Starting report generation');
                    break;

                  case 'content':
                    accumulated += data.content;
                    setStreamingContent(accumulated);
                    break;

                  case 'entity':
                    setReportEntities(prev => [...prev, data.entity]);
                    break;

                  case 'chart':
                    // Handle chart data
                    break;

                  case 'complete':
                    const assistantMessage: Message = {
                      id: data.reportId,
                      threadId: currentThread.id,
                      role: 'assistant',
                      content: accumulated,
                      metadata: data.stats,
                      createdAt: new Date().toISOString(),
                    };
                    setMessages(prev => [...prev.slice(0, -1), assistantMessage]);

                    setCurrentReport({
                      id: data.reportId,
                      threadId: currentThread.id,
                      title: currentThread.title,
                      content: accumulated,
                      format: 'html',
                      sections: [],
                      entities: reportEntities,
                      insights: [],
                      metadata: data.stats,
                      createdAt: new Date().toISOString(),
                    });

                    setStreamingContent('');
                    toast.success('Report generated successfully');
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
        toast.success('Generation stopped');
      } else {
        console.error('Error sending message:', error);
        toast.error(error.message || 'Failed to generate report');
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
      toast.loading('Generating PDF...');

      const response = await fetch(`/api/v2/reports/${currentReport.id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
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

      toast.dismiss();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.dismiss();
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
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        navigator.clipboard.writeText(data.shareUrl);
        toast.success('Share link copied to clipboard');
        setShowShareDialog(false);
      }
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  const loadEntityDetails = async (entity: Entity) => {
    setSelectedEntity(entity);

    try {
      const response = await fetch(`/api/v2/entities?search=${entity.name}`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.length > 0) {
          setSelectedEntity(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load entity details:', error);
    }
  };

  // Filtered threads
  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Financial Playground</h1>
            {currentThread && (
              <Badge variant="outline">{currentThread.title}</Badge>
            )}
            {wsConnected && (
              <Badge variant="default" className="bg-green-600">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              disabled={!currentReport}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPDF}
              disabled={!currentReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Chat Panel */}
            <Panel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col border-r">
                {/* Sidebar Toggle & New Thread */}
                <div className="h-14 border-b flex items-center justify-between px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  >
                    {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                  <Button onClick={createNewThread} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Thread
                  </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Thread List */}
                  {isSidebarOpen && (
                    <div className="w-64 border-r flex flex-col">
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search threads..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                          {filteredThreads.map(thread => (
                            <motion.button
                              key={thread.id}
                              onClick={() => loadThread(thread.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                currentThread?.id === thread.id
                                  ? 'bg-primary/10 border-primary'
                                  : 'hover:bg-muted'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="font-medium text-sm">{thread.title}</div>
                              {thread.lastMessage && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {thread.lastMessage.content}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(thread.updatedAt).toLocaleDateString()}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
                          <p className="text-sm text-muted-foreground">
                            Create a financial report by starting a new thread
                          </p>
                        </div>
                      )}

                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`mb-4 ${
                              message.role === 'user' ? 'text-right' : 'text-left'
                            }`}
                          >
                            <div
                              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                              <div className="text-xs opacity-70 mt-1">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {streamingContent && (
                        <div className="mb-4 text-left">
                          <div className="inline-block max-w-[80%] p-3 rounded-lg bg-muted border border-primary">
                            <div className="flex items-center gap-2 mb-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-sm font-medium">Generating report...</span>
                            </div>
                            {streamingTokens.output > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Tokens: {streamingTokens.input + streamingTokens.output}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Model Selector */}
                    <div className="border-t px-4 py-2">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          placeholder="Describe the financial report you want..."
                          disabled={isLoading || !currentThread}
                        />
                        {isLoading && streamingContent ? (
                          <Button onClick={stopGeneration} variant="destructive">
                            <StopCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button onClick={sendMessage} disabled={isLoading || !currentThread}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border" />

            {/* Report Panel */}
            <Panel defaultSize={70}>
              <div className="h-full flex">
                {/* Report Content */}
                <div className="flex-1 flex flex-col">
                  {/* Entity Bar */}
                  {reportEntities.length > 0 && (
                    <div className="border-b px-4 py-3 bg-muted/50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Entities:</span>
                        {reportEntities.map(entity => (
                          <Badge
                            key={entity.id}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => loadEntityDetails(entity)}
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            {entity.name}
                            {entity.ticker && ` (${entity.ticker})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1 p-8">
                    {!currentReport && !streamingContent ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Report Yet</h3>
                        <p className="text-muted-foreground">
                          Start a conversation to generate your financial report
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto">
                        <div
                          className="prose prose-lg dark:prose-invert"
                          dangerouslySetInnerHTML={{
                            __html: streamingContent || currentReport?.content || ''
                          }}
                        />
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Market Data Sidebar */}
                <div className="w-80 border-l flex flex-col">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Market Data
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {marketQuotes.map(quote => (
                        <Card key={quote.symbol} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{quote.symbol}</div>
                                <div className="text-xs text-muted-foreground">{quote.name}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">${quote.price.toFixed(2)}</div>
                                <div className={`text-xs ${
                                  quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Panel>
          </PanelGroup>
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
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Anyone with this link will be able to view the report
              </p>
              <Button onClick={shareReport} className="w-full">
                <Link2 className="w-4 h-4 mr-2" />
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
                <label className="text-sm font-medium">Default Model</label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Watchlist</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchlist.map(symbol => (
                    <Badge key={symbol} variant="secondary">
                      {symbol}
                      <button
                        onClick={() => setWatchlist(prev => prev.filter(s => s !== symbol))}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}