'use client';

/**
 * Production Dashboard
 * Real-time financial analytics with live data from our services
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Bell,
  Search,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Zap,
  Shield,
  Eye
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Initialize WebSocket connection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user) {
      initializeWebSocket();
      fetchDashboardData();
    }
  }, [session, status]);

  const initializeWebSocket = async () => {
    try {
      const response = await fetch('/api/v2/ws', {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();

        // Connect to WebSocket server
        const ws = new WebSocket(data.url);

        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);

          // Authenticate
          ws.send(JSON.stringify({
            type: 'auth',
            token: data.token,
          }));

          // Subscribe to real-time updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channels: ['market', 'notifications'],
          }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Attempt reconnection after 5 seconds
          setTimeout(initializeWebSocket, 5000);
        };
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'market_update':
        updateMarketData(message.data);
        break;
      case 'notification':
        showNotification(message.data);
        break;
      case 'activity':
        addActivity(message.data);
        break;
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/v2/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken}`,
          },
        }),
        fetch('/api/v2/dashboard/activities', {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken}`,
          },
        }),
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
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateMarketData = (data: any) => {
    setStats(prev => prev ? {
      ...prev,
      marketOverview: {
        trending: data.trending || prev.marketOverview.trending,
      },
    } : null);
  };

  const showNotification = (data: any) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {data.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {data.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
            {data.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
            {data.type === 'info' && <Bell className="h-5 w-5 text-blue-500" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">{data.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{data.message}</p>
          </div>
        </div>
      </motion.div>
    ));
  };

  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev].slice(0, 10));
  };

  // Mock data for charts (replace with real data from API)
  const chartData = {
    reportTrend: [
      { date: 'Mon', reports: 12 },
      { date: 'Tue', reports: 19 },
      { date: 'Wed', reports: 15 },
      { date: 'Thu', reports: 22 },
      { date: 'Fri', reports: 18 },
      { date: 'Sat', reports: 25 },
      { date: 'Sun', reports: 20 },
    ],
    entityBreakdown: [
      { name: 'Companies', value: 45, color: '#3b82f6' },
      { name: 'Stocks', value: 30, color: '#10b981' },
      { name: 'Crypto', value: 15, color: '#f59e0b' },
      { name: 'Other', value: 10, color: '#6b7280' },
    ],
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-[60px]" />
                <Skeleton className="h-3 w-[100px] mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.reportsThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tracked Entities</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEntities || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Usage</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.apiUsage.percentage || 0}%
              </div>
              <Progress
                value={stats?.apiUsage.percentage || 0}
                className="h-1 mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Report Generation Trend</CardTitle>
              <CardDescription>
                Your report activity over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData.reportTrend}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Entity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Entity Distribution</CardTitle>
              <CardDescription>
                Breakdown of tracked entities by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData.entityBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.entityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
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
      </div>

      {/* Market Overview */}
      {stats?.marketOverview?.trending && (
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