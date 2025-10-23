/**
 * Report Section Component with Loading Animation
 * Displays report sections with progressive loading animation
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export interface ReportSectionData {
  id: string;
  title: string;
  content: string;
  order: number;
  status: 'loading' | 'complete' | 'error';
}

interface ReportSectionProps {
  section: ReportSectionData;
  isLoading?: boolean;
}

export function ReportSection({ section, isLoading = false }: ReportSectionProps) {
  // Animation variants for smooth transitions
  const variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] // Cubic bezier for smooth easing
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  const skeletonVariants = {
    pulse: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section.id}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="report-section mb-6 overflow-hidden"
      >
        {isLoading || section.status === 'loading' ? (
          <motion.div
            variants={skeletonVariants}
            animate="pulse"
            className="space-y-3"
          >
            {/* Animated loading skeleton */}
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-1 h-6 bg-primary rounded-full animate-pulse" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </motion.div>
        ) : section.status === 'error' ? (
          <div className="text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <p className="font-medium">Error loading section: {section.title}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Section title with accent bar */}
            <div className="flex items-center mb-3">
              <motion.div
                className="w-1 h-6 bg-primary rounded-full mr-3"
                initial={{ height: 0 }}
                animate={{ height: 24 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              />
              <h3 className="text-lg font-semibold text-foreground">
                {section.title}
              </h3>
            </div>

            {/* Section content with fade-in effect */}
            <motion.div
              className="prose prose-sm max-w-none text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Section container with staggered animation
interface ReportSectionsContainerProps {
  sections: ReportSectionData[];
  isGenerating: boolean;
}

export function ReportSectionsContainer({ sections, isGenerating }: ReportSectionsContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Stagger delay between sections
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="report-sections-container"
    >
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1, // Progressive delay for each section
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <ReportSection
            section={section}
            isLoading={isGenerating && section.status === 'loading'}
          />
        </motion.div>
      ))}

      {/* Loading indicator for next section */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-4"
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.2,
                  repeat: Infinity
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}