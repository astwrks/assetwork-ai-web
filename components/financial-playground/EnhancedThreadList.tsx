/**
 * Enhanced Thread List Component
 * Thread list with loading states, bookmarks, and actions
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Star,
  Archive,
  ChevronRight,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ThreadListSkeleton } from './ThreadSkeleton';
import { ThreadActions } from './ThreadActions';

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

interface EnhancedThreadListProps {
  threads: Thread[];
  currentThreadId?: string | null;
  isLoading?: boolean;
  onThreadSelect: (thread: Thread) => void;
  onThreadUpdate: (thread: Thread) => void;
  onThreadDelete: (threadId: string) => void;
  onNewThread: () => void;
}

export const EnhancedThreadList: React.FC<EnhancedThreadListProps> = ({
  threads,
  currentThreadId,
  isLoading = false,
  onThreadSelect,
  onThreadUpdate,
  onThreadDelete,
  onNewThread,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'bookmarked' | 'archived'>('all');

  // Filter threads based on search and filter
  const filteredThreads = useMemo(() => {
    let filtered = threads;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(thread =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filter
    switch (filterTab) {
      case 'bookmarked':
        filtered = filtered.filter(thread => thread.isBookmarked);
        break;
      case 'archived':
        filtered = filtered.filter(thread => thread.status === 'archived');
        break;
      default:
        filtered = filtered.filter(thread => thread.status === 'active');
    }

    // Sort: bookmarked first, then by date
    filtered.sort((a, b) => {
      if (a.isBookmarked && !b.isBookmarked) return -1;
      if (!a.isBookmarked && b.isBookmarked) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return filtered;
  }, [threads, searchQuery, filterTab]);

  // Group threads by date
  const groupedThreads = useMemo(() => {
    const groups: { [key: string]: Thread[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    filteredThreads.forEach(thread => {
      const threadDate = new Date(thread.updatedAt);
      let group = 'Older';

      if (threadDate >= today) {
        group = 'Today';
      } else if (threadDate >= yesterday) {
        group = 'Yesterday';
      } else if (threadDate >= lastWeek) {
        group = 'This Week';
      }

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(thread);
    });

    return groups;
  }, [filteredThreads]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          variant="default"
          size="sm"
          onClick={onNewThread}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b">
        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-xs">
              All ({threads.filter(t => t.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Starred ({threads.filter(t => t.isBookmarked).length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              <Archive className="w-3 h-3 mr-1" />
              Archived ({threads.filter(t => t.status === 'archived').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(groupedThreads).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery
                ? 'No conversations match your search'
                : filterTab === 'bookmarked'
                ? 'No bookmarked conversations'
                : filterTab === 'archived'
                ? 'No archived conversations'
                : 'No conversations yet'}
            </div>
          ) : (
            <AnimatePresence>
              {['Today', 'Yesterday', 'This Week', 'Older'].map(groupName => {
                if (!groupedThreads[groupName]) return null;

                return (
                  <div key={groupName} className="mb-4">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {groupName}
                    </div>
                    <div className="space-y-1">
                      {groupedThreads[groupName].map(thread => (
                        <motion.div
                          key={thread.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            onClick={() => onThreadSelect(thread)}
                            className={cn(
                              "relative group cursor-pointer rounded-lg transition-all duration-200",
                              "hover:bg-muted/50 hover:shadow-sm",
                              currentThreadId === thread.id &&
                                "bg-primary/10 hover:bg-primary/15 shadow-sm ring-1 ring-primary/20"
                            )}
                          >
                            <div className="flex items-start gap-3 p-3">
                              {/* Icon */}
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                thread.isBookmarked
                                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                                  : "bg-muted"
                              )}>
                                {thread.isBookmarked ? (
                                  <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                                ) : thread.status === 'archived' ? (
                                  <Archive className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className={cn(
                                    "font-medium text-sm truncate",
                                    currentThreadId === thread.id && "text-foreground font-semibold"
                                  )}>
                                    {thread.customName || thread.title}
                                  </h3>
                                  {thread.messageCount > 0 && (
                                    <Badge variant="secondary" className="text-xs px-1 h-4">
                                      {thread.messageCount}
                                    </Badge>
                                  )}
                                </div>
                                {thread.description && (
                                  <p className={cn(
                                    "text-xs text-muted-foreground mt-0.5 truncate",
                                    currentThreadId === thread.id && "text-muted-foreground/90"
                                  )}>
                                    {thread.description}
                                  </p>
                                )}
                                {thread.lastMessage && (
                                  <p className={cn(
                                    "text-xs text-muted-foreground mt-1 truncate",
                                    currentThreadId === thread.id && "text-muted-foreground/90"
                                  )}>
                                    {thread.lastMessage.role === 'user' ? 'You: ' : 'AI: '}
                                    {thread.lastMessage.content}
                                  </p>
                                )}
                                <div className={cn(
                                  "text-xs text-muted-foreground mt-1",
                                  currentThreadId === thread.id && "text-muted-foreground/90"
                                )}>
                                  {formatTime(thread.updatedAt)}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ThreadActions
                                  thread={thread}
                                  onUpdate={onThreadUpdate}
                                  onDelete={onThreadDelete}
                                  variant="menu"
                                />
                              </div>
                            </div>

                            {/* Active indicator */}
                            {currentThreadId === thread.id && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-primary rounded-r" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};