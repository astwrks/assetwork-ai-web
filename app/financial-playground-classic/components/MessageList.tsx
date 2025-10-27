'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Edit2, Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { MessageFeedback } from './MessageFeedback';
import { MessageStatusBadge } from './MessageStatusBadge';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (message: Message) => void;
}

export function MessageList({
  messages,
  isLoading,
  onRetry,
  onEdit,
  onDelete,
  onCopy,
}: MessageListProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('[MessageList] Rendering with messages:', {
      count: messages.length,
      messages: messages.map(m => ({ id: m.id, role: m.role, contentPreview: m.content?.substring(0, 50) })),
    });
  }, [messages]);

  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
    onCopy?.(message);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold">AI</span>
                </div>
              )}

              <div className={cn(
                'flex-1 max-w-[85%]',
                message.role === 'user' && 'flex justify-end'
              )}>
                <Card className={cn(
                  'p-4',
                  message.role === 'user' && 'bg-primary text-primary-foreground',
                  message.status === 'error' && 'border-destructive'
                )}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}

                  {message.status === 'error' && (
                    <div className="mt-2 pt-2 border-t border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>Failed to send</span>
                      {onRetry && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetry(message)}
                          className="ml-auto"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Message actions and feedback */}
                  {message.role === 'assistant' ? (
                    <MessageFeedback
                      messageId={message.id}
                      messageContent={message.content}
                      role={message.role}
                      compact={true}
                      className="mt-2 border-t pt-2"
                      onFeedbackSubmitted={(feedback) => {
                        console.log('Feedback submitted:', feedback);
                      }}
                    />
                  ) : (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {message.role === 'user' && onEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(message)}
                          className="h-7 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(message.id)}
                            className="h-7 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                      {/* Status badge for user messages */}
                      {message.role === 'user' && message.status && (
                        <MessageStatusBadge status={message.status} />
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-bold">U</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold">AI</span>
          </div>
          <div className="flex-1">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
