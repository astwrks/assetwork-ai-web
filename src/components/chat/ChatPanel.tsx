'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    agentType?: string;
    reportSection?: string;
    dataSource?: string;
  };
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessage) => void;
  onAgentResponse: (response: ChatMessage) => void;
}

const quickPrompts = [
  { label: 'Generate Financial Analysis', prompt: 'Create a comprehensive financial analysis report with key metrics and trends', icon: BarChart3 },
  { label: 'Add Market Data', prompt: 'Include current market data and performance indicators', icon: FileText },
  { label: 'Risk Assessment', prompt: 'Analyze risk factors and provide mitigation strategies', icon: Sparkles },
];

export default function ChatPanel({ messages, onSendMessage, onAgentResponse }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    onSendMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I'll help you with "${inputValue}". Let me analyze the data and generate the requested report section.`,
        timestamp: new Date(),
        metadata: {
          agentType: 'Analysis Agent',
          reportSection: 'Financial Analysis',
        },
      };
      onAgentResponse(assistantMessage);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Generate reports, analyze data, and get insights
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start a conversation
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Ask me to generate reports, analyze data, or create visualizations
              </p>
              
              {/* Quick Prompts */}
              <div className="space-y-2">
                {quickPrompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{prompt.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {prompt.prompt}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                } rounded-lg p-3`}
              >
                <div className="flex items-start space-x-2">
                  {message.type !== 'user' && (
                    <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    {message.metadata && (
                      <div className="mt-2 text-xs opacity-75">
                        {message.metadata.agentType && (
                          <span className="inline-block bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mr-2">
                            {message.metadata.agentType}
                          </span>
                        )}
                        {message.metadata.reportSection && (
                          <span className="inline-block bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                            {message.metadata.reportSection}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {message.type === 'user' && (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex items-center space-x-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate a report, analyze data..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
