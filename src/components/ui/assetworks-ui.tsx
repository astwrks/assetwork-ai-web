// components/ui/assetworks-ui.tsx - AssetWorks branded UI components
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

// AssetWorks Button - matches exact website styling
interface AWButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

export const AWButton: React.FC<AWButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-aw-normal focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-aw-brand-primary text-white hover:bg-aw-brand-secondary focus:ring-aw-brand-primary',
    secondary: 'bg-aw-bg-primary text-aw-text-primary border border-aw-border hover:bg-aw-interactive-hover focus:ring-aw-brand-accent',
    ghost: 'text-aw-text-primary hover:bg-aw-interactive-hover focus:ring-aw-brand-accent',
    outline: 'border border-aw-border text-aw-text-primary hover:bg-aw-interactive-hover focus:ring-aw-brand-accent',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm rounded-aw-md',
    default: 'h-10 px-4 py-2 text-sm rounded-aw-lg',
    lg: 'h-12 px-6 text-base rounded-aw-lg',
  };
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// AssetWorks Card - matches website card styling
interface AWCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const AWCard: React.FC<AWCardProps> = ({
  children,
  className,
  hover = false,
}) => {
  return (
    <div
      className={cn(
        'bg-aw-bg-primary border border-aw-border rounded-aw-lg p-aw-2xl shadow-aw-sm transition-all duration-aw-normal',
        hover && 'hover:shadow-aw-md hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
};

// AssetWorks Container - matches website layout
interface AWContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const AWContainer: React.FC<AWContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
}) => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-aw-container',
    full: 'max-w-none',
  };
  
  return (
    <div
      className={cn(
        'mx-auto px-aw-lg sm:px-aw-2xl',
        maxWidths[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

// AssetWorks Section - for main page sections
interface AWSectionProps {
  children: React.ReactNode;
  className?: string;
  background?: 'primary' | 'secondary' | 'tertiary';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AWSection: React.FC<AWSectionProps> = ({
  children,
  className,
  background = 'primary',
  padding = 'lg',
}) => {
  const backgrounds = {
    primary: 'bg-aw-bg-primary',
    secondary: 'bg-aw-bg-secondary',
    tertiary: 'bg-aw-bg-tertiary',
  };
  
  const paddings = {
    sm: 'py-aw-2xl',
    md: 'py-aw-3xl',
    lg: 'py-aw-4xl',
    xl: 'py-aw-5xl',
  };
  
  return (
    <section
      className={cn(
        backgrounds[background],
        paddings[padding],
        className
      )}
    >
      {children}
    </section>
  );
};

// AssetWorks Typography Components
export const AWHeading: React.FC<{
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}> = ({ level, children, className }) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const styles = {
    1: 'text-4xl sm:text-5xl lg:text-6xl font-bold text-aw-text-primary leading-tight tracking-tight',
    2: 'text-3xl sm:text-4xl lg:text-5xl font-bold text-aw-text-primary leading-tight',
    3: 'text-2xl sm:text-3xl font-bold text-aw-text-primary leading-tight',
    4: 'text-xl sm:text-2xl font-semibold text-aw-text-primary',
    5: 'text-lg sm:text-xl font-semibold text-aw-text-primary',
    6: 'text-base sm:text-lg font-semibold text-aw-text-primary',
  };
  
  return (
    <Component className={cn(styles[level], className)}>
      {children}
    </Component>
  );
};

export const AWText: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
}> = ({ children, variant = 'primary', size = 'base', className }) => {
  const variants = {
    primary: 'text-aw-text-primary',
    secondary: 'text-aw-text-secondary',
    tertiary: 'text-aw-text-tertiary',
  };
  
  const sizes = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };
  
  return (
    <p className={cn(variants[variant], sizes[size], 'leading-relaxed', className)}>
      {children}
    </p>
  );
};

// AssetWorks Grid - matches website layout
export const AWGrid: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ children, cols = 3, gap = 'lg', className }) => {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  };
  
  const gapMap = {
    sm: 'gap-aw-lg',
    md: 'gap-aw-xl',
    lg: 'gap-aw-2xl',
    xl: 'gap-aw-3xl',
  };
  
  return (
    <div className={cn('grid', colsMap[cols], gapMap[gap], className)}>
      {children}
    </div>
  );
};

// AssetWorks Metric Card - like the website's metric cards
interface AWMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const AWMetricCard: React.FC<AWMetricCardProps> = ({
  title,
  value,
  change,
  icon,
  className,
}) => {
  const trendColors = {
    up: 'text-aw-success',
    down: 'text-aw-error',
    neutral: 'text-aw-text-tertiary',
  };
  
  return (
    <AWCard className={cn('text-center', className)} hover>
      {icon && (
        <div className="flex justify-center mb-aw-md">
          <div className="text-aw-brand-accent">{icon}</div>
        </div>
      )}
      
      <div className="space-y-aw-sm">
        <AWText variant="secondary" size="sm">
          {title}
        </AWText>
        
        <div className="text-3xl font-bold text-aw-text-primary">
          {value}
        </div>
        
        {change && (
          <div className={cn('text-sm font-medium', trendColors[change.trend])}>
            {change.value}
          </div>
        )}
      </div>
    </AWCard>
  );
};

// AssetWorks Badge - for categories and labels
export const AWBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'default';
  className?: string;
}> = ({ children, variant = 'primary', size = 'default', className }) => {
  const variants = {
    primary: 'bg-aw-brand-primary text-white',
    secondary: 'bg-aw-bg-tertiary text-aw-text-secondary',
    success: 'bg-aw-success text-white',
    warning: 'bg-aw-warning text-white',
    error: 'bg-aw-error text-white',
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-1 text-sm',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};