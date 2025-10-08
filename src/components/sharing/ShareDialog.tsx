'use client';

import { useState, useEffect } from 'react';
import { ShareLink, ShareSettings } from '@/lib/sharing/shareManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Share2, 
  Copy, 
  Download, 
  QrCode, 
  Eye, 
  EyeOff,
  Calendar,
  Lock,
  Unlock,
  ExternalLink,
  BarChart3
} from 'lucide-react';

interface ShareDialogProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onShareCreated?: (shareLink: ShareLink) => void;
}

export default function ShareDialog({ 
  reportId, 
  reportTitle, 
  isOpen, 
  onClose, 
  onShareCreated 
}: ShareDialogProps) {
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState<Partial<ShareSettings>>({
    title: reportTitle,
    isPublic: true,
    allowDownload: true,
    allowComments: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !shareLink) {
      handleCreateShare();
    }
  }, [isOpen]);

  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockShareLink: ShareLink = {
        id: 'share-' + Date.now(),
        url: `https://app.assetworks.ai/reports/shared/${reportId}`,
        shortUrl: 'https://short.ly/abc123',
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=',
        settings: {
          id: 'share-' + Date.now(),
          reportId,
          title: settings.title || reportTitle,
          description: settings.description,
          isPublic: settings.isPublic ?? true,
          password: settings.password,
          expiresAt: settings.expiresAt,
          allowDownload: settings.allowDownload ?? true,
          allowComments: settings.allowComments ?? false,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      
      setShareLink(mockShareLink);
      if (onShareCreated) {
        onShareCreated(mockShareLink);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyShortLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (shareLink) {
      const link = document.createElement('a');
      link.href = shareLink.qrCode;
      link.download = `qr-code-${reportId}.png`;
      link.click();
    }
  };

  const handleUpdateSettings = async () => {
    if (shareLink) {
      // Simulate API call to update settings
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Settings updated:', settings);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Share2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Share Report
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {isCreating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Creating share link...</p>
            </div>
          ) : shareLink ? (
            <div className="space-y-6">
              {/* Share Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="url">Full URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="url"
                        value={shareLink.url}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className="flex items-center space-x-1"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="shortUrl">Short URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="shortUrl"
                        value={shareLink.shortUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyShortLink}
                        className="flex items-center space-x-1"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleDownloadQR}
                      className="flex items-center space-x-2"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Download QR</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.open(shareLink.url, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Preview</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Share Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={settings.title || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Share title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={settings.description || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={settings.isPublic}
                        onChange={(e) => setSettings(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="isPublic" className="flex items-center space-x-2">
                        {settings.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span>Public</span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowDownload"
                        checked={settings.allowDownload}
                        onChange={(e) => setSettings(prev => ({ ...prev, allowDownload: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="allowDownload" className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Allow Download</span>
                      </Label>
                    </div>
                  </div>

                  {!settings.isPublic && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={settings.password || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Set a password"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={settings.expiresAt ? new Date(settings.expiresAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        expiresAt: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={handleUpdateSettings}
                      className="flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>View Analytics</span>
                    </Button>
                    
                    <Button onClick={handleUpdateSettings}>
                      Update Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
