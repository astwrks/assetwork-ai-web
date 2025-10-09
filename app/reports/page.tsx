'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Search,
  Filter,
  Download,
  Calendar,
  BarChart3,
  TrendingDown,
  DollarSign,
  Percent,
  ArrowUp,
  ArrowDown,
  FileText,
  Eye,
  Share2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Report {
  id: string;
  name: string;
  type: 'Stock' | 'Portfolio' | 'Market' | 'Analysis';
  date: string;
  status: 'Active' | 'Archived';
  performance: number;
  value: string;
  change: number;
  views: number;
}

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sample data
  const reports: Report[] = [
    {
      id: '1',
      name: 'Apple Inc. (AAPL)',
      type: 'Stock',
      date: '2025-03-10',
      status: 'Active',
      performance: 15.3,
      value: '$174.25',
      change: 2.4,
      views: 1234,
    },
    {
      id: '2',
      name: 'Microsoft Corporation (MSFT)',
      type: 'Stock',
      date: '2025-03-10',
      status: 'Active',
      performance: 22.8,
      value: '$412.50',
      change: -1.2,
      views: 987,
    },
    {
      id: '3',
      name: 'Technology Portfolio Q1 2025',
      type: 'Portfolio',
      date: '2025-03-09',
      status: 'Active',
      performance: 18.5,
      value: '$1.2M',
      change: 3.7,
      views: 2341,
    },
    {
      id: '4',
      name: 'S&P 500 Market Analysis',
      type: 'Market',
      date: '2025-03-08',
      status: 'Active',
      performance: 12.1,
      value: '5,234.18',
      change: 0.8,
      views: 3456,
    },
    {
      id: '5',
      name: 'Tesla Inc. (TSLA)',
      type: 'Stock',
      date: '2025-03-07',
      status: 'Active',
      performance: -8.2,
      value: '$185.30',
      change: -4.1,
      views: 1876,
    },
    {
      id: '6',
      name: 'Google (GOOGL)',
      type: 'Stock',
      date: '2025-03-07',
      status: 'Active',
      performance: 28.4,
      value: '$142.65',
      change: 1.9,
      views: 1654,
    },
    {
      id: '7',
      name: 'Growth Stocks Portfolio',
      type: 'Portfolio',
      date: '2025-03-06',
      status: 'Archived',
      performance: 32.1,
      value: '$850K',
      change: 5.2,
      views: 987,
    },
    {
      id: '8',
      name: 'NASDAQ Composite Analysis',
      type: 'Market',
      date: '2025-03-05',
      status: 'Active',
      performance: 15.7,
      value: '16,421.45',
      change: 1.3,
      views: 2134,
    },
  ];

  const stats = [
    {
      title: 'Total Reports',
      value: '127',
      change: '+12%',
      trend: 'up',
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Reports',
      value: '94',
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Views',
      value: '45.2K',
      change: '+23%',
      trend: 'up',
      icon: Eye,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Avg. Performance',
      value: '+18.4%',
      change: '+2.1%',
      trend: 'up',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Stock':
        return 'bg-primary/10 text-primary';
      case 'Portfolio':
        return 'bg-secondary/10 text-secondary';
      case 'Market':
        return 'bg-green-100 text-green-600';
      case 'Analysis':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-muted text-foreground';
    }
  };

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
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/ai-chat">
                <Button variant="ghost">AI Chat</Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost">Settings</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-primary-foreground flex items-center">
            <BarChart3 className="w-7 h-7 mr-2 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            View and manage all your financial reports and analytics
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
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUp className="w-4 h-4 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Button>
              <Button className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              {filteredReports.length} reports found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Report Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Value</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Change</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Performance</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Views</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReports.map((report) => (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mr-3">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium">{report.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getTypeColor(report.type)} variant="secondary">
                          {report.type}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={report.status === 'Active' ? 'default' : 'secondary'}
                          className={report.status === 'Active' ? 'bg-green-100 text-green-600' : ''}
                        >
                          {report.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {report.value}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`flex items-center justify-end ${report.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {report.change >= 0 ? (
                            <ArrowUp className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDown className="w-4 h-4 mr-1" />
                          )}
                          <span className="font-medium">{Math.abs(report.change)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-semibold ${report.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {report.performance >= 0 ? '+' : ''}{report.performance}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">
                        <div className="flex items-center justify-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {report.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Share">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="More">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-1">Growth Stocks Portfolio</p>
              <p className="text-lg text-green-600 font-semibold">+32.1%</p>
              <p className="text-sm text-muted-foreground mt-2">YTD Performance</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-1">$2.85M</p>
              <div className="flex items-center text-green-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span className="font-semibold">+12.4%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">From last month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Percent className="w-5 h-5 mr-2 text-secondary" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-1">78.5%</p>
              <div className="flex items-center text-green-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span className="font-semibold">+3.2%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Positive reports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
