'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import './playground.css';
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
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';

interface Thread {
  _id: string;
  title: string;
  description?: string;
  status: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface Report {
  _id: string;
  htmlContent: string;
  insights: Array<{
    id: string;
    text: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
  }>;
  sections: any[];
}

export default function FinancialPlaygroundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reportEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load threads on mount
  useEffect(() => {
    if (session) {
      loadThreads();
    }
  }, [session]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Load all threads
  const loadThreads = async () => {
    try {
      const response = await fetch('/api/playground/threads');
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      toast.error('Failed to load conversations');
    }
  };

  // Create new thread
  const createNewThread = async () => {
    try {
      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Financial Report',
          description: 'Generated report',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setThreads([data.thread, ...threads]);
        setCurrentThread(data.thread);
        setMessages([]);
        setCurrentReport(null);
        setStreamingContent('');
        toast.success('New conversation started');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create conversation');
    }
  };

  // Load specific thread
  const loadThread = async (threadId: string) => {
    try {
      const response = await fetch(`/api/playground/threads/${threadId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentThread(data.thread);
        setMessages(data.messages);
        setCurrentReport(data.currentReport);
        setStreamingContent('');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      toast.error('Failed to load conversation');
    }
  };

  // Send message and stream response
  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentThread) {
      if (!currentThread) {
        toast.error('Please create a new conversation first');
      }
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setStreamingContent('');

    // Add user message immediately
    const tempUserMessage: Message = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, tempUserMessage]);

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
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
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
                } else if (data.type === 'complete') {
                  // Reload thread to get the saved message and report
                  await loadThread(currentThread._id);
                  setStreamingContent('');
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
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
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
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Chat Panel (Left) */}
          <Panel defaultSize={30} minSize={20} maxSize={50}>
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Thread
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Thread List Sidebar */}
                {isSidebarOpen && (
                  <div className="w-64 border-r border-gray-200 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {threads.map((thread) => (
                        <button
                          key={thread._id}
                          onClick={() => loadThread(thread._id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            currentThread?._id === thread._id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-sm truncate">
                            {thread.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(thread.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                    </div>
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

                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`mb-4 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}

                    {streamingContent && (
                      <div className="mb-4 text-left">
                        <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100">
                          <div className="text-sm text-gray-900">
                            Generating report...
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && !streamingContent && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe the financial report you want..."
                        disabled={isLoading || !currentThread}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !currentThread || !inputMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-blue-400 transition-colors" />

          {/* Report Panel (Right) */}
          <Panel defaultSize={70} minSize={50}>
            <div className="h-full flex flex-col bg-white">
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
                ) : (
                  <div className="max-w-5xl mx-auto">
                    <div
                      className="report-content prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: streamingContent || currentReport?.htmlContent || '',
                      }}
                    />
                  </div>
                )}
                <div ref={reportEndRef} />
              </ScrollArea>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
