'use client';

import { ITemplate } from '@/lib/db/models/Template';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface TemplateDetailDialogProps {
  template: ITemplate | null;
  open: boolean;
  onClose: () => void;
  onUse: (template: ITemplate) => void;
  isLoading?: boolean;
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

// Section type icons
const sectionTypeIcons: Record<string, any> = {
  chart: BarChart3,
  table: FileText,
  text: FileText,
  metric: Calculator,
  insight: Lightbulb,
  image: FileText,
};

export default function TemplateDetailDialog({
  template,
  open,
  onClose,
  onUse,
  isLoading = false,
}: TemplateDetailDialogProps) {
  if (!template) return null;

  const IconComponent = template.icon && iconMap[template.icon] ? iconMap[template.icon] : FileText;
  const isPremium = template.isPremium || template.tier !== 'free';

  const getTierBadge = () => {
    if (template.tier === 'enterprise') {
      return (
        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 font-semibold">
          <Crown className="w-3.5 h-3.5 mr-1.5" />
          Enterprise
        </Badge>
      );
    }
    if (template.tier === 'pro' || isPremium) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-semibold">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Pro Template
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-semibold">
        Free Template
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onClose}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Templates
            </Button>
            {getTierBadge()}
          </div>

          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-3 rounded-xl',
                isPremium
                  ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                  : 'bg-primary/10'
              )}
            >
              <IconComponent
                className={cn(
                  'w-8 h-8',
                  isPremium ? 'text-amber-600' : 'text-primary'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold mb-2">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {template.description || 'Professional financial report template'}
              </DialogDescription>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {template.usageCount?.toLocaleString() || 0}
              </span>
              <span className="text-muted-foreground">users</span>
            </div>
            {template.rating > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{template.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({template.ratingCount || 0} ratings)
                  </span>
                </div>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-6">
            {/* What's Included */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What's Included
              </h3>
              <div className="space-y-2">
                {template.structure?.map((section, index) => {
                  const SectionIcon = sectionTypeIcons[section.type] || FileText;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="p-1.5 bg-background rounded">
                        <SectionIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{section.title}</span>
                          {section.required && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 px-1.5"
                            >
                              Required
                            </Badge>
                          )}
                        </div>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {section.type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category & Tags */}
            {(template.category || (template.tags && template.tags.length > 0)) && (
              <>
                <Separator />
                <div className="space-y-3">
                  {template.category && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                        Category
                      </h4>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Base Prompt Preview */}
            {template.basePrompt && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    AI Generation Guidance
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {template.basePrompt.substring(0, 200)}
                    {template.basePrompt.length > 200 && '...'}
                  </p>
                </div>
              </>
            )}

            {/* Best for */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Best for
                  </h4>
                  <p className="text-sm text-blue-800">
                    {template.category === 'Financial Analysis'
                      ? 'Monthly financial reviews, investor presentations, and board reports'
                      : template.category === 'Performance Metrics'
                      ? 'Quarterly performance reviews, KPI tracking, and team presentations'
                      : 'Business planning, forecasting, and strategic analysis'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{template.structure?.length || 0} sections included</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className={cn(
                  'min-w-[140px]',
                  isPremium &&
                    'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                )}
                onClick={() => onUse(template)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    {isPremium && <Lock className="w-4 h-4 mr-2" />}
                    Use This Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
