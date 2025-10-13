'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Share2,
  Printer,
  BarChart3,
  Table,
  FileText,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Maximize2,
  Edit3,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatModelName } from '@/lib/utils/modelFormatter';
import InteractiveSection from './InteractiveSection';
import ReportMetricsTicker from './ReportMetricsTicker';

interface Report {
  _id: string;
  threadId: string;
  htmlContent: string;
  sections: Array<{
    id: string;
    type: 'chart' | 'table' | 'text' | 'metric' | 'insight';
    title: string;
    htmlContent: string;
    order: number;
  }>;
  insights: Array<{
    id: string;
    text: string;
    severity: 'info' | 'warning' | 'critical' | 'success';
  }>;
  metadata?: {
    generatedBy: string;
    model: string;
    provider: string;
    prompt: string;
    generationTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Section {
  _id: string;
  reportId: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'insight' | 'custom';
  title: string;
  htmlContent: string;
  order: number;
  version: number;
  editHistory?: Array<{
    version: number;
    htmlContent: string;
    prompt?: string;
    editedBy: string;
    editedAt: string;
  }>;
  metadata?: {
    originallyGeneratedBy?: string;
    lastModifiedBy?: string;
    model?: string;
    originalPrompt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportDisplayProps {
  threadId?: string;
  reportId?: string;
  messages?: any[];
  onClose?: () => void;

  // Interactive section props
  sections?: Section[];
  selectedSectionId?: string | null;
  editingContext?: {
    type: 'edit' | 'add';
    sectionId?: string;
    section?: Section;
    position?: number;
  } | null;
  sectionPreviewContent?: Record<string, string>;
  sectionStreamingState?: Record<string, boolean>;
  collapsedSections?: Record<string, boolean>;

  // Handlers for interactive sections
  onSectionSelect?: (sectionId: string) => void;
  onSectionEdit?: (section: Section) => void;
  onSectionAdd?: (position: number) => void;
  onSectionDelete?: (sectionId: string) => void;
  onSectionDuplicate?: (sectionId: string) => void;
  onSectionMove?: (sectionId: string, direction: 'up' | 'down') => void;
  onSectionCollapse?: (sectionId: string) => void;
  onCancelEdit?: () => void;
}

export default function ReportDisplay({
  threadId,
  reportId,
  messages,
  onClose,
  // Interactive section props
  sections,
  selectedSectionId,
  editingContext,
  sectionPreviewContent,
  sectionStreamingState,
  collapsedSections,
  // Handlers
  onSectionSelect,
  onSectionEdit,
  onSectionAdd,
  onSectionDelete,
  onSectionDuplicate,
  onSectionMove,
  onSectionCollapse,
  onCancelEdit,
}: ReportDisplayProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Determine if we're in interactive mode
  const isInteractiveMode = sections && sections.length > 0;

  useEffect(() => {
    console.log('🔍 ReportDisplay useEffect triggered');
    console.log('📊 Props:', { reportId, threadId, messagesCount: messages?.length });

    if (reportId) {
      console.log('✅ Using direct reportId:', reportId);
      fetchReport();
    } else if (messages && messages.length > 0) {
      console.log('📨 Checking messages for reportId...');
      console.log('📝 All messages:', messages.map(m => ({
        role: m.role,
        hasReportId: !!m.reportId,
        reportId: m.reportId,
        hasHtmlContent: !!m.htmlContent,
        _id: m._id
      })));

      // Check messages for the latest report with reportId
      const latestReportMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant' && msg.reportId);

      console.log('🎯 Latest report message:', latestReportMessage ? {
        reportId: latestReportMessage.reportId,
        hasHtmlContent: !!latestReportMessage.htmlContent,
        _id: latestReportMessage._id
      } : 'NOT FOUND');

      if (latestReportMessage && latestReportMessage.reportId) {
        console.log('✅ Fetching report with ID:', latestReportMessage.reportId);
        // Fetch the actual report using the reportId
        fetchReportById(latestReportMessage.reportId);
      } else {
        console.warn('⚠️ No report message found with reportId');
        setReport(null);
        setLoading(false);
      }
    } else if (threadId) {
      console.log('🔄 Fetching latest report for thread:', threadId);
      fetchLatestReport();
    } else {
      console.log('❌ No reportId, messages, or threadId provided');
      setReport(null);
      setLoading(false);
    }
  }, [reportId, threadId, messages]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/playground/reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportById = async (reportId: string) => {
    console.log('🌐 fetchReportById called with:', reportId);
    try {
      setLoading(true);
      const url = `/api/playground/reports/${reportId}`;
      console.log('📡 Fetching from URL:', url);

      const response = await fetch(url);
      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ Failed to fetch report:', response.status);
        setReport(null);
        return;
      }

      const data = await response.json();
      console.log('✅ Report data received:', {
        hasReport: !!data.report,
        reportId: data.report?._id,
        hasHtmlContent: !!data.report?.htmlContent,
        sectionsCount: data.report?.sections?.length
      });

      setReport(data.report || data);
    } catch (error) {
      console.error('💥 Error fetching report by ID:', error);
      setReport(null);
    } finally {
      setLoading(false);
      console.log('🏁 fetchReportById completed');
    }
  };

  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/playground/threads/${threadId}/latest-report`);
      if (!response.ok) {
        // No report yet
        setReport(null);
        return;
      }
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching latest report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'html') => {
    try {
      toast.success(`Exporting as ${format.toUpperCase()}...`);

      if (format === 'html') {
        // Simple HTML export
        const blob = new Blob([report?.htmlContent || ''], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${report?._id}.html`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported!');
      } else {
        // Call export API for PDF/Excel
        const response = await fetch(`/api/playground/reports/${report?._id}/export-${format}`, {
          method: 'POST',
        });
        if (!response.ok) throw new Error(`Export failed`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${report?._id}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/playground/reports/${report?._id}/share`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Share failed');
      const data = await response.json();

      // Copy share link to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      case 'metric':
        return <DollarSign className="w-4 h-4" />;
      case 'insight':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">No report generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to generate your first report
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Usage Metrics Ticker - Show whenever we have a reportId */}
      {reportId && (
        <ReportMetricsTicker reportId={reportId} />
      )}

      {/* Report Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Financial Report</h3>
            {report.metadata?.model && (
              <Badge variant="secondary" className="text-xs">
                {formatModelName(report.metadata.model)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleShare}
              title="Share Report"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => window.print()}
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleExport('pdf')}
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{report.sections?.length || 0} sections</span>
          <span>{report.insights?.length || 0} insights</span>
          {report.metadata?.generationTime && (
            <span>{(report.metadata.generationTime / 1000).toFixed(1)}s generation</span>
          )}
        </div>
      </div>

      {/* Insights Summary */}
      {report.insights && report.insights.length > 0 && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-medium mb-2">Key Insights</h4>
          <div className="space-y-2">
            {report.insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="flex items-start gap-2">
                <Badge variant={getSeverityColor(insight.severity) as any} className="mt-0.5">
                  {insight.severity}
                </Badge>
                <p className="text-xs text-muted-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Content */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {/* Section Navigation */}
          {report.sections && report.sections.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-3 border-b">
              {report.sections
                .filter((section) =>
                  section.title &&
                  section.title.trim() !== '' &&
                  !section.title.toLowerCase().includes('untitled')
                )
                .map((section) => (
                  <Button
                    key={section.id}
                    variant={selectedSection === section.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      setSelectedSection(section.id);
                      // Scroll to section
                      document.getElementById(section.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                  >
                    {getSectionIcon(section.type)}
                    <span className="ml-1">{section.title}</span>
                  </Button>
                ))}
            </div>
          )}

          {/* Render Content - Interactive Sections or Static HTML */}
          {isInteractiveMode ? (
            <div className="space-y-6">
              {sections?.map((section, index) => (
                <InteractiveSection
                  key={section._id}
                  sectionId={section._id}
                  reportId={section.reportId}
                  htmlContent={section.htmlContent}
                  title={section.title}
                  order={section.order}
                  isFirst={index === 0}
                  isLast={index === (sections.length - 1)}
                  isSelected={selectedSectionId === section._id}
                  isCollapsed={collapsedSections?.[section._id] || false}
                  isInEditMode={editingContext?.sectionId === section._id}
                  isStreaming={sectionStreamingState?.[section._id] || false}
                  previewContent={sectionPreviewContent?.[section._id]}
                  onSelect={() => onSectionSelect?.(section._id)}
                  onEdit={() => onSectionEdit?.(section)}
                  onCancelEdit={onCancelEdit}
                  onDelete={() => onSectionDelete?.(section._id)}
                  onDuplicate={() => onSectionDuplicate?.(section._id)}
                  onMoveUp={() => onSectionMove?.(section._id, 'up')}
                  onMoveDown={() => onSectionMove?.(section._id, 'down')}
                  onDownload={(sectionId, htmlContent, title) => {
                    // Simple HTML download
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Section downloaded!');
                  }}
                  onToggleCollapse={() => onSectionCollapse?.(section._id)}
                />
              ))}
            </div>
          ) : (
            <div
              className="prose max-w-none report-content"
              dangerouslySetInnerHTML={{ __html: report.htmlContent }}
            />
          )}
        </div>
      </ScrollArea>

      {/* Action Bar */}
      <div className="px-4 py-3 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
            >
              <Table className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast('Opening in editor...', { icon: 'ℹ️' });
                // TODO: Implement edit mode
              }}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Open in new tab
              const win = window.open('', '_blank');
              if (win) {
                win.document.write(report.htmlContent);
                win.document.close();
              }
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full
          </Button>
        </div>
      </div>
    </div>
  );
}