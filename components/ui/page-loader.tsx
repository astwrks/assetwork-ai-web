import React from 'react';
import { Loader2 } from 'lucide-react';

export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        {message && (
          <p className="text-lg text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
