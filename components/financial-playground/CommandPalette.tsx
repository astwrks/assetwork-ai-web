'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  FileText,
  Plus,
  Download,
  Share2,
  Settings,
  Archive,
  Star,
  MessageSquare,
  TrendingUp,
  BarChart3,
  PieChart,
  Calculator,
  Calendar,
  DollarSign,
  Hash,
  Users,
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: string, data?: any) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
  onAction
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<string[]>(['home']);

  const currentPage = pages[pages.length - 1];

  // Reset on close
  useEffect(() => {
    if (!open) {
      setPages(['home']);
      setSearch('');
    }
  }, [open]);

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const handleAction = (action: string, data?: any) => {
    runCommand(() => {
      if (onAction) {
        onAction(action, data);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm">
              No results found.
            </Command.Empty>

            {currentPage === 'home' && (
              <>
                <Command.Group heading="Quick Actions">
                  <Command.Item onSelect={() => handleAction('new-report')}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Report</span>
                    <kbd className="ml-auto text-xs bg-muted px-2 py-1 rounded">⌘N</kbd>
                  </Command.Item>
                  <Command.Item onSelect={() => setPages([...pages, 'templates'])}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Use Template</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('quick-analysis')}>
                    <Zap className="mr-2 h-4 w-4" />
                    <span>Quick Analysis</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Reports">
                  <Command.Item onSelect={() => setPages([...pages, 'report-types'])}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Generate Report</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('view-dashboard')}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>View Dashboard</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('export-pdf')}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export to PDF</span>
                    <kbd className="ml-auto text-xs bg-muted px-2 py-1 rounded">⌘E</kbd>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="AI Features">
                  <Command.Item onSelect={() => setPages([...pages, 'ai-modes'])}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Change AI Mode</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('ai-insights')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Generate Insights</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('ai-forecast')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>AI Forecast</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Navigation">
                  <Command.Item onSelect={() => handleAction('go-to-threads')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>All Threads</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('go-to-starred')}>
                    <Star className="mr-2 h-4 w-4" />
                    <span>Starred</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('go-to-archive')}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archive</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Settings">
                  <Command.Item onSelect={() => handleAction('preferences')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                    <kbd className="ml-auto text-xs bg-muted px-2 py-1 rounded">⌘,</kbd>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('share')}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share & Collaborate</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('team')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Team Settings</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {currentPage === 'templates' && (
              <>
                <Command.Item onSelect={() => setPages(['home'])} className="mb-2">
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  <span>Back to menu</span>
                </Command.Item>

                <Command.Group heading="Financial Templates">
                  <Command.Item onSelect={() => handleAction('template', 'quarterly-earnings')}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Quarterly Earnings Report</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'cash-flow')}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Cash Flow Analysis</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'revenue-forecast')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Revenue Forecast</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'expense-breakdown')}>
                    <PieChart className="mr-2 h-4 w-4" />
                    <span>Expense Breakdown</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'yoy-comparison')}>
                    <Calculator className="mr-2 h-4 w-4" />
                    <span>Year-over-Year Comparison</span>
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Market Analysis">
                  <Command.Item onSelect={() => handleAction('template', 'market-overview')}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Market Overview</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'competitor-analysis')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Competitor Analysis</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('template', 'sector-performance')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Sector Performance</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {currentPage === 'report-types' && (
              <>
                <Command.Item onSelect={() => setPages(['home'])} className="mb-2">
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  <span>Back to menu</span>
                </Command.Item>

                <Command.Group heading="Report Types">
                  <Command.Item onSelect={() => handleAction('generate-report', 'web-dashboard')}>
                    <Hash className="mr-2 h-4 w-4" />
                    <span>Web Dashboard</span>
                    <span className="ml-auto text-xs text-muted-foreground">Interactive HTML</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('generate-report', 'mobile-widget')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Mobile Widget</span>
                    <span className="ml-auto text-xs text-muted-foreground">Compact view</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('generate-report', 'executive-summary')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Executive Summary</span>
                    <span className="ml-auto text-xs text-muted-foreground">High-level</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('generate-report', 'detailed-analysis')}>
                    <Calculator className="mr-2 h-4 w-4" />
                    <span>Detailed Analysis</span>
                    <span className="ml-auto text-xs text-muted-foreground">In-depth</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {currentPage === 'ai-modes' && (
              <>
                <Command.Item onSelect={() => setPages(['home'])} className="mb-2">
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  <span>Back to menu</span>
                </Command.Item>

                <Command.Group heading="AI Modes">
                  <Command.Item onSelect={() => handleAction('set-ai-mode', 'web-report')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Web Financial Reports</span>
                    <span className="ml-auto text-xs text-muted-foreground">Default</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('set-ai-mode', 'web-dashboard-v2')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Modern Dashboard (v2)</span>
                    <span className="ml-auto text-xs text-muted-foreground">Cards & widgets</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('set-ai-mode', 'mobile-widget')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Mobile Widget Designer</span>
                    <span className="ml-auto text-xs text-muted-foreground">200px widgets</span>
                  </Command.Item>
                  <Command.Item onSelect={() => handleAction('set-ai-mode', 'custom')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Custom Prompt</span>
                    <span className="ml-auto text-xs text-muted-foreground">Advanced</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}
          </Command.List>

          <div className="border-t p-2">
            <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted px-1.5 py-0.5 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted px-1.5 py-0.5 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-muted px-1.5 py-0.5 rounded">esc</kbd>
                  Close
                </span>
              </div>
              <span>AssetWorks AI</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}