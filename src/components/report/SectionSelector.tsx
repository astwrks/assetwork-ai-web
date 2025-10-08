'use client';

import { useState } from 'react';
import { ReportSection } from '@/types/report.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Type, 
  BarChart3, 
  Table, 
  Settings, 
  Edit3, 
  Trash2, 
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface SectionSelectorProps {
  sections: ReportSection[];
  selectedSection?: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSectionUpdate: (sectionId: string, updates: Partial<ReportSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onSectionReorder: (sectionId: string, direction: 'up' | 'down') => void;
  onSectionDuplicate: (sectionId: string) => void;
}

export default function SectionSelector({
  sections,
  selectedSection,
  onSectionSelect,
  onSectionUpdate,
  onSectionDelete,
  onSectionReorder,
  onSectionDuplicate,
}: SectionSelectorProps) {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

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

  const getSectionColor = (type: ReportSection['type']) => {
    switch (type) {
      case 'text':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'chart':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'table':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    if (draggedSection && draggedSection !== targetSectionId) {
      const draggedIndex = sections.findIndex(s => s.id === draggedSection);
      const targetIndex = sections.findIndex(s => s.id === targetSectionId);
      
      if (draggedIndex < targetIndex) {
        onSectionReorder(draggedSection, 'down');
      } else {
        onSectionReorder(draggedSection, 'up');
      }
    }
    
    setDraggedSection(null);
  };

  const handleSectionToggle = (sectionId: string, visible: boolean) => {
    onSectionUpdate(sectionId, { 
      metadata: { 
        ...sections.find(s => s.id === sectionId)?.metadata,
        visible 
      } 
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Report Sections ({sections.length})
        </h3>
        <Button size="sm" variant="outline" className="h-6 px-2">
          <Settings className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-1">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const Icon = getSectionIcon(section.type);
            const isSelected = selectedSection === section.id;
            const isVisible = section.metadata?.visible !== false;
            
            return (
              <Card
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${!isVisible ? 'opacity-50' : ''}`}
                onClick={() => onSectionSelect(section.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${getSectionColor(section.type)}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {section.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {section.type} • Order {section.order}
                        </p>
                        {section.metadata?.lastModified && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Modified: {new Date(section.metadata.lastModified).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionToggle(section.id, !isVisible);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {isVisible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionDuplicate(section.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionReorder(section.id, 'up');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionReorder(section.id, 'down');
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSectionDelete(section.id);
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {section.aiPrompt && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        <strong>AI Prompt:</strong> {section.aiPrompt}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {sections.length === 0 && (
        <div className="text-center py-8">
          <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No sections yet. Use the chat to generate content.
          </p>
        </div>
      )}
    </div>
  );
}
