'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Dynamic route for thread-specific financial playground v2
 * This handles URLs like /financial-playground-v2/[threadId]
 * and redirects to the main playground with the thread ID as a query param
 */
export default function ThreadPageV2() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;

  useEffect(() => {
    if (threadId) {
      // Redirect to main playground with thread query param
      // This maintains backward compatibility while supporting dynamic URLs
      router.replace(`/financial-playground-v2?thread=${threadId}`);
    }
  }, [threadId, router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">Loading thread...</p>
      </div>
    </div>
  );
}
