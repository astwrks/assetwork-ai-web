'use client';

import { CheckCheck, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error' | 'pending';

interface MessageStatusBadgeProps {
  status: MessageStatus;
  className?: string;
}

export function MessageStatusBadge({ status, className }: MessageStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'sending':
        return {
          icon: Loader2,
          color: 'text-blue-500',
          label: 'Sending...',
          animate: true,
        };
      case 'sent':
        return {
          icon: Check,
          color: 'text-gray-400',
          label: 'Sent',
          animate: false,
        };
      case 'delivered':
        return {
          icon: CheckCheck,
          color: 'text-blue-500',
          label: 'Delivered',
          animate: false,
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          label: 'Failed',
          animate: false,
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          label: 'Pending',
          animate: false,
        };
      default:
        return {
          icon: Check,
          color: 'text-gray-400',
          label: 'Sent',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs',
        config.color,
        className
      )}
      title={config.label}
    >
      <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} />
      <span className="text-[10px]">{config.label}</span>
    </div>
  );
}
