/**
 * Thread Skeleton Loader Component
 * Shows while threads are loading in the sidebar
 */

import React from 'react';
import { cn } from '@/lib/utils';

export const ThreadSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="p-2 space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-full px-3 py-2 rounded-lg animate-pulse"
        >
          <div className="space-y-2">
            {/* Title skeleton */}
            <div className="h-4 bg-muted rounded w-3/4" />

            {/* Last message skeleton */}
            <div className="h-3 bg-muted/60 rounded w-full" />

            {/* Date skeleton */}
            <div className="h-3 bg-muted/40 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ThreadListSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Search skeleton */}
      <div className="px-4 py-3">
        <div className="h-9 bg-muted rounded animate-pulse" />
      </div>

      {/* Thread items */}
      <ThreadSkeleton count={8} />
    </div>
  );
};