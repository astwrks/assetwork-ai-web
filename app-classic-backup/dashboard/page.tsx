/**
 * Optimized Dashboard Page with Lazy Loading
 * Uses dynamic imports to reduce initial bundle size and improve load time
 */

'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  Settings,
  FileText,
  Globe,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { InlineLoader } from '@/components/ui/page-loader';

// Lazy load heavy components
const StatsGrid = dynamic(
  () => import('@/components/dashboard/stats-grid').then(mod => ({ default: mod.StatsGrid })),
  { loading: () => <InlineLoader message="Loading statistics..." /> }
);

const ReportTrendChart = dynamic(
  () => import('@/components/dashboard/report-trend-chart').then(mod => ({ default: mod.ReportTrendChart })),
  { loading: () => <InlineLoader message="Loading chart..." />, ssr: false }
);

const EntityBreakdownChart = dynamic(
  () => import('@/components/dashboard/entity-breakdown-chart').then(mod => ({ default: mod.EntityBreakdownChart })),
  { loading: () => <InlineLoader message="Loading chart..." />, ssr: false }
);

// Types
interface DashboardStats {
  totalReports: number;
  reportsThisMonth: number;
  totalEntities: number;
  activeAlerts: number;
  apiUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  marketOverview: {
    trending: Array<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
    }>;
  };
}

interface Activity {
  id: string;
  type: 'report' | 'entity' | 'alert' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
      // Initialize WebSocket for real-time updates
      initializeWebSocket();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/v2/dashboard/stats'),
        fetch('/api/v2/dashboard/activities'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Don't show error toast on initial load to avoid UX issues
    }
  };

  const initializeWebSocket = async () => {
    try {
      const response = await fetch('/api/v2/ws');
      if (response.ok) {
        const { data } = await response.json();
        const ws = new WebSocket(data.url);

        ws.onopen = () => {
          setWsConnected(true);
          ws.send(JSON.stringify({ type: 'auth', token: data.token }));
          ws.send(JSON.stringify({ type: 'subscribe', channels: ['market', 'notifications'] }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'market_update' && message.data) {
            setStats(prev => prev ? { ...prev, marketOverview: { trending: message.data.trending || [] } } : null);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Reconnect after 5 seconds
          setTimeout(initializeWebSocket, 5000);
        };
      }
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  };

  // Show loading state while authenticating
  if (status === 'loading') {
    return null; // The loading.tsx will handle this
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={wsConnected ? 'default' : 'secondary'}>
            <Activity className="h-3 w-3 mr-1" />
            {wsConnected ? 'Live' : 'Offline'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid - Lazy Loaded */}
      <Suspense fallback={<InlineLoader message="Loading statistics..." />}>
        <StatsGrid stats={stats} />
      </Suspense>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts - Lazy Loaded */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<InlineLoader message="Loading charts..." />}>
            <ReportTrendChart />
            <EntityBreakdownChart />
          </Suspense>
        </div>

        {/* Activity Feed */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 pb-3 border-b last:border-0"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {activity.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View All Activity
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      {stats?.marketOverview?.trending && stats.marketOverview.trending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>
              Trending assets and market movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.marketOverview.trending.slice(0, 4).map((asset) => (
                <div
                  key={asset.symbol}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{asset.symbol}</p>
                    <p className="text-xl font-bold">
                      ${asset.price.toFixed(2)}
                    </p>
                  </div>
                  <div className={`flex items-center ${
                    asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {asset.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(asset.changePercent).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/financial-playground')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/entities')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Track Entity
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/market')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Market Data
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
