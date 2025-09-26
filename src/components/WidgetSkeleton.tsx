// components/WidgetSkeleton.tsx - Loading skeleton matching widget card structure
'use client';

export default function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-5 p-5 animate-pulse">
      {/* Header: Author info + Follow button skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center pb-4">
          <div className="h-6 w-6 bg-gray-200 rounded-full mr-1"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        
        <div className="h-7 w-16 bg-gray-200 rounded-full"></div>
      </div>

      {/* Widget Preview Container skeleton (matching 200px height) */}
      <div className="h-48 w-full mb-5 border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200 mb-5" />

      {/* Footer: Date + Action buttons skeleton */}
      <div className="flex items-center justify-between text-xs">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        
        <div className="flex items-center space-x-3">
          {/* Share button skeleton */}
          <div className="flex items-center space-x-1">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>

          {/* Like button skeleton */}
          <div className="flex items-center space-x-1">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>

          {/* Report button skeleton */}
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}