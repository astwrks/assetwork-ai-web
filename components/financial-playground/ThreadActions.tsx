/**
 * Thread Actions Component
 * Provides management actions for threads (delete, rename, bookmark, etc.)
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  Trash2,
  Edit2,
  Star,
  StarOff,
  Eye,
  Copy,
  Archive,
  Download,
  ExternalLink,
  Minimize2,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ProgressiveLoader } from '@/components/ui/progressive-loader';

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

interface ThreadActionsProps {
  thread: Thread;
  onUpdate: (thread: Thread) => void;
  onDelete: (threadId: string) => void;
  onShowContext?: (threadId: string) => void;
  className?: string;
  variant?: 'icon' | 'menu';
}

export const ThreadActions: React.FC<ThreadActionsProps> = ({
  thread,
  onUpdate,
  onDelete,
  onShowContext,
  className,
  variant = 'icon',
}) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [showCompressDialog, setShowCompressDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(thread.title);
  const [newDescription, setNewDescription] = useState(thread.description || '');
  const [contextData, setContextData] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextLoadingStage, setContextLoadingStage] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<any>(null);

  // Progressive loader stages for context loading
  const contextLoadingStages = [
    { name: 'Fetching messages', estimatedDuration: 500, weight: 1 },
    { name: 'Loading reports', estimatedDuration: 300, weight: 1 },
    { name: 'Processing content', estimatedDuration: 200, weight: 1 },
  ];

  // Toggle bookmark
  const handleToggleBookmark = async () => {
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          isBookmarked: !thread.isBookmarked,
        }),
      });

      if (response.ok) {
        onUpdate({ ...thread, isBookmarked: !thread.isBookmarked });
        toast.success(thread.isBookmarked ? 'Bookmark removed' : 'Thread bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  // Rename thread
  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/v2/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          customName: newTitle !== thread.title ? newTitle : undefined,
        }),
      });

      if (response.ok) {
        onUpdate({
          ...thread,
          title: newTitle,
          description: newDescription,
          customName: newTitle !== thread.title ? newTitle : undefined,
        });
        toast.success('Thread updated successfully');
        setShowRenameDialog(false);
      }
    } catch (error) {
      toast.error('Failed to rename thread');
    }
  };

  // Delete thread
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        onDelete(thread.id);
        toast.success('Thread deleted');
        setShowDeleteDialog(false);
      }
    } catch (error) {
      toast.error('Failed to delete thread');
    }
  };

  // Archive thread
  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: thread.status === 'archived' ? 'active' : 'archived',
        }),
      });

      if (response.ok) {
        onUpdate({
          ...thread,
          status: thread.status === 'archived' ? 'active' : 'archived',
        });
        toast.success(thread.status === 'archived' ? 'Thread unarchived' : 'Thread archived');
      }
    } catch (error) {
      toast.error('Failed to archive thread');
    }
  };

  // Load thread context
  const loadThreadContext = async () => {
    setLoadingContext(true);
    setContextLoadingStage(0);
    setShowContextDialog(true); // Show dialog immediately with loader
    setContextData(null); // Clear previous data

    try {
      setContextLoadingStage(1); // Stage 1: Loading reports
      const response = await fetch(`/api/v2/threads/${thread.id}/context`, {
        credentials: 'include',
      });

      if (response.ok) {
        setContextLoadingStage(2); // Stage 2: Processing content
        const data = await response.json();
        setContextData(data.data);
      } else {
        toast.error('Failed to load thread context');
        setShowContextDialog(false);
      }
    } catch (error) {
      toast.error('Failed to load thread context');
      setShowContextDialog(false);
    } finally {
      setLoadingContext(false);
    }
  };

  // Copy thread ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(thread.id);
    toast.success('Thread ID copied');
  };

  // Load compression stats
  const loadCompressionStats = async () => {
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}/compress`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCompressionStats(data.data);
        setShowCompressDialog(true);
      } else {
        toast.error('Failed to load compression stats');
      }
    } catch (error) {
      toast.error('Failed to load compression stats');
    }
  };

  // Compress thread
  const handleCompress = async () => {
    setCompressing(true);
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          keepRecentCount: 10,
          force: false,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Thread compressed successfully');
        setShowCompressDialog(false);
        // Reload stats to show updated information
        await loadCompressionStats();
      } else {
        toast.error(data.message || 'Failed to compress thread');
      }
    } catch (error) {
      toast.error('Failed to compress thread');
    } finally {
      setCompressing(false);
    }
  };

  // Export thread
  const handleExport = async (format: 'json' | 'markdown') => {
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}/export?format=${format}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${thread.title.replace(/[^a-z0-9]/gi, '_')}.${format === 'json' ? 'json' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Thread exported as ${format}`);
      }
    } catch (error) {
      toast.error('Failed to export thread');
    }
  };

  if (variant === 'menu') {
    return (
      <>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", className)}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 z-[200]"
            sideOffset={5}
            alignOffset={-5}
          >
            {/* Bookmark */}
            <DropdownMenuItem onClick={handleToggleBookmark}>
              {thread.isBookmarked ? (
                <>
                  <StarOff className="w-4 h-4 mr-2" />
                  Remove Bookmark
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Bookmark Thread
                </>
              )}
            </DropdownMenuItem>

            {/* Rename */}
            <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename Thread
            </DropdownMenuItem>

            {/* Show Context */}
            <DropdownMenuItem onClick={loadThreadContext} disabled={loadingContext}>
              <Eye className="w-4 h-4 mr-2" />
              Show Context
            </DropdownMenuItem>

            {/* Compress Thread with AI */}
            <DropdownMenuItem onClick={loadCompressionStats}>
              <Minimize2 className="w-4 h-4 mr-2" />
              Compress with AI
            </DropdownMenuItem>

            {/* Archive */}
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              {thread.status === 'archived' ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Export */}
            <DropdownMenuItem onClick={() => handleExport('markdown')}>
              <Download className="w-4 h-4 mr-2" />
              Export as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Copy ID */}
            <DropdownMenuItem onClick={handleCopyId}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Thread ID
            </DropdownMenuItem>

            {/* Delete */}
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Thread
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent className="z-[250]">
            <DialogHeader>
              <DialogTitle>Rename Thread</DialogTitle>
              <DialogDescription>
                Give your conversation a custom name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter thread title..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="z-[250]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Thread?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All messages and reports in this thread will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Context Dialog */}
        <Dialog open={showContextDialog} onOpenChange={setShowContextDialog}>
          <DialogContent className="max-w-3xl z-[250]">
            <DialogHeader>
              <DialogTitle>Thread Context</DialogTitle>
              <DialogDescription>
                Complete conversation history and metadata
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {loadingContext ? (
                <div className="flex items-center justify-center h-full">
                  <ProgressiveLoader
                    isLoading={loadingContext}
                    stages={contextLoadingStages}
                    currentStage={contextLoadingStage}
                    variant="detailed"
                    showElapsedTime={true}
                    showEstimatedTime={true}
                    className="w-full"
                  />
                </div>
              ) : contextData ? (
                <pre className="text-xs">
                  {JSON.stringify(contextData, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No context data available
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(contextData, null, 2));
                  toast.success('Context copied to clipboard');
                }}
                disabled={!contextData}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Context
              </Button>
              <Button onClick={() => setShowContextDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Compress Dialog */}
        <Dialog open={showCompressDialog} onOpenChange={setShowCompressDialog}>
          <DialogContent className="max-w-2xl z-[250]">
            <DialogHeader>
              <DialogTitle>Compress Thread with AI</DialogTitle>
              <DialogDescription>
                Use AI to compress older messages and reduce token usage while preserving context
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {compressionStats ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-bold">{compressionStats.stats?.messageCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold">{compressionStats.stats?.totalTokens?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compressible Messages</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {compressionStats.stats?.compressibleMessages || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Potential Savings</p>
                      <p className="text-2xl font-bold text-green-600">
                        {compressionStats.stats?.estimatedSavings?.toLocaleString() || 0} tokens
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {compressionStats.recommendation && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      compressionStats.recommendation.shouldCompress
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                    )}>
                      <p className="font-medium mb-2">
                        {compressionStats.recommendation.shouldCompress ? '✅ Compression Recommended' : 'ℹ️ Compression Not Recommended'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {compressionStats.recommendation.reason}
                      </p>
                    </div>
                  )}

                  {/* Last Compression Info */}
                  {compressionStats.metadata?.lastCompression && (
                    <p className="text-sm text-muted-foreground">
                      Last compressed: {new Date(compressionStats.metadata.lastCompression).toLocaleString()}
                      {compressionStats.metadata.totalCompressions && (
                        <span> • {compressionStats.metadata.totalCompressions} total compressions</span>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompressDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCompress}
                disabled={compressing || !compressionStats?.recommendation?.shouldCompress}
              >
                {compressing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Compress Thread
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Icon variant (for inline use)
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          handleToggleBookmark();
        }}
      >
        <Star className={cn(
          "w-3 h-3",
          thread.isBookmarked && "fill-yellow-500 text-yellow-500"
        )} />
      </Button>
    </div>
  );
};