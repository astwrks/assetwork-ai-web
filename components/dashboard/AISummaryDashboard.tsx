'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Activity,
  FileText,
  MessageSquare,
  Plus,
  Loader2,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { MarketInsight } from '@/lib/services/market-insights.service';
import { ActivitySummary } from '@/lib/services/context-aggregation.service';

interface DashboardData {
  summary?: string;
  activitySummary?: ActivitySummary;
  marketData?: any;
  insights?: MarketInsight[];
  timeRange: string;
  generatedAt: string;
  cached?: boolean;
}

export default function AISummaryDashboard() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [summaryData, setSummaryData] = useState<DashboardData | null>(null);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestThreadId, setLatestThreadId] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      // Fetch activity summary and market insights in parallel
      const [summaryRes, insightsRes] = await Promise.all([
        fetch(`/api/dashboard/summary?range=${timeRange}`),
        fetch(`/api/dashboard/market-insights?range=${timeRange}`),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummaryData(data);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setMarketInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch latest thread
  const fetchLatestThread = async () => {
    try {
      const response = await fetch('/api/playground/threads');
      if (response.ok) {
        const data = await response.json();
        if (data.threads && data.threads.length > 0) {
          // Threads are sorted by updatedAt desc, so first one is latest
          const latestThread = data.threads[0];
          setLatestThreadId(latestThread.id || latestThread._id);
        }
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchLatestThread();
  }, [timeRange]);

  // Handle clicking an insight card to start a new thread
  const handleInsightClick = async (insight: MarketInsight) => {
    try {
      // Create a new thread with the pre-filled prompt
      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: insight.title,
          initialPrompt: insight.actionPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const threadId = data.thread?.id || data.thread?._id;
        if (threadId) {
          // Open in new tab
          window.open(`/financial-playground?thread=${threadId}`, '_blank');
        }
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  // Handle creating a blank new thread
  const handleNewChat = async () => {
    try {
      // Create a new thread first
      const response = await fetch('/api/playground/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Financial Report',
          description: 'Generated report',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const threadId = data.thread?.id || data.thread?._id;
        if (threadId) {
          // Open the new thread in a new tab
          window.open(`/financial-playground?thread=${threadId}`, '_blank');
        } else {
          // Fallback to plain URL if thread ID is missing
          window.open('/financial-playground', '_blank');
        }
      } else {
        console.error('Failed to create thread');
        window.open('/financial-playground', '_blank');
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      window.open('/financial-playground', '_blank');
    }
  };

  // Handle navigating to all chats with latest thread open
  const handleAllChats = () => {
    if (latestThreadId) {
      // Navigate to playground with latest thread
      router.push(`/financial-playground?thread=${latestThreadId}`);
    } else {
      // No threads yet, just go to playground
      router.push('/financial-playground');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Welcome Back
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening in your financial world
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAllChats}
                className="flex items-center gap-2 px-5 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium border border-border"
              >
                <MessageSquare className="w-5 h-5" />
                All Chats
              </button>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Chat
              </button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 mt-6">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  Past {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="ml-auto p-2 rounded-md hover:bg-muted transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* AI Summary Card */}
        {summaryData?.summary && (
          <div className="bg-card border rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {summaryData.summary}
                </p>
              </div>
            </div>

            {/* Activity Metrics */}
            {summaryData.activitySummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {summaryData.activitySummary.metrics.reportsGenerated}
                    </p>
                    <p className="text-xs text-muted-foreground">Reports</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {summaryData.activitySummary.metrics.totalThreads}
                    </p>
                    <p className="text-xs text-muted-foreground">Threads</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {summaryData.activitySummary.metrics.entitiesTracked}
                    </p>
                    <p className="text-xs text-muted-foreground">Entities</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {summaryData.activitySummary.metrics.sectionsEdited}
                    </p>
                    <p className="text-xs text-muted-foreground">Edits</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Insights Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Personalized Insights & Suggestions
          </h2>
          <p className="text-muted-foreground mb-6">
            Click any card to start analyzing
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketInsights.map((insight) => (
              <button
                key={insight.id}
                onClick={() => handleInsightClick(insight)}
                className="text-left bg-card border rounded-xl p-5 hover:border-primary hover:shadow-lg transition-all group"
              >
                {/* Header with icon */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {insight.type === 'stock' && (
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    )}
                    {insight.type === 'crypto' && (
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    )}
                    {insight.type === 'suggestion' && (
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    )}
                    {insight.isPersonalized && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                        For You
                      </span>
                    )}
                  </div>

                  {insight.metadata?.change !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        insight.metadata.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {insight.metadata.change >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(insight.metadata.change).toFixed(2)}%
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {insight.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {insight.description}
                </p>

                {/* Action Button */}
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  {insight.actionText}
                  <Plus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
