'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Plus,
  Menu,
  Copy,
  Check,
  Download,
  RefreshCw,
  Trash2,
  Edit2,
  User,
  Bot,
  Settings,
  ChevronDown,
  Search,
  X,
  Loader2,
  Code,
  FileText,
  MessageSquare,
  FileDown,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { WidgetRenderer } from '@/components/widget-renderer';
import { SmartLoader } from '@/components/smart-loader';
import { ChatSettings } from '@/components/chat-settings';
import { CLAUDE_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { widgetStorageService } from '@/lib/services/widget-storage.service';
import { AutoResponseHandler } from '@/lib/ai/auto-response-handler';
import ErrorBoundary from '@/components/error-boundary';
import { reportCombinerService } from '@/lib/services/report-combiner.service';
import { getModelById, getProviderFromModel, getAllModels } from '@/lib/utils/ai-models-config';
import { getProviderIcon } from '@/lib/utils/ai-provider-icons';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    model: string;
    tokens: {
      input: number;
      output: number;
    };
    duration: number;
    timestamp: string;
  };
  widgetId?: string;
  widgetUrl?: string;
  parentWidgetId?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

function AIChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(CLAUDE_SYSTEM_PROMPT);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');
  const [currentUserPrompt, setCurrentUserPrompt] = useState('');
  const [currentWidgetId, setCurrentWidgetId] = useState<string | null>(null);
  const [enhancingWidget, setEnhancingWidget] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [threadId, setThreadId] = useState<string>(`thread_${Date.now()}`);
  const [lastWidgetHTML, setLastWidgetHTML] = useState<string>('');
  const [enhancementMode, setEnhancementMode] = useState(false);
  const [pendingAutoResponse, setPendingAutoResponse] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoResponseHandler = useRef(new AutoResponseHandler());

  // Get configured AI providers and filter models
  const configuredProviders = apiKeys
    .filter(key => key.category === 'ai')
    .map(key => key.provider);

  const availableModelsFromConfigured = getAllModels().filter(model =>
    configuredProviders.includes(model.provider)
  );

  // Monitor system prompt changes for auto-mode
  useEffect(() => {
    // Enable auto-mode when certain prompts are active
    if (systemPrompt.includes('AUTO_RESEARCH_SYSTEM_PROMPT') || 
        systemPrompt.includes('AUTONOMOUS') ||
        systemPrompt.includes('automatic execution') ||
        systemPrompt.includes('INSTANT_REPORT_PROMPT') ||
        systemPrompt.includes('ENHANCEMENT MODE ACTIVE') ||
        systemPrompt.includes('Never ask questions')) {
      setAutoMode(true);
      autoResponseHandler.current.enableAutoMode();
      console.log('[Auto-mode] Enabled for automatic confirmations');
    } else {
      setAutoMode(false);
      autoResponseHandler.current.disableAutoMode();
      console.log('[Auto-mode] Disabled');
    }
  }, [systemPrompt]);

  // Fetch API keys and available models on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch API keys
        const keysRes = await fetch('/api/keys');
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          if (keysData.success) {
            setApiKeys(keysData.keys || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.systemPrompt) {
        setSystemPrompt(settings.systemPrompt);
        // Enable auto-mode for prompts that should auto-respond
        if (settings.systemPrompt.includes('AUTO_RESEARCH_SYSTEM_PROMPT') ||
            settings.systemPrompt.includes('AUTONOMOUS') ||
            settings.systemPrompt.includes('automatic execution') ||
            settings.systemPrompt.includes('INSTANT_REPORT_PROMPT') ||
            settings.systemPrompt.includes('ENHANCEMENT MODE ACTIVE') ||
            settings.systemPrompt.includes('Never ask questions')) {
          setAutoMode(true);
          autoResponseHandler.current.enableAutoMode();
          console.log('[Auto-mode] Enabled for automatic confirmations');
        }
      }
      if (settings.model) setSelectedModel(settings.model);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    
    // Check if we need to auto-respond to the last message
    if (messages.length > 0 && autoMode) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        console.log('[Auto-response] Checking if needed:', {
          autoMode,
          messageContent: lastMessage.content.substring(0, 200),
          isStreaming: lastMessage.isStreaming
        });

        // Check if Claude is asking for confirmation
        if (autoResponseHandler.current.shouldAutoRespond(lastMessage.content)) {
          console.log('[Auto-response] Triggered! Sending confirmation...');
          // Set pending auto-response
          const autoResponse = autoResponseHandler.current.getAutoResponse();
          setPendingAutoResponse(autoResponse);
        } else {
          console.log('[Auto-response] No pattern matched');
        }
      }
    }
  }, [messages, autoMode]);

  // Handle pending auto-responses
  useEffect(() => {
    if (pendingAutoResponse && !isLoading) {
      console.log('[Auto-response] Executing pending response:', pendingAutoResponse);
      setInput(pendingAutoResponse);
      setPendingAutoResponse(null);
      // Trigger submit after input is set
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  }, [pendingAutoResponse, isLoading]);

  useEffect(() => {
    // Load conversations from localStorage
    const savedConversations = localStorage.getItem('ai-conversations');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
  }, []);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Cmd/Ctrl + / to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      // Cmd/Ctrl + N for new chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        newChat();
      }
      // Escape to stop generation
      if (e.key === 'Escape' && isLoading) {
        stopGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const saveConversation = (msgs: Message[]) => {
    const conversation: Conversation = {
      id: currentConversationId || generateId(),
      title: msgs[0]?.content.substring(0, 50) || 'New Chat',
      messages: msgs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let updatedConversations;
    if (currentConversationId) {
      updatedConversations = conversations.map(conv =>
        conv.id === currentConversationId ? conversation : conv
      );
    } else {
      setCurrentConversationId(conversation.id);
      updatedConversations = [conversation, ...conversations];
    }

    setConversations(updatedConversations);
    localStorage.setItem('ai-conversations', JSON.stringify(updatedConversations));
  };

  const handleSubmit = async (e?: React.FormEvent, parentWidgetId?: string) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if we're in instant report mode (more robust detection)
    const isInstantMode = systemPrompt.includes('INSTANT_REPORT_PROMPT') || 
                         systemPrompt.includes('instant HTML output') ||
                         systemPrompt.includes('This mode generates instant HTML reports without using Claude API');
    
    // Check if we're in enhancement mode (AI-powered incremental updates)
    // Enhancement mode is active when using Enhancement Mode prompt AND have previous HTML
    const isEnhancementMode = systemPrompt.includes('ENHANCEMENT MODE ACTIVE') && 
                             lastWidgetHTML && 
                             lastWidgetHTML.length > 0;
    
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug Info:', {
        isInstantMode,
        isEnhancementMode,
        enhancementMode,
        hasLastWidgetHTML: !!lastWidgetHTML,
        lastWidgetHTMLLength: lastWidgetHTML?.length || 0,
        hasWidgetInMessages: messages.some(m => m.widgetId),
        threadId: threadId.slice(-8),
        promptMode: systemPrompt.includes('ENHANCEMENT MODE ACTIVE') ? 'enhancement' : 
                   systemPrompt.includes('INSTANT_REPORT_PROMPT') ? 'instant' : 'standard'
      });
      
      if (isEnhancementMode) {
        console.log('Enhancement Mode Active - Building on previous report');
      } else if (isInstantMode) {
        console.log('Instant Mode Active - Using local report generation');
      } else {
        console.log('Standard Mode - Using Claude API');
      }
    }

    // Load widget storage
    widgetStorageService.loadFromLocalStorage();

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      parentWidgetId: parentWidgetId,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentUserPrompt(input.trim()); // Save current prompt for loader
    setInput('');
    setIsLoading(true);
    setEnhancingWidget(parentWidgetId || null);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages([...updatedMessages, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      // Select endpoint based on mode
      let endpoint = '/api/ai/stream';
      if (isEnhancementMode) {
        endpoint = '/api/ai/enhance';
      } else if (isInstantMode) {
        endpoint = '/api/ai/instant';
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          systemPrompt: systemPrompt,
          enhanceWidgetId: parentWidgetId,
          threadId: threadId,
          currentHTML: lastWidgetHTML,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let messageMetadata: any = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Stream completed - save widget and update messages
                if (messageMetadata && accumulatedContent) {
                  const widget = widgetStorageService.saveWidget(
                    accumulatedContent,
                    messageMetadata,
                    currentUserPrompt,
                    parentWidgetId
                  );
                  
                  setCurrentWidgetId(widget.id);
                  
                  // Save HTML for future enhancements
                  setLastWidgetHTML(accumulatedContent);
                  setEnhancementMode(true); // Enable enhancement mode for next message
                  
                  setMessages(prev => {
                    const updated = prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? { 
                            ...msg, 
                            content: accumulatedContent, 
                            isStreaming: false,
                            metadata: messageMetadata,
                            widgetId: widget.id,
                            widgetUrl: widget.publicUrl,
                            parentWidgetId: parentWidgetId
                          }
                        : msg
                    );
                    saveConversation(updated);
                    return updated;
                  });
                }
              } else {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'metadata') {
                    // Initial metadata
                  } else if (parsed.type === 'complete') {
                    // Final metadata with token counts
                    messageMetadata = parsed.metadata;
                  } else if (parsed.content) {
                    accumulatedContent += parsed.content;
                    // Update UI with streaming content for instant or enhancement mode
                    if (isInstantMode || isEnhancementMode) {
                      setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: accumulatedContent, isStreaming: true }
                          : msg
                      ));
                    }
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        toast.error('Failed to get response from AI');
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      }
    } finally {
      setIsLoading(false);
      setEnhancingWidget(null);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setThreadId(`thread_${Date.now()}`);
    setLastWidgetHTML('');
    setEnhancementMode(false);
    setCurrentWidgetId(null);
  };

  const loadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter(conv => conv.id !== id);
    setConversations(updated);
    localStorage.setItem('ai-conversations', JSON.stringify(updated));
    
    if (currentConversationId === id) {
      newChat();
    }
  };

  const copyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const regenerateResponse = async (messageIndex: number) => {
    const messagesToSend = messages.slice(0, messageIndex);
    const lastUserMessage = messagesToSend[messagesToSend.length - 1];
    
    if (lastUserMessage && lastUserMessage.role === 'user') {
      setMessages(messagesToSend);
      setInput(lastUserMessage.content);
      await handleSubmit();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create combined report from all widget messages
  const createCombinedReport = () => {
    const widgetMessages = messages.filter(m => 
      m.role === 'assistant' && 
      m.content && 
      (m.widgetId || m.content.includes('<!DOCTYPE') || m.content.includes('<html'))
    );
    
    if (widgetMessages.length === 0) {
      toast.error('No reports to combine. Generate some reports first!');
      return;
    }
    
    const htmlReports = widgetMessages.map(m => m.content);
    const title = `Combined Report - ${messages.find(m => m.role === 'user')?.content.substring(0, 50) || 'Financial Analysis'}`;
    
    const combinedReport = reportCombinerService.combineReports(
      htmlReports,
      threadId,
      title
    );
    
    // Open in new tab
    reportCombinerService.openInNewTab(combinedReport);
    
    toast.success('Combined report created and opened in new tab!');
  };

  // Download combined report
  const downloadCombinedReport = () => {
    const widgetMessages = messages.filter(m => 
      m.role === 'assistant' && 
      m.content && 
      (m.widgetId || m.content.includes('<!DOCTYPE') || m.content.includes('<html'))
    );
    
    if (widgetMessages.length === 0) {
      toast.error('No reports to download. Generate some reports first!');
      return;
    }
    
    const htmlReports = widgetMessages.map(m => m.content);
    const title = `Report_${new Date().toISOString().split('T')[0]}`;
    
    const combinedReport = reportCombinerService.combineReports(
      htmlReports,
      threadId,
      title
    );
    
    reportCombinerService.downloadReport(combinedReport);
    toast.success('Report downloaded successfully!');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted dark:bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-64 bg-background dark:bg-background border-r border-border dark:border-border flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-border dark:border-border">
              <Button
                onClick={newChat}
                className="w-full justify-start"
                variant="default"
                title="New Chat (⌘N)"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-border dark:border-border bg-background dark:bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {filteredConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative p-2.5 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conv.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-muted dark:hover:bg-secondary'
                      }`}
                      onClick={() => loadConversation(conv)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <h4 className="text-sm font-medium truncate">
                              {conv.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conv.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border dark:border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Pro Plan</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-background dark:bg-background border-b border-border dark:border-border px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-muted dark:hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-base font-semibold">AI Assistant</h1>

              {/* Selected Model Badge */}
              {(() => {
                const modelInfo = getModelById(selectedModel);
                const provider = modelInfo?.provider || getProviderFromModel(selectedModel);
                const providerConfig = provider ? getProviderIcon(provider) : null;
                const ProviderIcon = providerConfig?.icon;

                return modelInfo && providerConfig && ProviderIcon ? (
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors"
                    title="Change model"
                  >
                    <div className={`w-4 h-4 rounded ${providerConfig.bgColor} flex items-center justify-center`}>
                      <ProviderIcon className={`w-2.5 h-2.5 ${providerConfig.color}`} />
                    </div>
                    <span className="text-xs font-medium">{modelInfo.name}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                ) : null;
              })()}

              {systemPrompt.includes('INSTANT_REPORT_PROMPT') && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Instant Mode
                </span>
              )}
              {enhancementMode && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  Enhancement Mode
                </span>
              )}
              {autoMode && (
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  Auto-Confirm
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Create Report Button - Shows when there are HTML reports OR in instant mode */}
              {(messages.some(m => m.role === 'assistant' && (m.widgetId || (m.content && m.content.includes('<!DOCTYPE')))) || 
                (systemPrompt.includes('INSTANT_REPORT_PROMPT') && messages.length > 0)) && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={createCombinedReport}
                    title="Create Combined Report"
                    className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Layers className="w-4 h-4 mr-1" />
                    Create Report
                    {messages.filter(m => m.role === 'assistant' && (m.widgetId || (m.content && m.content.includes('<!DOCTYPE')))).length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-background/20 rounded-full text-xs">
                        {messages.filter(m => m.role === 'assistant' && (m.widgetId || (m.content && m.content.includes('<!DOCTYPE')))).length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadCombinedReport}
                    title="Download Report"
                    className="text-xs"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {messages.length > 0 && lastWidgetHTML && (
                <Button
                  variant={enhancementMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setEnhancementMode(!enhancementMode)}
                  title="Toggle Enhancement Mode"
                  className="text-xs"
                >
                  {enhancementMode ? (
                    <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Enhancing</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-1" /> Enhance</>
                  )}
                </Button>
              )}
              {/* Generate Full Report Button */}
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  // Ask user for symbol
                  const symbol = prompt('Enter stock symbol (e.g., AAPL, MSFT, GOOGL):', 'AAPL');
                  if (!symbol) return;
                  
                  try {
                    toast.loading(`Generating report for ${symbol}...`);
                    const response = await fetch('/api/generate-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ symbol: symbol.toUpperCase() })
                    });
                    const data = await response.json();
                    if (data.success) {
                      const newMessage: Message = {
                        id: `msg-${Date.now()}`,
                        role: 'assistant',
                        content: data.html,
                        widgetId: `widget-${Date.now()}`,
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, newMessage]);
                      toast.dismiss();
                      toast.success(`Generated complete report for ${symbol}!`);
                    }
                  } catch (error) {
                    toast.dismiss();
                    toast.error('Failed to generate report');
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-primary-foreground"
              >
                <FileText className="w-4 h-4 mr-1" />
                Full Report
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSettingsOpen(true)}
                title="Settings (⌘/)"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Bot className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground">
                  {systemPrompt.includes('INSTANT_REPORT_PROMPT') 
                    ? 'Generate instant financial reports - No API calls needed!'
                    : 'Ask me anything - I\'m powered by Claude AI'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <button
                    onClick={() => {
                      setInput(systemPrompt.includes('INSTANT_REPORT_PROMPT')
                        ? 'Generate report for Reliance Industries'
                        : 'Create a stock analysis dashboard for AAPL');
                      if (systemPrompt.includes('INSTANT_REPORT_PROMPT')) {
                        setTimeout(() => handleSubmit(), 100);
                      }
                    }}
                    className="p-4 bg-background dark:bg-background rounded-lg border border-border dark:border-border hover:border-primary hover:shadow-lg transition-all text-left group"
                  >
                    <Code className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Stock Analysis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemPrompt.includes('INSTANT_REPORT_PROMPT') 
                        ? 'Instant Reliance report'
                        : 'AAPL performance dashboard'}
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      setInput(systemPrompt.includes('INSTANT_REPORT_PROMPT')
                        ? 'Compare TCS vs Infosys performance'
                        : 'Build a portfolio allocation widget');
                      if (systemPrompt.includes('INSTANT_REPORT_PROMPT')) {
                        setTimeout(() => handleSubmit(), 100);
                      }
                    }}
                    className="p-4 bg-background dark:bg-background rounded-lg border border-border dark:border-border hover:border-primary hover:shadow-lg transition-all text-left group"
                  >
                    <FileText className="w-5 h-5 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Comparison Report</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemPrompt.includes('INSTANT_REPORT_PROMPT')
                        ? 'TCS vs Infosys analysis'
                        : 'Asset allocation visualizer'}
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      setInput(systemPrompt.includes('INSTANT_REPORT_PROMPT')
                        ? 'Show me cross-asset analysis of gold, bitcoin and nifty'
                        : 'Create a risk assessment calculator');
                      if (systemPrompt.includes('INSTANT_REPORT_PROMPT')) {
                        setTimeout(() => handleSubmit(), 100);
                      }
                    }}
                    className="p-4 bg-background dark:bg-background rounded-lg border border-border dark:border-border hover:border-primary hover:shadow-lg transition-all text-left group"
                  >
                    <MessageSquare className="w-5 h-5 text-secondary mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-medium">Cross-Asset</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {systemPrompt.includes('INSTANT_REPORT_PROMPT')
                        ? 'Gold, Bitcoin, Nifty'
                        : 'Risk assessment tools'}
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`flex-1 ${
                        message.role === 'user' ? 'max-w-2xl' : ''
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background dark:bg-background border border-border dark:border-border'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          message.isStreaming ? (
                            <SmartLoader 
                              isLoading={true} 
                              userPrompt={currentUserPrompt}
                            />
                          ) : (
                            <WidgetRenderer
                              htmlContent={message.content}
                              isLoading={false}
                              messageId={message.id}
                              onRegenerate={() => regenerateResponse(index)}
                              onEnhance={() => {
                                setInput(`Enhance this widget with more features and better visualization`);
                                handleSubmit(undefined, message.widgetId);
                              }}
                              metadata={message.metadata}
                              widgetUrl={message.widgetUrl}
                              widgetId={message.widgetId}
                            />
                          )
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-accent dark:bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border dark:border-border bg-background dark:bg-background px-4 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Send a message..."
                className="w-full px-4 py-3 pr-12 rounded-lg border border-border dark:border-border bg-background dark:bg-secondary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[52px] max-h-[200px]"
                rows={1}
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="absolute right-3 bottom-3 p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {(() => {
                const modelInfo = getModelById(selectedModel);
                const provider = modelInfo?.provider || getProviderFromModel(selectedModel);
                const providerConfig = provider ? getProviderIcon(provider) : null;
                const ProviderIcon = providerConfig?.icon;

                return (
                  <>
                    {enhancementMode ? (
                      <p className="text-xs text-muted-foreground text-center">
                        Enhancement Mode • Building on previous report • Thread: {threadId.slice(-8)}
                      </p>
                    ) : systemPrompt.includes('INSTANT_REPORT_PROMPT') ? (
                      <p className="text-xs text-muted-foreground text-center">
                        Instant Mode • Reports generated locally
                      </p>
                    ) : (
                      <>
                        {ProviderIcon && providerConfig && (
                          <div className={`w-4 h-4 rounded ${providerConfig.bgColor} flex items-center justify-center`}>
                            <ProviderIcon className={`w-2.5 h-2.5 ${providerConfig.color}`} />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Powered by {providerConfig?.displayName || 'AI'} • {modelInfo?.name || selectedModel}
                        </p>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </form>
        </div>
      </div>
      
      {/* Settings Panel */}
      <ChatSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModelsFromConfigured}
      />
    </div>
  );
}

export default function AIChatPage() {
  return (
    <ErrorBoundary>
      <AIChatPageContent />
    </ErrorBoundary>
  );
}