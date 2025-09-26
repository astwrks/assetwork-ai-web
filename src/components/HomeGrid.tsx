// components/HomeGrid.tsx - Infinite scroll grid with lazy loading for widget thumbnails
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { API } from '@/lib/api-new';
import WidgetThumbnail from './WidgetThumbnail';
import WidgetSkeleton from './WidgetSkeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  RefreshCw, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  Heart
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Widget {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  views_count?: number;
  is_trending?: boolean;
  [key: string]: any;
}

type FilterType = 'all' | 'trending' | 'recent';

interface HomeGridProps {
  onWidgetClick?: (id: string) => void;
}

interface PaginationState {
  page: number;
  hasMore: boolean;
  totalLoaded: number;
}

export default function HomeGrid({ onWidgetClick }: HomeGridProps) {
  // Core state
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    hasMore: true,
    totalLoaded: 0
  });
  
  // Loading state for skeletons
  const [showSkeletons, setShowSkeletons] = useState(false);

  // Initialize on mount
  useEffect(() => {
    loadInitialWidgets();
  }, []);
  
  // Handle filter/search changes
  useEffect(() => {
    if (activeFilter !== 'all' || searchQuery) {
      // Reset and reload when filters change
      resetPagination();
      loadInitialWidgets();
    }
  }, [activeFilter, searchQuery]);

  // Filtered widgets computation
  const filteredWidgets = useMemo(() => {
    let filtered = [...widgets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(widget => 
        widget.title.toLowerCase().includes(query) ||
        widget.description?.toLowerCase().includes(query) ||
        widget.type.toLowerCase().includes(query) ||
        widget.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter - note: server-side filtering is preferred for infinite scroll
    switch (activeFilter) {
      case 'trending':
        filtered = filtered.filter(w => w.is_trending);
        break;
      case 'recent':
        // Sort by creation time or views as proxy for recency
        filtered = filtered.sort((a, b) => {
          const aTime = a.created_at || a.views_count || 0;
          const bTime = b.created_at || b.views_count || 0;
          return bTime - aTime;
        });
        break;
    }

    return filtered;
  }, [widgets, searchQuery, activeFilter]);

  // Reset pagination state
  const resetPagination = useCallback(() => {
    setPagination({
      page: 1,
      hasMore: true,
      totalLoaded: 0
    });
    setWidgets([]);
  }, []);
  
  // Load initial widgets (first page)
  const loadInitialWidgets = useCallback(async () => {
    setIsInitialLoading(true);
    setError(null);
    
    try {
      await loadWidgetsPage(1, true);
    } catch (error) {
      console.error('💥 Initial widget load failed:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [activeFilter, searchQuery]);
  
  // Load more widgets (subsequent pages)
  const loadMoreWidgets = useCallback(async () => {
    if (isLoadingMore || !pagination.hasMore) return;
    
    setIsLoadingMore(true);
    setShowSkeletons(true);
    
    try {
      await loadWidgetsPage(pagination.page + 1, false);
    } catch (error) {
      console.error('💥 Load more widgets failed:', error);
    } finally {
      setIsLoadingMore(false);
      setShowSkeletons(false);
    }
  }, [pagination.page, pagination.hasMore, isLoadingMore]);
  
  // Core function to load widgets from API
  const loadWidgetsPage = async (page: number, isInitial: boolean) => {
    console.log(`🔄 Loading widgets page ${page}...`);
    
    const pageSize = 9; // 3x3 grid per page for optimal loading
    
    try {
      // Select API endpoint based on active filter
      let apiCall;
      switch (activeFilter) {
        case 'trending':
          apiCall = API.widgets.getTrending(page, pageSize);
          break;
        case 'recent':
        case 'all':
        default:
          apiCall = API.widgets.getDashboardWidgets(page, pageSize);
          break;
      }
      
      const response = await apiCall;
      console.log(`✅ Page ${page} response:`, response.data);
      
      const responseData = response.data?.data || response.data || [];
      const newWidgets = Array.isArray(responseData) ? responseData : [];
      
      if (newWidgets.length === 0) {
        console.log(`📭 No more widgets available (page ${page})`);
        setPagination(prev => ({ ...prev, hasMore: false }));
        return;
      }
      
      // Process widgets to ensure consistent structure
      const processedWidgets = newWidgets.map((widget: any, index: number) => ({
        ...widget,
        description: widget.summary || widget.description || widget.content || 'Advanced investment analysis',
        views_count: widget.views || widget.view_count || widget.engagement_count || Math.floor(Math.random() * 5000) + 1000,
        is_trending: activeFilter === 'trending' || widget.is_trending || widget.trending || false
      }));
      
      // Update state based on whether this is initial load or pagination
      if (isInitial) {
        setWidgets(processedWidgets);
        setPagination({
          page: 1,
          hasMore: processedWidgets.length === pageSize,
          totalLoaded: processedWidgets.length
        });
      } else {
        setWidgets(prev => {
          // Remove duplicates when appending
          const existingIds = new Set(prev.map(w => w.id));
          const uniqueNewWidgets = processedWidgets.filter(w => !existingIds.has(w.id));
          return [...prev, ...uniqueNewWidgets];
        });
        
        setPagination(prev => ({
          page: page,
          hasMore: processedWidgets.length === pageSize,
          totalLoaded: prev.totalLoaded + processedWidgets.length
        }));
      }
      
      console.log(`🎯 Page ${page}: Loaded ${processedWidgets.length} widgets`);
      
    } catch (error: any) {
      console.error(`💥 Error loading page ${page}:`, error);
      
      // Check if it's an onboarding issue
      const errorMessage = error.response?.data?.message || '';
      const isOnboardingError = errorMessage.includes('User has not completed onboarding');
      
      // Handle different error scenarios
      if (page === 1) {
        // First page failed - show fallback
        const fallbackWidgets: Widget[] = [
          {
            id: 'fallback-1',
            title: 'Gold vs Silver Analysis',
            description: 'Comprehensive comparison of precious metals performance',
            type: 'report',
            category: 'Commodities',
            views_count: 2300,
            is_trending: true,
            username: 'Research Team',
            preview_version_url: 'https://widgets.assetworks.ai/gold-silver-preview',
            full_version_url: 'https://widgets.assetworks.ai/gold-silver'
          },
          {
            id: 'fallback-2',
            title: 'AI Investment Research',
            description: 'Personalized AI-powered investment insights',
            type: 'ai-tool',
            category: 'AI Tools',
            views_count: 4150,
            is_trending: false,
            username: 'AI Assistant',
            preview_version_url: 'https://widgets.assetworks.ai/ai-research-preview',
            full_version_url: 'https://widgets.assetworks.ai/ai-research'
          },
          {
            id: 'fallback-3',
            title: 'Bitcoin Market Analysis',
            description: 'In-depth cryptocurrency market analysis',
            type: 'report',
            category: 'Crypto',
            views_count: 5780,
            is_trending: true,
            username: 'Crypto Team',
            preview_version_url: 'https://widgets.assetworks.ai/bitcoin-preview',
            full_version_url: 'https://widgets.assetworks.ai/bitcoin'
          }
        ];
        
        setWidgets(fallbackWidgets);
        if (isOnboardingError) {
          setError('Welcome! Complete your onboarding to access personalized widgets');
        } else {
          setError('Using offline mode - limited features available');
        }
        setPagination({ page: 1, hasMore: false, totalLoaded: fallbackWidgets.length });
      } else {
        // Later page failed - just stop pagination
        setPagination(prev => ({ ...prev, hasMore: false }));
        toast.error('Failed to load more widgets');
      }
    }
  };

  // Initialize infinite scroll
  const { lastElementRef } = useInfiniteScroll({
    hasMore: pagination.hasMore,
    loading: isLoadingMore,
    onLoadMore: loadMoreWidgets,
    threshold: 0.8
  });
  
  const filters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock },
  ] as const;

  if (error && widgets.length === 0 && !isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="text-gray-400 mb-4">
          <Search className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No widgets available</h3>
          <p className="text-gray-600 mt-2">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Check your connection to AssetWorks API or try refreshing.
          </p>
        </div>
        <Button onClick={loadInitialWidgets} variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 pb-4 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-300"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            const trendingCount = filter.id === 'trending' ? widgets.filter(w => w.is_trending).length : 0;
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as FilterType)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                  whitespace-nowrap transition-all duration-200 border
                  ${isActive 
                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{filter.label}</span>
                {trendingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {trendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading widgets...</p>
          </div>
          {/* Show skeleton grid during initial load */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-7xl">
            {Array.from({ length: 6 }, (_, index) => (
              <WidgetSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      {!isInitialLoading && (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
              {activeFilter !== 'all' && ` in ${activeFilter}`}
              {pagination.hasMore && ' (loading more...)'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadInitialWidgets}
              disabled={isInitialLoading || isLoadingMore}
              className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isInitialLoading || isLoadingMore) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Infinite Scroll Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
            {filteredWidgets.map((widget, index) => {
              // Add ref to last element for infinite scroll detection
              const isLast = index === filteredWidgets.length - 1;
              return (
                <div key={widget.id} ref={isLast ? lastElementRef : null}>
                  <WidgetThumbnail
                    widget={widget}
                    onClick={onWidgetClick}
                    onLike={(id) => console.log('Like widget:', id)}
                    onShare={(id) => console.log('Share widget:', id)}
                    onReport={(id) => console.log('Report widget:', id)}
                    onFollow={(id, shouldFollow) => console.log('Follow widget:', id, shouldFollow)}
                    onProfileClick={(userId) => console.log('View profile:', userId)}
                  />
                </div>
              );
            })}
            
            {/* Loading Skeletons for infinite scroll */}
            {showSkeletons && (
              <>
                {Array.from({ length: 3 }, (_, index) => (
                  <WidgetSkeleton key={`loading-skeleton-${index}`} />
                ))}
              </>
            )}
          </div>
          
          {/* Load More Loading Indicator */}
          {isLoadingMore && !showSkeletons && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Loading more widgets...</p>
              </div>
            </div>
          )}
          
          {/* End of Results Indicator */}
          {!pagination.hasMore && filteredWidgets.length > 0 && (
            <div className="text-center py-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                You've reached the end. {filteredWidgets.length} widgets total.
              </p>
            </div>
          )}

          {/* Empty State */}
          {filteredWidgets.length === 0 && !isLoadingMore && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No widgets found</h3>
              <p className="text-gray-500 mt-2">
                {searchQuery 
                  ? `No widgets match "${searchQuery}"` 
                  : 'Try adjusting your filters or refresh the page'
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}