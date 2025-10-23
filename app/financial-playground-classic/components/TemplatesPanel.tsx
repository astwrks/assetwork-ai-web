/**
 * Templates Panel Component
 * Allows users to save, manage and apply report templates
 * Uses existing /api/playground/templates API
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Save,
  FileText,
  Trash2,
  Edit,
  Plus,
  Clock,
  Tag,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  systemPrompt?: string;
  category?: string;
  tags?: string[];
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesPanelProps {
  currentPrompt?: string;
  currentSystemPrompt?: string;
  onApplyTemplate: (template: Template) => void;
  className?: string;
}

export function TemplatesPanel({
  currentPrompt,
  currentSystemPrompt,
  onApplyTemplate,
  className
}: TemplatesPanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    content: currentPrompt || '',
    systemPrompt: currentSystemPrompt || '',
    category: 'general',
    tags: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/playground/templates', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Could not load templates');

      // Fallback demo templates
      setTemplates([
        {
          id: '1',
          name: 'Stock Analysis',
          description: 'Comprehensive stock analysis template',
          content: 'Analyze {STOCK_NAME} including fundamentals, technicals, and market sentiment',
          systemPrompt: 'You are a professional equity analyst with expertise in fundamental and technical analysis.',
          category: 'stocks',
          tags: ['analysis', 'stocks', 'fundamentals'],
          usageCount: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Sector Comparison',
          description: 'Compare companies within a sector',
          content: 'Compare the top companies in the {SECTOR} sector, focusing on market position, financials, and growth prospects',
          systemPrompt: 'You are a sector specialist providing detailed comparative analysis.',
          category: 'sectors',
          tags: ['comparison', 'sectors'],
          usageCount: 8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'IPO Analysis',
          description: 'Evaluate upcoming or recent IPOs',
          content: 'Analyze the IPO of {COMPANY_NAME}, including valuation, business model, and investment potential',
          category: 'ipo',
          tags: ['ipo', 'valuation'],
          usageCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      const response = await fetch('/api/playground/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newTemplate,
          tags: newTemplate.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const { template } = await response.json();
      setTemplates(prev => [template, ...prev]);
      setIsCreateDialogOpen(false);
      toast.success('Template saved successfully');

      // Reset form
      setNewTemplate({
        name: '',
        description: '',
        content: '',
        systemPrompt: '',
        category: 'general',
        tags: ''
      });
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Could not save template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/playground/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Could not delete template');
    }
  };

  const useTemplate = async (template: Template) => {
    try {
      // Track usage
      await fetch(`/api/playground/templates/${template.id}/use`, {
        method: 'POST',
        credentials: 'include',
      });

      onApplyTemplate(template);
      toast.success(`Applied template: ${template.name}`);
    } catch (error) {
      console.error('Failed to track template usage:', error);
      // Still apply the template even if tracking fails
      onApplyTemplate(template);
    }
  };

  const duplicateTemplate = (template: Template) => {
    setNewTemplate({
      name: `${template.name} (Copy)`,
      description: template.description,
      content: template.content,
      systemPrompt: template.systemPrompt || '',
      category: template.category || 'general',
      tags: template.tags?.join(', ') || ''
    });
    setIsCreateDialogOpen(true);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'stocks': return 'bg-blue-500/10 text-blue-600';
      case 'sectors': return 'bg-green-500/10 text-green-600';
      case 'ipo': return 'bg-purple-500/10 text-purple-600';
      case 'crypto': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className={className}>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Prompt Templates</h3>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Save your current prompt as a reusable template
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Stock Analysis Template"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this template does"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Prompt Template</Label>
                <Textarea
                  id="content"
                  className="min-h-[100px]"
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Use {VARIABLES} for dynamic parts, e.g., Analyze {STOCK_NAME}"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                <Textarea
                  id="systemPrompt"
                  className="min-h-[80px]"
                  value={newTemplate.systemPrompt}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Optional system prompt for this template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., stocks, sectors, crypto"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newTemplate.tags}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="analysis, fundamentals, comparison"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate} disabled={!newTemplate.name || !newTemplate.content}>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No templates found' : 'No templates yet. Create your first template!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <AnimatePresence>
            <div className="space-y-3 pr-3">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedTemplate(
                      selectedTemplate?.id === template.id ? null : template
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {template.name}
                            {template.usageCount && template.usageCount > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {template.category && (
                            <Badge variant="outline" className={`text-xs ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <AnimatePresence>
                      {selectedTemplate?.id === template.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <CardContent>
                            <div className="space-y-3">
                              {/* Template Content Preview */}
                              <div className="p-3 rounded bg-muted/50 text-xs font-mono">
                                {template.content.substring(0, 200)}
                                {template.content.length > 200 && '...'}
                              </div>

                              {/* Tags */}
                              {template.tags && template.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {template.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Usage Stats */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {template.usageCount && (
                                  <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Used {template.usageCount} times
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(template.updatedAt).toLocaleDateString()}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    useTemplate(template);
                                  }}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateTemplate(template);
                                  }}
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Duplicate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTemplate(template.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </ScrollArea>
      )}

      {/* Stats Footer */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>{filteredTemplates.length} templates available</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setNewTemplate({
              name: '',
              description: '',
              content: currentPrompt || '',
              systemPrompt: currentSystemPrompt || '',
              category: 'general',
              tags: ''
            });
            setIsCreateDialogOpen(true);
          }}
        >
          <Save className="w-3 h-3 mr-1" />
          Save Current
        </Button>
      </div>
    </div>
  );
}