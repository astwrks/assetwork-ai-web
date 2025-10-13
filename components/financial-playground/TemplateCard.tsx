'use client';

import { ITemplate } from '@/lib/db/models/Template';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Calculator,
  FileText,
  Star,
  Users,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: ITemplate;
  onPreview: (template: ITemplate) => void;
  onUse: (template: ITemplate) => void;
  className?: string;
}

// Icon mapping for template icons
const iconMap: Record<string, any> = {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Calculator,
  FileText,
  Sparkles,
};

export default function TemplateCard({
  template,
  onPreview,
  onUse,
  className,
}: TemplateCardProps) {
  const IconComponent = template.icon && iconMap[template.icon] ? iconMap[template.icon] : FileText;
  const isPremium = template.isPremium || template.tier !== 'free';

  const getTierBadge = () => {
    if (template.tier === 'enterprise') {
      return (
        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 text-xs font-semibold">
          <Crown className="w-3 h-3 mr-1" />
          Enterprise
        </Badge>
      );
    }
    if (template.tier === 'pro' || isPremium) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs font-semibold">
          <Sparkles className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card
      className={cn(
        'group hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden',
        'hover:scale-[1.02] hover:border-primary/50',
        isPremium && 'border-amber-200',
        className
      )}
      onClick={() => onPreview(template)}
    >
      {/* Premium gradient overlay */}
      {isPremium && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 pointer-events-none" />
      )}

      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-lg',
                isPremium
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                  : 'bg-primary/10'
              )}
            >
              <IconComponent
                className={cn(
                  'w-5 h-5',
                  isPremium ? 'text-amber-600' : 'text-primary'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {template.name}
              </CardTitle>
            </div>
          </div>
          {getTierBadge()}
        </div>

        <CardDescription className="text-sm mt-2 line-clamp-2">
          {template.description || 'No description available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {/* Template stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{template.usageCount?.toLocaleString() || 0}</span>
          </div>
          {template.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{template.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{template.structure?.length || 0} sections</span>
          </div>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 font-normal"
              >
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5 font-normal"
              >
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template);
            }}
          >
            Preview
          </Button>
          <Button
            size="sm"
            className={cn(
              'flex-1 text-xs h-8',
              isPremium &&
                'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onUse(template);
            }}
          >
            {isPremium && <Lock className="w-3 h-3 mr-1" />}
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
