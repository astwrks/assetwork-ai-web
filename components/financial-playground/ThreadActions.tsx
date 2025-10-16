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
  const [newTitle, setNewTitle] = useState(thread.title);
  const [newDescription, setNewDescription] = useState(thread.description || '');
  const [contextData, setContextData] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);

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
    try {
      const response = await fetch(`/api/v2/threads/${thread.id}/context`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setContextData(data.data);
        setShowContextDialog(true);
      } else {
        toast.error('Failed to load thread context');
      }
    } catch (error) {
      toast.error('Failed to load thread context');
    } finally {
      setLoadingContext(false);
    }
  };

  // Copy thread ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(thread.id);
    toast.success('Thread ID copied');
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
        <DropdownMenu>
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
          <DropdownMenuContent align="end" className="w-48">
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
          <DialogContent>
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
          <AlertDialogContent>
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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Thread Context</DialogTitle>
              <DialogDescription>
                Complete conversation history and metadata
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {contextData ? (
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