/**
 * Report Editor Component
 * Allows inline editing of report sections
 * Uses existing /api/playground/reports/[reportId]/sections API
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  FileText,
  Check,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  visible?: boolean;
  metadata?: {
    lastEdited?: string;
    editCount?: number;
    tokens?: number;
  };
}

interface ReportEditorProps {
  reportId: string | null;
  sections: ReportSection[];
  onSectionsUpdate?: (sections: ReportSection[]) => void;
  className?: string;
}

export function ReportEditor({ reportId, sections: initialSections, onSectionsUpdate, className }: ReportEditorProps) {
  const [sections, setSections] = useState<ReportSection[]>(initialSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

  // New section form
  const [newSection, setNewSection] = useState({
    title: '',
    content: '',
    order: sections.length
  });

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const startEdit = (section: ReportSection) => {
    setEditingSection(section.id);
    setEditContent(section.content);
    setEditTitle(section.title);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
    setEditTitle('');
  };

  const saveSection = async (sectionId: string) => {
    if (!reportId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          content: editContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update section');
      }

      const { section } = await response.json();

      // Update local state
      const updatedSections = sections.map(s =>
        s.id === sectionId
          ? { ...s, title: editTitle, content: editContent, metadata: { ...s.metadata, lastEdited: new Date().toISOString(), editCount: (s.metadata?.editCount || 0) + 1 } }
          : s
      );

      setSections(updatedSections);
      onSectionsUpdate?.(updatedSections);
      setEditingSection(null);
      toast.success('Section updated successfully');
    } catch (error) {
      console.error('Failed to save section:', error);
      toast.error('Could not save section');
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = async () => {
    if (!reportId || !newSection.title || !newSection.content) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newSection.title,
          content: newSection.content,
          order: sections.length
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add section');
      }

      const { section } = await response.json();

      const updatedSections = [...sections, section];
      setSections(updatedSections);
      onSectionsUpdate?.(updatedSections);

      setIsAddDialogOpen(false);
      setNewSection({ title: '', content: '', order: sections.length + 1 });
      toast.success('Section added successfully');
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error('Could not add section');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!reportId) return;

    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections/${sectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete section');
      }

      const updatedSections = sections.filter(s => s.id !== sectionId);
      setSections(updatedSections);
      onSectionsUpdate?.(updatedSections);
      toast.success('Section deleted');
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error('Could not delete section');
    }
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const updatedSections = sections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    setSections(updatedSections);
    onSectionsUpdate?.(updatedSections);
  };

  const reorderSections = async (newOrder: ReportSection[]) => {
    setSections(newOrder);
    onSectionsUpdate?.(newOrder);

    // Update order on backend
    if (!reportId) return;

    try {
      await fetch(`/api/playground/reports/${reportId}/sections/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sectionIds: newOrder.map(s => s.id)
        })
      });
    } catch (error) {
      console.error('Failed to reorder sections:', error);
      toast.error('Could not save section order');
    }
  };

  const regenerateSection = async (sectionId: string) => {
    if (!reportId) return;

    setIsRegenerating(sectionId);
    try {
      const response = await fetch(`/api/playground/reports/${reportId}/sections/${sectionId}/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }

      const { section } = await response.json();

      const updatedSections = sections.map(s =>
        s.id === sectionId ? section : s
      );

      setSections(updatedSections);
      onSectionsUpdate?.(updatedSections);
      toast.success('Section regenerated with AI');
    } catch (error) {
      console.error('Failed to regenerate section:', error);
      toast.error('Could not regenerate section');
    } finally {
      setIsRegenerating(null);
    }
  };

  if (!reportId || sections.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Report Editor</CardTitle>
              <CardDescription className="text-xs">
                Edit, reorder, and manage report sections
              </CardDescription>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Section</DialogTitle>
                <DialogDescription>
                  Create a new section for your report
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Section Title
                  </label>
                  <Input
                    id="title"
                    value={newSection.title}
                    onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Executive Summary"
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    className="min-h-[150px]"
                    value={newSection.content}
                    onChange={(e) => setNewSection(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Section content..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addSection} disabled={!newSection.title || !newSection.content || isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-3">
          <Reorder.Group axis="y" values={sections} onReorder={reorderSections}>
            <AnimatePresence>
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <Reorder.Item key={section.id} value={section}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`group p-4 rounded-lg border bg-card transition-all ${
                        editingSection === section.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                      } ${!section.visible ? 'opacity-50' : ''}`}
                    >
                      {editingSection === section.id ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="font-semibold"
                            placeholder="Section title"
                          />
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] font-mono text-xs"
                            placeholder="Section content"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              disabled={isSaving}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveSection(section.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                {section.title}
                                {section.metadata?.editCount && section.metadata.editCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    Edited {section.metadata.editCount}x
                                  </Badge>
                                )}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSectionVisibility(section.id)}
                                title={section.visible ? 'Hide section' : 'Show section'}
                              >
                                {section.visible !== false ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => regenerateSection(section.id)}
                                disabled={isRegenerating === section.id}
                                title="Regenerate with AI"
                              >
                                {isRegenerating === section.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(section)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {section.content}
                          </p>

                          {section.metadata?.lastEdited && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Last edited: {new Date(section.metadata.lastEdited).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </Reorder.Item>
                ))}
              </div>
            </AnimatePresence>
          </Reorder.Group>
        </ScrollArea>

        {/* Section Stats */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{sections.length} sections</span>
          <span>{sections.filter(s => s.visible !== false).length} visible</span>
        </div>
      </CardContent>
    </Card>
  );
}