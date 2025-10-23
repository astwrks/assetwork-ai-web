'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, User } from 'lucide-react';

interface Entity {
  name: string;
  type: 'company' | 'person' | 'metric' | string;
  mentions?: number;
}

interface EntityBarProps {
  entities: Entity[];
  onEntityClick?: (entity: Entity) => void;
}

export function EntityBar({ entities, onEntityClick }: EntityBarProps) {
  if (!entities || entities.length === 0) {
    return null;
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 className="w-3 h-3" />;
      case 'person':
        return <User className="w-3 h-3" />;
      case 'metric':
        return <TrendingUp className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Entities:</span>
        {entities.map((entity, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-1"
            onClick={() => onEntityClick?.(entity)}
          >
            {getEntityIcon(entity.type)}
            <span>{entity.name}</span>
            {entity.mentions && entity.mentions > 1 && (
              <span className="text-xs text-muted-foreground">({entity.mentions})</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
