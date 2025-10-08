'use client';

import { useState, useEffect } from 'react';
import { Report, ReportSection } from '@/types/report.types';
import ReportEditor from './ReportEditor';
import ReportPreview from './ReportPreview';
import SectionSelector from './SectionSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Edit3, 
  Save, 
  Share2, 
  Download, 
  Plus,
  FileText,
  BarChart3,
  Table,
  Settings
} from 'lucide-react';

interface ReportCanvasProps {
  reportId?: string;
  initialData?: Report;
  onReportUpdate: (report: Report) => void;
}

const defaultReport: Report = {
  id: 'new-report',
  title: 'Untitled Report',
  description: '',
  sections: [
    {
      id: 'intro',
      type: 'text',
      title: 'Introduction',
      content: '<h2>Introduction</h2><p>This is the introduction section of your report. Click to edit or use the chat to modify this content.</p>',
      aiPrompt: 'Create an introduction section for a financial report',
      editable: true,
      order: 1,
    },
    {
      id: 'analysis',
      type: 'text',
      title: 'Financial Analysis',
      content: '<h2>Financial Analysis</h2><p>This section will contain your financial analysis. Use the chat to generate content based on your data.</p>',
      aiPrompt: 'Generate a comprehensive financial analysis section',
      editable: true,
      order: 2,
    },
    {
      id: 'charts',
      type: 'chart',
      title: 'Data Visualizations',
      content: '<h2>Data Visualizations</h2><div id="chart-container">Charts will be rendered here</div>',
      aiPrompt: 'Create interactive charts for financial data',
      editable: true,
      order: 3,
      metadata: {
        chartType: 'line',
        dataSource: 'market-data',
      },
    },
  ],
  metadata: {
    author: 'Current User',
    version: '1.0',
    tags: ['financial', 'analysis'],
  },
  dataSources: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'draft',
};

export default function ReportCanvas({ reportId, initialData, onReportUpdate }: ReportCanvasProps) {
  const [report, setReport] = useState<Report>(initialData || defaultReport);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setReport(initialData);
    }
  }, [initialData]);

  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<ReportSection>) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates, metadata: { ...section.metadata, lastModified: new Date() } }
          : section
      ),
      updatedAt: new Date(),
    }));
  };

  const handleAddSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type,
      title: `New ${type} Section`,
      content: `<h2>New ${type} Section</h2><p>This is a new ${type} section. Click to edit or use the chat to modify.</p>`,
      aiPrompt: `Create a new ${type} section`,
      editable: true,
      order: report.sections.length + 1,
    };

    setReport(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date(),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onReportUpdate(report);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save report:', error);
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Share report:', report.id);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export report:', report.id);
  };

  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'text':
        return FileText;
      case 'chart':
        return BarChart3;
      case 'table':
        return Table;
      default:
        return Settings;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {report.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {report.updatedAt.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('edit')}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Section Selector */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sections</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddSection('text')}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            {report.sections.map((section) => {
              const Icon = getSectionIcon(section.type);
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(section.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSection === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left truncate">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'edit' ? (
            <ReportEditor
              report={report}
              selectedSection={selectedSection}
              onSectionUpdate={handleSectionUpdate}
            />
          ) : (
            <ReportPreview
              report={report}
              selectedSection={selectedSection}
            />
          )}
        </div>
      </div>
    </div>
  );
}
