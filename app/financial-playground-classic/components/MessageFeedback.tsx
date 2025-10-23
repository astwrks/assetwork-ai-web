/**
 * Message Feedback Component
 * Allows users to provide feedback on AI messages
 * Uses existing /api/playground/messages/[messageId]/feedback API
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Copy,
  Check,
  Flag,
  Star,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackData {
  rating?: 'helpful' | 'not_helpful';
  score?: number; // 1-5 stars
  issues?: string[];
  comment?: string;
  suggestedEdit?: string;
}

interface MessageFeedbackProps {
  messageId: string;
  messageContent: string;
  role: 'user' | 'assistant';
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
  className?: string;
  compact?: boolean;
}

export function MessageFeedback({
  messageId,
  messageContent,
  role,
  onFeedbackSubmitted,
  className,
  compact = false
}: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({});
  const [isDetailedFeedbackOpen, setIsDetailedFeedbackOpen] = useState(false);
  const [isCopied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Only show feedback for assistant messages
  if (role !== 'assistant') return null;

  const handleQuickFeedback = async (rating: 'helpful' | 'not_helpful') => {
    setFeedback(prev => ({ ...prev, rating }));

    // Submit quick feedback immediately
    try {
      const response = await fetch(`/api/playground/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feedback: rating === 'helpful' ? 'up' : 'down' })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setHasSubmitted(true);
      onFeedbackSubmitted?.({ rating });
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Could not submit feedback');
    }
  };

  const submitDetailedFeedback = async () => {
    if (!feedback.score && !feedback.comment && (!feedback.issues || feedback.issues.length === 0)) {
      toast.error('Please provide some feedback before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/playground/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feedback: feedback.rating === 'helpful' ? 'up' : 'down',
          details: feedback
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setHasSubmitted(true);
      setIsDetailedFeedbackOpen(false);
      onFeedbackSubmitted?.(feedback);
      toast.success('Detailed feedback submitted successfully!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Could not submit detailed feedback');

      // Fallback: save feedback locally
      localStorage.setItem(`feedback_${messageId}`, JSON.stringify(feedback));
      toast.info('Feedback saved locally for later submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const issueOptions = [
    'Incorrect information',
    'Incomplete response',
    'Too verbose',
    'Too brief',
    'Off-topic',
    'Formatting issues',
    'Technical errors',
    'Unclear explanation'
  ];

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <AnimatePresence mode="wait">
          {hasSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Check className="w-3 h-3 text-green-500" />
              <span>Feedback submitted</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => handleQuickFeedback('helpful')}
                disabled={hasSubmitted}
              >
                <ThumbsUp className={`w-3 h-3 ${feedback.rating === 'helpful' ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => handleQuickFeedback('not_helpful')}
                disabled={hasSubmitted}
              >
                <ThumbsDown className={`w-3 h-3 ${feedback.rating === 'not_helpful' ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={copyMessage}
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 px-2">
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsDetailedFeedbackOpen(true)}
                  >
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Detailed Feedback
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                  >
                    <Flag className="w-3 h-3 mr-2" />
                    Report Issue
                  </Button>
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center justify-between p-3 border-t ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Was this helpful?</span>

          {hasSubmitted ? (
            <Badge variant="secondary" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Feedback received
            </Badge>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={feedback.rating === 'helpful' ? 'default' : 'outline'}
                onClick={() => handleQuickFeedback('helpful')}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                Yes
              </Button>
              <Button
                size="sm"
                variant={feedback.rating === 'not_helpful' ? 'default' : 'outline'}
                onClick={() => handleQuickFeedback('not_helpful')}
              >
                <ThumbsDown className="w-3 h-3 mr-1" />
                No
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={copyMessage}
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDetailedFeedbackOpen(true)}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            More Feedback
          </Button>
        </div>
      </div>

      {/* Detailed Feedback Dialog */}
      <Dialog open={isDetailedFeedbackOpen} onOpenChange={setIsDetailedFeedbackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provide Detailed Feedback</DialogTitle>
            <DialogDescription>
              Help us improve by providing specific feedback about this response
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    size="sm"
                    variant="ghost"
                    onClick={() => setFeedback(prev => ({ ...prev, score: star }))}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (feedback.score || 0) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {feedback.score ? `${feedback.score} star${feedback.score > 1 ? 's' : ''}` : 'Not rated'}
                </span>
              </div>
            </div>

            {/* Issues Checklist */}
            <div className="space-y-2">
              <Label>Select any issues (optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {issueOptions.map((issue) => (
                  <div key={issue} className="flex items-center space-x-2">
                    <Checkbox
                      checked={feedback.issues?.includes(issue) || false}
                      onCheckedChange={(checked) => {
                        setFeedback(prev => ({
                          ...prev,
                          issues: checked
                            ? [...(prev.issues || []), issue]
                            : prev.issues?.filter(i => i !== issue) || []
                        }));
                      }}
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      {issue}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Additional Comments (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Tell us more about your experience with this response..."
                value={feedback.comment || ''}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            {/* Suggested Edit */}
            <div className="space-y-2">
              <Label htmlFor="suggestion">Suggest an improvement (optional)</Label>
              <Textarea
                id="suggestion"
                placeholder="How would you improve this response?"
                value={feedback.suggestedEdit || ''}
                onChange={(e) => setFeedback(prev => ({ ...prev, suggestedEdit: e.target.value }))}
                className="min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailedFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDetailedFeedback} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}