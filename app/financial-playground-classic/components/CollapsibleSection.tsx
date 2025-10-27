/**
 * Collapsible Section Component
 * Wraps content in a collapsible container with a header toggle
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
  closeable?: boolean;
  onClose?: () => void;
  badge?: React.ReactNode;
  compact?: boolean;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  className,
  headerClassName,
  contentClassName,
  onToggle,
  closeable = false,
  onClose,
  badge,
  compact = false
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div
        className={cn(
          "flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/50",
          compact ? "p-2" : "p-3",
          headerClassName
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", compact && "h-5 w-5")}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {isOpen ? (
              <ChevronDown className={cn("h-4 w-4", compact && "h-3 w-3")} />
            ) : (
              <ChevronRight className={cn("h-4 w-4", compact && "h-3 w-3")} />
            )}
          </Button>
          {icon && (
            <div className={cn("text-muted-foreground", compact && "scale-90")}>
              {icon}
            </div>
          )}
          <h3 className={cn(
            "font-medium",
            compact ? "text-sm" : "text-base"
          )}>
            {title}
          </h3>
          {badge && (
            <div className="ml-2">
              {badge}
            </div>
          )}
        </div>

        {closeable && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", compact && "h-5 w-5")}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className={cn("h-4 w-4", compact && "h-3 w-3")} />
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, delay: 0.1 }
              }
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.15 }
              }
            }}
            style={{ overflow: "hidden" }}
            className="border-t"
          >
            <div className={cn(
              compact ? "p-2" : "p-4",
              contentClassName
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}