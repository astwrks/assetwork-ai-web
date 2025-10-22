'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/modal';
import {
  Plus,
  Search,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Users,
  Sparkles,
  Grid,
  List,
  Filter,
  Download,
  Share2,
  Heart,
  Eye,
  MessageSquare,
  Settings,
  LogOut,
  User,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Widget {
  id: string;
  title: string;
  type: string;
  data: any;
  chartConfig: any;
  settings: any;
  createdAt: string;
  views: number;
  likes: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [credits, setCredits] = useState<number | 'unlimited'>(100);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchWidgets();
      fetchUserCredits();
    }
  }, [status, router]);

  const fetchWidgets = async () => {
    try {
      const response = await axios.get('/api/widgets');
      setWidgets(response.data.widgets || []);
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await axios.get('/api/user/credits');
      setCredits(response.data.credits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const handleGenerateWidget = async () => {
    if (!aiQuery.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/widgets/generate', {
        query: aiQuery,
      });

      if (response.data.success) {
        toast.success('Widget generated successfully!');
        setShowCreateModal(false);
        setAiQuery('');
        fetchWidgets();
        setCredits(response.data.creditsRemaining);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate widget');
    } finally {
      setGenerating(false);
    }
  };

  const stats = [
    {
      title: 'Total Widgets',
      value: widgets.length,
      icon: Grid,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'AI Credits',
      value: credits === 'unlimited' ? '∞' : credits,
      icon: Sparkles,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Total Views',
      value: widgets.reduce((sum, w) => sum + (w.views || 0), 0),
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Likes',
      value: widgets.reduce((sum, w) => sum + (w.likes || 0), 0),
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const filteredWidgets = widgets.filter(widget =>
    widget.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Header */}
      <header className="bg-background dark:bg-background border-b border-border dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">AssetWorks</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/financial-playground">
                <Button variant="ghost" size="icon" title="Financial Playground">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <div className="relative group">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-background dark:bg-background rounded-lg shadow-lg border border-border dark:border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-muted dark:hover:bg-secondary">
                    Profile
                  </Link>
                  <Link href="/billing" className="block px-4 py-2 text-sm hover:bg-muted dark:hover:bg-secondary">
                    Billing
                  </Link>
                  <hr className="my-1 border-border dark:border-border" />
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-muted dark:hover:bg-secondary">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-primary-foreground">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-1">
            Here's an overview of your financial analytics dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">{stat.title}</p>
                      <p className="text-xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Widgets Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Widgets</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Widget
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Widget</DialogTitle>
                    <DialogDescription>
                      Describe what financial analysis or visualization you need
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Query
                      </label>
                      <textarea
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder="Example: Compare AAPL and MSFT stock performance over the last 3 months"
                        className="w-full h-32 px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Credits required: 2 | You have: {credits === 'unlimited' ? '∞' : credits}
                      </p>
                      <Button onClick={handleGenerateWidget} loading={generating}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Widget
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Widgets Grid/List */}
          {filteredWidgets.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-12 h-12 bg-muted dark:bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-2">No widgets yet</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                  Create your first widget to start analyzing financial data
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Widget
                </Button>
              </div>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {filteredWidgets.map((widget) => (
                <motion.div
                  key={widget.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      {widget.type === 'chart' && <BarChart3 className="w-12 h-12 text-muted-foreground" />}
                      {widget.type === 'metric' && <TrendingUp className="w-12 h-12 text-muted-foreground" />}
                      {widget.type === 'table' && <Grid className="w-12 h-12 text-muted-foreground" />}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{widget.title}</CardTitle>
                      <CardDescription>
                        Created {new Date(widget.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground dark:text-muted-foreground">
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {widget.views}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {widget.likes}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline">
                        View Widget
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-primary" />
                Market Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Get real-time market insights and trending stocks
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Portfolio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Analyze your portfolio performance and allocation
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-secondary" />
                AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Get AI-powered market predictions and insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}