// components/WidgetThumbnail.tsx - Mobile app exact widget card structure
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  User,
  Share,
  Heart,
  Info,
  ExternalLink,
  Loader2
} from 'lucide-react';
// Using native JS date formatting like mobile app

interface WidgetThumbnailProps {
  widget: {
    id: string;
    title: string;
    tagline?: string;
    summary?: string;
    username: string;
    user_id?: string;
    original_prompt?: string;
    preview_version_url?: string;
    full_version_url?: string;
    likes?: number;
    dislikes?: number;
    followers?: number;
    shares?: number;
    visibility?: string;
    saves?: number;
    saved?: boolean;
    save?: boolean;
    like?: boolean;
    dislike?: boolean;
    follow?: boolean;
    unfollow?: boolean;
    reported?: boolean;
    created_at?: number;
    updated_at?: number;
    [key: string]: any;
  };
  onClick?: (id: string) => void;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
  onFollow?: (id: string, shouldFollow: boolean) => void;
  onProfileClick?: (userId: string) => void;
}

// Widget HTML Preview Component
const WidgetHtmlPreview = ({ url, title }: { url?: string; title: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center p-4">
          <ExternalLink className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Preview not available</p>
        </div>
      </div>
    );
  }

  // Use proxy route to avoid CORS issues
  const proxyUrl = `/api/proxy/widget-preview?url=${encodeURIComponent(url)}`;

  return (
    <div className="h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      )}
      
      {hasError ? (
        <div className="h-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">⚠</div>
            <p className="text-sm text-gray-500">Failed to load preview</p>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
              }}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <iframe
          src={proxyUrl}
          className="w-full h-full border-0 rounded-lg bg-white"
          style={{ minHeight: '200px', overflow: 'hidden' }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          title={`Widget Preview: ${title}`}
          scrolling="no"
        />
      )}
    </div>
  );
};

export default function WidgetThumbnail({ 
  widget, 
  onClick, 
  onLike, 
  onShare, 
  onReport, 
  onFollow,
  onProfileClick 
}: WidgetThumbnailProps) {
  
  // Format date like mobile app - "MMMM d, y" format
  const getFormattedDate = (timestamp?: number) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return '';
    }
  };

  // Check if current user owns this widget (simplified)
  const isOwner = false; // This would be determined by checking current user vs widget.user_id

  const handleWidgetClick = () => {
    if (widget.full_version_url && widget.id) {
      onClick?.(widget.id);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (widget.user_id) {
      onProfileClick?.(widget.user_id);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(widget.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(widget.id);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
      onReport?.(widget.id);
    }
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) {
      onFollow?.(widget.id, !widget.follow);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 mb-5 p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleWidgetClick}
    >
      {/* Header: Author info + Follow button (matching mobile exactly) */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="flex items-center cursor-pointer pb-4"
          onClick={handleProfileClick}
        >
          <User className="h-6 w-6 text-gray-600 mr-1" />
          <span className="text-xs text-gray-600 font-normal">
            By {widget.username}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFollow}
          disabled={isOwner}
          className={`
            px-4 py-1 rounded-full text-xs font-normal min-w-0 h-auto
            ${isOwner 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : widget.follow 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {isOwner ? 'Owner' : (widget.follow ? 'Unfollow' : 'Follow')}
        </Button>
      </div>

      {/* Widget Preview Container (matching mobile 200px height) */}
      <div className="h-48 w-full mb-5 border border-gray-200 rounded-lg overflow-hidden">
        <WidgetHtmlPreview 
          url={widget.preview_version_url} 
          title={widget.title || 'Widget Preview'} 
        />
      </div>

      {/* Divider */}
      <hr className="border-gray-200 mb-5" />

      {/* Footer: Date + Action buttons (matching mobile exactly) */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-normal">
          {getFormattedDate(widget.created_at)}
        </span>
        
        <div className="flex items-center space-x-3">
          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-2 py-1"
          >
            <Share className="h-4 w-4" />
            <span className="font-normal">{widget.shares || 0}</span>
          </button>

          {/* Like button */}
          <button
            onClick={handleLike}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 px-2 py-1"
          >
            <Heart 
              className={`h-4 w-4 ${widget.like ? 'fill-current text-red-500' : ''}`}
            />
            <span className="font-normal">{widget.likes || 0}</span>
          </button>

          {/* Report button */}
          <button
            onClick={handleReport}
            disabled={isOwner}
            className={`px-2 py-1 ${
              isOwner 
                ? 'text-gray-400 cursor-not-allowed' 
                : widget.reported 
                  ? 'text-red-500 hover:text-red-700' 
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}