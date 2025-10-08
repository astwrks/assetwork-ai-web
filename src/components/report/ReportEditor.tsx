'use client';

import { useState, useEffect } from 'react';
import { Report, ReportSection } from '@/types/report.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit3, 
  Save, 
  X, 
  Eye, 
  Code, 
  Type,
  BarChart3,
  Table,
  Settings
} from 'lucide-react';

interface ReportEditorProps {
  report: Report;
  selectedSection: string | null;
  onSectionUpdate: (sectionId: string, updates: Partial<ReportSection>) => void;
}

export default function ReportEditor({ report, selectedSection, onSectionUpdate }: ReportEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionContent, setSectionContent] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const selectedSectionData = report.sections.find(s => s.id === selectedSection);

  useEffect(() => {
    if (selectedSectionData) {
      setSectionContent(selectedSectionData.content);
      setSectionTitle(selectedSectionData.title);
    }
  }, [selectedSectionData]);

  const handleEdit = () => {
    setEditingSection(selectedSection);
  };

  const handleSave = () => {
    if (selectedSection && editingSection) {
      onSectionUpdate(selectedSection, {
        title: sectionTitle,
        content: sectionContent,
      });
      setEditingSection(null);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    if (selectedSectionData) {
      setSectionContent(selectedSectionData.content);
      setSectionTitle(selectedSectionData.title);
    }
  };

  const handleContentChange = (value: string) => {
    setSectionContent(value);
  };

  const getSectionIcon = (type: ReportSection['type']) => {
    switch (type) {
      case 'text':
        return Type;
      case 'chart':
        return BarChart3;
      case 'table':
        return Table;
      default:
        return Settings;
    }
  };

  if (!selectedSectionData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Edit3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a section to edit
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a section from the sidebar to start editing your report
          </p>
        </div>
      </div>
    );
  }

  const Icon = getSectionIcon(selectedSectionData.type);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Section Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              {editingSection === selectedSection ? (
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  className="text-lg font-semibold"
                />
              ) : (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedSectionData.title}
                </h2>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedSectionData.type} section • Last modified: {selectedSectionData.metadata?.lastModified?.toLocaleString() || 'Never'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {editingSection === selectedSection ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </Button>
                <Button size="sm" onClick={handleEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 p-4">
        {editingSection === selectedSection ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content (HTML)
              </label>
              <Textarea
                value={sectionContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Enter HTML content for this section..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                AI Prompt
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedSectionData.aiPrompt}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isPreviewMode ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedSectionData.content }}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>HTML Source</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto text-sm">
                    <code>{selectedSectionData.content}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Section Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedSectionData.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Order:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedSectionData.order}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Editable:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {selectedSectionData.editable ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {selectedSectionData.metadata?.chartType && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {selectedSectionData.metadata.chartType}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-700 dark:text-gray-300">AI Prompt:</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedSectionData.aiPrompt}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
