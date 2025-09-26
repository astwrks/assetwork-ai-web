// hooks/useInfiniteScroll.ts - Custom hook for infinite scroll functionality
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.8
}: UseInfiniteScrollProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px'
      }
    );
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, onLoadMore, threshold]);

  // Scroll-based infinite loading for better mobile experience
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (hasMore && !loading) {
          onLoadMore();
        }
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledHandleScroll);
    
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [hasMore, loading, onLoadMore, isMounted]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef, loadingRef };
};

// Simple throttle function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}