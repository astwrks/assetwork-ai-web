'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Clock,
  BookmarkPlus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MessageActionsProps {
  messageId: string;
  content: string;
  createdAt: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  reportId?: string;
  className?: string;
}

export default function MessageActions({
  messageId,
  content,
  createdAt,
  threadId,
  role,
  reportId,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showAddToReportDialog, setShowAddToReportDialog] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Only show actions for assistant messages
  if (role !== 'assistant') {
    return null;
  }

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Copy message content
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  // Submit feedback
  const handleFeedback = async (type: 'up' | 'down') => {
    if (isSubmittingFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`/api/playground/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: type }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setFeedback(type);
      toast.success(`Feedback submitted: ${type === 'up' ? '👍' : '👎'}`);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Add to report
  const handleAddToReport = async (action: 'new' | 'existing') => {
    try {
      if (action === 'new') {
        // Create new report with this message content
        const response = await fetch(`/api/playground/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `Create a report from this content:\n\n${content}`,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'anthropic',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create report');
        }

        toast.success('Creating new report from message...');
      } else {
        // Add to existing report as a new section
        if (!reportId) {
          toast.error('No active report found. Please create a report first.');
          return;
        }

        const response = await fetch(`/api/playground/reports/${reportId}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Add this content as a new section:\n\n${content}`,
            position: 999, // Add at the end
            model: 'claude-3-5-sonnet-20241022',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add to report');
        }

        toast.success('Added to existing report!');
      }

      setShowAddToReportDialog(false);
    } catch (error) {
      console.error('Error adding to report:', error);
      toast.error('Failed to add to report');
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          className
        )}
      >
        <TooltipProvider delayDuration={300}>
          {/* Timestamp */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                {new Date(createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{formatTimestamp(createdAt)}</p>
            </TooltipContent>
          </Tooltip>

          {/* Copy */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{copied ? 'Copied!' : 'Copy message'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Feedback - Thumbs Up */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('up')}
                disabled={isSubmittingFeedback || feedback === 'up'}
                className={cn(
                  'h-7 w-7 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50',
                  feedback === 'up' && 'text-green-600 bg-green-50'
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Good response</p>
            </TooltipContent>
          </Tooltip>

          {/* Feedback - Thumbs Down */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('down')}
                disabled={isSubmittingFeedback || feedback === 'down'}
                className={cn(
                  'h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50',
                  feedback === 'down' && 'text-red-600 bg-red-50'
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Poor response</p>
            </TooltipContent>
          </Tooltip>

          {/* Add to Report */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddToReportDialog(true)}
                className="h-7 px-2 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <BookmarkPlus className="w-3.5 h-3.5 mr-1" />
                Add to Report
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Save this response to a report</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Add to Report Dialog */}
      <Dialog open={showAddToReportDialog} onOpenChange={setShowAddToReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Message to Report</DialogTitle>
            <DialogDescription>
              Choose how you want to save this AI response to a report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => handleAddToReport('new')}
            >
              <Plus className="w-8 h-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Create New Report</div>
                <div className="text-xs text-gray-500">
                  Start a new report with this content
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => handleAddToReport('existing')}
              disabled={!reportId}
            >
              <BookmarkPlus className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold">Add to Current Report</div>
                <div className="text-xs text-gray-500">
                  {reportId
                    ? 'Add as a new section to the existing report'
                    : 'No active report found'}
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
