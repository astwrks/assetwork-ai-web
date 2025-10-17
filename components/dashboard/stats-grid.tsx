/**
 * Dashboard Stats Grid Component
 * Displays key metrics in a responsive grid
 */

'use client';

import { motion } from 'framer-motion';
import { FileText, Globe, Zap, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsData {
  totalReports: number;
  reportsThisMonth: number;
  totalEntities: number;
  activeAlerts: number;
  apiUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface StatsGridProps {
  stats: StatsData | null;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: 'Total Reports',
      value: stats?.totalReports || 0,
      subtitle: `+${stats?.reportsThisMonth || 0} this month`,
      icon: FileText,
      delay: 0.1,
    },
    {
      title: 'Tracked Entities',
      value: stats?.totalEntities || 0,
      subtitle: 'Across all categories',
      icon: Globe,
      delay: 0.2,
    },
    {
      title: 'API Usage',
      value: `${stats?.apiUsage.percentage || 0}%`,
      subtitle: null,
      icon: Zap,
      delay: 0.3,
      showProgress: true,
      progress: stats?.apiUsage.percentage || 0,
    },
    {
      title: 'Active Alerts',
      value: stats?.activeAlerts || 0,
      subtitle: 'Requires attention',
      icon: Bell,
      delay: 0.4,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              )}
              {card.showProgress && (
                <Progress value={card.progress} className="h-1 mt-2" />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
