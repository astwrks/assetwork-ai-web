'use client';

import { useState } from 'react';
import { 
  FileText, 
  Database, 
  Bot, 
  Settings, 
  Plus, 
  Search,
  Folder,
  Clock,
  Star,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface MainSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  selectedReport?: string;
  onReportSelect: (reportId: string) => void;
}

const navigationItems = [
  { id: 'reports', label: 'Reports', icon: FileText, color: 'text-blue-600' },
  { id: 'data-sources', label: 'Data Sources', icon: Database, color: 'text-green-600' },
  { id: 'ai-agents', label: 'AI Agents', icon: Bot, color: 'text-purple-600' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' },
];

const recentReports = [
  { id: '1', title: 'Q4 Financial Analysis', lastModified: '2 hours ago', status: 'draft' },
  { id: '2', title: 'Market Trends Report', lastModified: '1 day ago', status: 'published' },
  { id: '3', title: 'Portfolio Performance', lastModified: '3 days ago', status: 'draft' },
];

const reportTemplates = [
  { id: 't1', title: 'Financial Analysis', description: 'Standard financial report template' },
  { id: 't2', title: 'Market Research', description: 'Market analysis and trends' },
  { id: 't3', title: 'Risk Assessment', description: 'Risk evaluation and mitigation' },
];

export default function MainSidebar({ 
  activeView, 
  onViewChange, 
  selectedReport, 
  onReportSelect 
}: MainSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const renderReportsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Reports</h3>
        <Button size="sm" variant="outline" className="h-6 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {recentReports.map((report) => (
          <Card 
            key={report.id}
            className={`cursor-pointer transition-colors ${
              selectedReport === report.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => onReportSelect(report.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {report.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {report.lastModified}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'published' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    {report.status}
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Templates</h3>
        <div className="space-y-2">
          {reportTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <CardContent className="p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {template.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDataSourcesView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Connected Sources</h3>
        <Button size="sm" variant="outline" className="h-6 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">PostgreSQL DB</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">CSV Files</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">3 files uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAIAgentsView = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Agents</h3>
      
      <div className="space-y-2">
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Data Agent</h4>
                <p className="text-xs text-green-600 dark:text-green-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Analysis Agent</h4>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Settings</h3>
      
      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start h-8">
          <Settings className="h-4 w-4 mr-2" />
          General
        </Button>
        <Button variant="ghost" className="w-full justify-start h-8">
          <Bot className="h-4 w-4 mr-2" />
          AI Models
        </Button>
        <Button variant="ghost" className="w-full justify-start h-8">
          <Database className="h-4 w-4 mr-2" />
          Data Sources
        </Button>
        <Button variant="ghost" className="w-full justify-start h-8">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'reports':
        return renderReportsView();
      case 'data-sources':
        return renderDataSourcesView();
      case 'ai-agents':
        return renderAIAgentsView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderReportsView();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Builder</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${activeView === item.id ? item.color : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
