'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  level: number;
  title: string;
  content: string;
  order: number;
}

interface ProgressiveReportRendererProps {
  streamingContent: string;
  isComplete?: boolean;
  className?: string;
}

/**
 * ProgressiveReportRenderer - Canvas-style section-by-section streaming
 *
 * Parses markdown content into sections as it streams in and renders each
 * section progressively with smooth animations.
 */
export function ProgressiveReportRenderer({
  streamingContent,
  isComplete = false,
  className = '',
}: ProgressiveReportRendererProps) {
  const [renderedSections, setRenderedSections] = useState<Section[]>([]);

  // Detect if content is HTML or Markdown
  const isHTMLContent = useMemo(() => {
    return streamingContent.trim().startsWith('<!DOCTYPE') ||
           streamingContent.trim().startsWith('<html') ||
           streamingContent.includes('<head>') ||
           streamingContent.includes('<body>');
  }, [streamingContent]);

  // Parse streaming content into sections
  const sections = useMemo(() => {
    if (!streamingContent) return [];

    // If it's HTML, parse HTML sections instead
    if (isHTMLContent) {
      return parseHTMLSections(streamingContent);
    }

    // Otherwise, parse as Markdown
    return parseMarkdownSections(streamingContent);
  }, [streamingContent, isHTMLContent]);

  // Parse HTML content into sections
  function parseHTMLSections(html: string): Section[] {
    const parsedSections: Section[] = [];

    // Extract content between <body> tags if it exists
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const contentToParse = bodyMatch ? bodyMatch[1] : html;

    // Match HTML headers (h1, h2, h3, etc.)
    const headerRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    const matches = [...contentToParse.matchAll(headerRegex)];

    if (matches.length === 0) {
      // No headers found, return entire content as one section
      return [{
        id: 'section-full',
        level: 0,
        title: 'Report',
        content: contentToParse,
        order: 0,
      }];
    }

    let lastIndex = 0;
    matches.forEach((match, index) => {
      const level = parseInt(match[1]);
      const title = match[2].replace(/<[^>]+>/g, ''); // Strip HTML tags from title
      const headerStart = match.index || 0;
      const nextMatch = matches[index + 1];
      const nextHeaderStart = nextMatch ? nextMatch.index || contentToParse.length : contentToParse.length;

      // Extract section content (from current header to next header)
      const sectionContent = contentToParse.slice(headerStart, nextHeaderStart).trim();

      parsedSections.push({
        id: `section-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`,
        level,
        title,
        content: sectionContent,
        order: index,
      });
    });

    return parsedSections;
  }

  // Parse Markdown content into sections
  function parseMarkdownSections(markdown: string): Section[] {
    const parsedSections: Section[] = [];
    const lines = markdown.split('\n');
    let currentSection: Partial<Section> | null = null;
    let sectionContent: string[] = [];
    let sectionOrder = 0;

    const finishSection = () => {
      if (currentSection && sectionContent.length > 0) {
        parsedSections.push({
          id: currentSection.id!,
          level: currentSection.level!,
          title: currentSection.title!,
          content: sectionContent.join('\n').trim(),
          order: sectionOrder++,
        });
        sectionContent = [];
      }
    };

    for (const line of lines) {
      // Match markdown headers (# Title, ## Subtitle, etc.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Finish previous section
        finishSection();

        // Start new section
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        currentSection = {
          id: `section-${sectionOrder}-${title.toLowerCase().replace(/\s+/g, '-')}`,
          level,
          title,
        };

        // Include the header in the section content
        sectionContent.push(line);
      } else if (currentSection) {
        // Accumulate content for current section
        sectionContent.push(line);
      } else {
        // Content before first header - create intro section
        if (!currentSection && line.trim()) {
          currentSection = {
            id: `section-intro`,
            level: 0,
            title: 'Introduction',
          };
        }
        if (currentSection) {
          sectionContent.push(line);
        }
      }
    }

    // Finish last section
    finishSection();

    return parsedSections;
  }

  // Progressively reveal sections with animation
  useEffect(() => {
    // Only add new sections that haven't been rendered yet
    if (sections.length > renderedSections.length) {
      const newSectionsToAdd = sections.slice(renderedSections.length);

      // Add sections one by one with a slight delay for smooth effect
      newSectionsToAdd.forEach((section, index) => {
        setTimeout(() => {
          setRenderedSections(prev => [...prev, section]);
        }, index * 100); // 100ms delay between sections
      });
    }
  }, [sections, renderedSections.length]);

  // Animation variants for sections
  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1], // Smooth easing curve
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      }
    }
  };

  if (!streamingContent || sections.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <AnimatePresence mode="popLayout">
        {renderedSections.map((section, index) => (
          <motion.div
            key={section.id}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <Card className={cn(
              'p-6 border-l-4 transition-all',
              section.level === 1 && 'border-l-blue-500',
              section.level === 2 && 'border-l-indigo-500',
              section.level === 3 && 'border-l-purple-500',
              section.level > 3 && 'border-l-gray-400',
              'hover:shadow-md'
            )}>
              {/* Section Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    Section {index + 1}
                  </span>
                  {section.level > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      H{section.level}
                    </span>
                  )}
                </div>
              </div>

              {/* Section Content - Rendered as HTML or Markdown */}
              {isHTMLContent ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              )}

              {/* Loading indicator for incomplete section */}
              {!isComplete && index === renderedSections.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Loading more content...</span>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Completion indicator */}
      {isComplete && renderedSections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Report Complete • {renderedSections.length} sections
          </div>
        </motion.div>
      )}
    </div>
  );
}
