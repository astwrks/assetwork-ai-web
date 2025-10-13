'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Globe, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string;
  reportId?: string;
  userEmail?: string;
}

export default function ShareDialog({
  isOpen,
  onClose,
  threadId,
  reportId,
  userEmail,
}: ShareDialogProps) {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedThread, setCopiedThread] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const threadUrl = threadId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/financial-playground?thread=${threadId}`
    : '';

  const handleCopyThread = async () => {
    try {
      await navigator.clipboard.writeText(threadUrl);
      setCopiedThread(true);
      toast.success('Thread URL copied!');
      setTimeout(() => setCopiedThread(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!reportId) {
      toast.error('No report available to share');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/share`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/report/${data.shareId}`;
        setPublicUrl(url);
        toast.success('Public link generated!');
      } else {
        throw new Error('Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      toast.error('Failed to generate public link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedReport(true);
      toast.success('Public link copied!');
      setTimeout(() => setCopiedReport(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share this conversation or generate a public report link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share Thread */}
          {threadId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-foreground">Share Thread</h3>
                  <p className="text-sm text-muted-foreground">
                    Share the conversation with your team
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={threadUrl}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button onClick={handleCopyThread} variant="outline" size="sm">
                  {copiedThread ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Divider */}
          {threadId && reportId && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
          )}

          {/* Share Report */}
          {reportId && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-foreground">Share Public Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a branded, public report link
                  </p>
                </div>
              </div>

              {!publicUrl ? (
                <Button
                  onClick={handleGeneratePublicLink}
                  disabled={isGenerating}
                  className="w-full"
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Generate Public Link
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={publicUrl}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button onClick={handleCopyPublicLink} variant="outline" size="sm">
                      {copiedReport ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ✓ Public report includes branding, creator attribution, and is viewable by anyone
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
