'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Download,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';

interface InteractiveSectionProps {
  sectionId: string;
  reportId: string;
  htmlContent: string;
  title: string;
  order: number;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  isCollapsed?: boolean;
  isInEditMode?: boolean;
  isStreaming?: boolean;
  previewContent?: string;
  onSelect: () => void;
  onEdit: (sectionId: string) => void;
  onCancelEdit?: () => void;
  onDelete: (sectionId: string) => void;
  onDuplicate: (sectionId: string) => void;
  onMoveUp: (sectionId: string) => void;
  onMoveDown: (sectionId: string) => void;
  onDownload: (sectionId: string, htmlContent: string, title: string) => void;
  onToggleCollapse?: (sectionId: string) => void;
}

export default function InteractiveSection({
  sectionId,
  reportId,
  htmlContent,
  title,
  order,
  isFirst,
  isLast,
  isSelected,
  isCollapsed = false,
  isInEditMode = false,
  isStreaming = false,
  previewContent,
  onSelect,
  onEdit,
  onCancelEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDownload,
  onToggleCollapse,
}: InteractiveSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Determine what content to display
  const displayContent = previewContent !== undefined ? previewContent : htmlContent;

  // Debug: Log when in edit mode
  useEffect(() => {
    if (isInEditMode) {
      console.log('🔧 Section in edit mode:', {
        sectionId,
        isSelected,
        isInEditMode,
        onCancelEdit: !!onCancelEdit,
        shouldShowXButton: isInEditMode && !!onCancelEdit
      });
    }
  }, [isInEditMode, isSelected, onCancelEdit, sectionId]);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSelected &&
        sectionRef.current &&
        !sectionRef.current.contains(event.target as Node)
      ) {
        // Don't deselect if clicking on toolbar buttons
        const target = event.target as HTMLElement;
        if (target.closest('.section-toolbar')) {
          return;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelected]);

  const handleOperation = async (
    operation: () => Promise<void> | void,
    operationName: string
  ) => {
    setIsOperating(true);
    try {
      await operation();
    } catch (error) {
      console.error(`Error ${operationName}:`, error);
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div
      ref={sectionRef}
      className={`relative transition-all duration-200 ${
        isInEditMode
          ? 'ring-2 ring-blue-500 ring-offset-4 bg-blue-50/30 animate-shimmer-pulse shadow-lg shadow-blue-500/20'
          : isSelected
          ? 'ring-2 ring-primary ring-offset-2'
          : isHovered
          ? 'ring-1 ring-gray-300'
          : ''
      }`}
      onMouseEnter={() => !isInEditMode && !isSelected && setIsHovered(true)}
      onMouseLeave={() => !isInEditMode && setIsHovered(false)}
      onClick={isInEditMode ? undefined : onSelect}
      style={{ cursor: isInEditMode ? 'default' : isSelected ? 'default' : 'pointer' }}
    >
      {/* Floating Toolbar */}
      {isSelected && (
        <div className="section-toolbar absolute -top-14 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-white border border-gray-300 rounded-lg shadow-2xl px-2 py-1.5 flex items-center gap-1 pointer-events-auto">
            {/* Collapse/Expand */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(sectionId);
                }}
                disabled={isOperating}
                className="h-8"
                title={isCollapsed ? "Expand section" : "Collapse section"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Edit */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(sectionId);
              }}
              disabled={isOperating || isInEditMode}
              className="h-8 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Edit section"
            >
              <Edit className="w-4 h-4" />
            </Button>

            {/* Download */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOperation(
                  () => onDownload(sectionId, htmlContent, title),
                  'downloading'
                );
              }}
              disabled={isOperating}
              className="h-8"
              title="Download section"
            >
              <Download className="w-4 h-4" />
            </Button>

            {/* Duplicate */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOperation(() => onDuplicate(sectionId), 'duplicating');
              }}
              disabled={isOperating}
              className="h-8"
              title="Duplicate section"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Move Up */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOperation(() => onMoveUp(sectionId), 'moving up');
              }}
              disabled={isOperating || isFirst}
              className="h-8"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>

            {/* Move Down */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOperation(() => onMoveDown(sectionId), 'moving down');
              }}
              disabled={isOperating || isLast}
              className="h-8"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Cancel Edit (only show if in edit mode) */}
            {isInEditMode && onCancelEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelEdit();
                }}
                disabled={isOperating}
                className="h-8"
                title="Cancel editing"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm('Are you sure you want to delete this section?')
                ) {
                  handleOperation(() => onDelete(sectionId), 'deleting');
                }
              }}
              disabled={isOperating}
              className="h-8 text-destructive hover:text-destructive"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {/* Drag Handle */}
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <div
              className="h-8 px-2 flex items-center cursor-grab active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isOperating && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Shimmer Loading State */}
      {isStreaming && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer z-40 pointer-events-none" />
      )}

      {/* Edit Mode Indicator */}
      {isInEditMode && (
        <div className="absolute top-2 left-2 z-30 bg-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
          <Edit className="w-3 h-3" />
          <span className="font-medium">Editing</span>
          {isStreaming && (
            <>
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              <span className="animate-pulse">AI generating...</span>
            </>
          )}
        </div>
      )}

      {/* Section Content */}
      {isCollapsed ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-7">Click to expand this section</p>
        </div>
      ) : (
        <div
          className={`report-section ${isInEditMode ? 'pointer-events-none' : ''}`}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      )}

      {/* Hover Indicator */}
      {isHovered && !isSelected && (
        <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
          Click to select
        </div>
      )}
    </div>
  );
}
