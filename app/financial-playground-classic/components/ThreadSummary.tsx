/**
 * Thread Summary Component
 * Auto-generates AI summaries of conversation threads
 * Uses existing /api/playground/threads/[threadId]/summary API
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  RefreshCw,
  Download,
  Copy,
  Check,
  Sparkles,
  Clock,
  Hash,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  List,
  Target,
  Lightbulb,
  BookOpen,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadSummaryData {
  summary: string;
  keyPoints: string[];
  topics: string[];
  decisions?: string[];
  actionItems?: string[];
  insights?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  messageCount: number;
  duration?: string;
  participants?: string[];
  generatedAt: string;
}

interface ThreadSummaryProps {
  threadId: string | null;
  messages: any[];
  autoGenerate?: boolean;
  className?: string;
  onSummaryGenerated?: (summary: ThreadSummaryData) => void;
}

export function ThreadSummary({
  threadId,
  messages,
  autoGenerate = false,
  className,
  onSummaryGenerated
}: ThreadSummaryProps) {
  const [summary, setSummary] = useState<ThreadSummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Auto-generate summary when thread reaches certain message count
  useEffect(() => {
    if (autoGenerate && messages.length >= 5 && !summary && !isGenerating) {
      generateSummary();
    }
  }, [messages.length, autoGenerate]);

  // Check if summary needs refresh (new messages since last generation)
  const needsRefresh = summary && messages.length > (summary.messageCount || 0);

  const generateSummary = async () => {
    if (!threadId || messages.length < 2) {
      toast.error('Not enough messages to generate summary');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/playground/threads/${threadId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          includeInsights: true,
          includeActionItems: true,
          includeDecisions: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const summaryData = data.summary || data;

      // Ensure we have all required fields with fallback values
      const processedSummary: ThreadSummaryData = {
        summary: summaryData.summary || 'No summary available',
        keyPoints: summaryData.keyPoints || [],
        topics: summaryData.topics || [],
        decisions: summaryData.decisions,
        actionItems: summaryData.actionItems,
        insights: summaryData.insights,
        sentiment: summaryData.sentiment,
        messageCount: messages.length,
        duration: summaryData.duration,
        participants: summaryData.participants,
        generatedAt: new Date().toISOString()
      };

      setSummary(processedSummary);
      setLastGeneratedAt(new Date());
      onSummaryGenerated?.(processedSummary);
      toast.success('Summary generated successfully');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast.error('Could not generate summary');

      // Fallback: Generate a basic summary locally
      const fallbackSummary: ThreadSummaryData = {
        summary: generateLocalSummary(messages),
        keyPoints: extractKeyPoints(messages),
        topics: extractTopics(messages),
        messageCount: messages.length,
        generatedAt: new Date().toISOString()
      };

      setSummary(fallbackSummary);
      setLastGeneratedAt(new Date());
    } finally {
      setIsGenerating(false);
    }
  };

  // Local summary generation (fallback)
  const generateLocalSummary = (messages: any[]): string => {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    if (userMessages.length === 0) return 'No user messages to summarize';

    const firstQuestion = userMessages[0]?.content?.substring(0, 100) || '';
    const lastResponse = assistantMessages[assistantMessages.length - 1]?.content?.substring(0, 200) || '';

    return `This conversation started with: "${firstQuestion}..." and covered ${userMessages.length} questions with ${assistantMessages.length} responses. The most recent discussion focused on: "${lastResponse}..."`;
  };

  // Extract key points from messages
  const extractKeyPoints = (messages: any[]): string[] => {
    const points: string[] = [];
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    assistantMessages.forEach((msg) => {
      // Look for numbered lists or bullet points
      const lines = msg.content.split('\n');
      lines.forEach((line: string) => {
        if (/^[\d]+\.|^[-•*]/.test(line.trim()) && line.length > 20) {
          points.push(line.trim().replace(/^[\d]+\.|^[-•*]/, '').trim());
        }
      });
    });

    return points.slice(0, 5); // Top 5 points
  };

  // Extract topics from conversation
  const extractTopics = (messages: any[]): string[] => {
    const topics = new Set<string>();
    const commonFinancialTerms = [
      'stocks', 'bonds', 'portfolio', 'investment', 'analysis',
      'market', 'trading', 'valuation', 'earnings', 'revenue',
      'profit', 'loss', 'dividend', 'equity', 'debt'
    ];

    messages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      commonFinancialTerms.forEach(term => {
        if (content.includes(term)) {
          topics.add(term.charAt(0).toUpperCase() + term.slice(1));
        }
      });
    });

    return Array.from(topics).slice(0, 6);
  };

  const copySummary = async () => {
    if (!summary) return;

    const fullSummary = `# Thread Summary\n\n${summary.summary}\n\n## Key Points\n${summary.keyPoints.map(p => `- ${p}`).join('\n')}\n\n## Topics\n${summary.topics.join(', ')}`;

    try {
      await navigator.clipboard.writeText(fullSummary);
      setIsCopied(true);
      toast.success('Summary copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const exportSummary = () => {
    if (!summary) return;

    const exportData = {
      ...summary,
      threadId,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thread-summary-${threadId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Summary exported');
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-500/10';
      case 'negative': return 'text-red-600 bg-red-500/10';
      case 'mixed': return 'text-yellow-600 bg-yellow-500/10';
      default: return 'text-gray-600 bg-gray-500/10';
    }
  };

  if (!threadId || messages.length < 2) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Thread Summary</CardTitle>
              <CardDescription className="text-xs">
                AI-generated overview of your conversation
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {needsRefresh && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                New messages
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={generateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {summary ? 'Refresh' : 'Generate'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isGenerating ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted">
                <Hash className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-semibold">{summary.messageCount}</div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>

              {summary.topics.length > 0 && (
                <div className="text-center p-2 rounded-lg bg-muted">
                  <BookOpen className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">{summary.topics.length}</div>
                  <div className="text-xs text-muted-foreground">Topics</div>
                </div>
              )}

              {summary.sentiment && (
                <div className="text-center p-2 rounded-lg bg-muted">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className={`text-sm font-semibold capitalize ${getSentimentColor(summary.sentiment)}`}>
                    {summary.sentiment}
                  </div>
                  <div className="text-xs text-muted-foreground">Sentiment</div>
                </div>
              )}
            </div>

            {/* Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-3">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3 pr-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm">{summary.summary}</p>
                    </div>

                    {summary.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {summary.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="keypoints" className="mt-3">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-3">
                    <AnimatePresence>
                      {summary.keyPoints.map((point, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-2 p-2 rounded hover:bg-muted/50"
                        >
                          <ChevronRight className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-xs">{point}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {summary.actionItems && summary.actionItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                          <Target className="w-3 h-3 inline mr-1" />
                          Action Items
                        </h5>
                        {summary.actionItems.map((item, index) => (
                          <div key={index} className="flex items-start gap-2 p-1">
                            <Check className="w-3 h-3 mt-0.5 text-green-600 flex-shrink-0" />
                            <span className="text-xs">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="insights" className="mt-3">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-3">
                    {summary.insights && summary.insights.length > 0 ? (
                      <AnimatePresence>
                        {summary.insights.map((insight, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-2 rounded bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-200/50"
                          >
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 mt-0.5 text-purple-600 flex-shrink-0" />
                              <span className="text-xs">{insight}</span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No specific insights extracted yet
                      </div>
                    )}

                    {summary.decisions && summary.decisions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                          <List className="w-3 h-3 inline mr-1" />
                          Decisions Made
                        </h5>
                        {summary.decisions.map((decision, index) => (
                          <div key={index} className="flex items-start gap-2 p-1">
                            <Check className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs">{decision}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  Generated {lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleTimeString() : 'recently'}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copySummary}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportSummary}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Generate a summary of this conversation
            </p>
            <Button onClick={generateSummary} size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}