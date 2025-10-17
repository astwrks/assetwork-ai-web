'use client';

import { Building2, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EntityHeaderProps {
  entity: {
    id: string;
    name: string;
    slug: string;
    type: string;
    logo?: string | null;
    summary?: string | null;
    mentionCount: number;
  };
}

export function EntityHeader({ entity }: EntityHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/entities/${entity.slug}/refresh`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Entity data refreshed! Page will reload...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Failed to refresh entity data');
      }
    } catch (error) {
      toast.error('Failed to refresh entity data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white relative overflow-hidden">
      {/* Animated background sparkles */}
      <div className="absolute inset-0 opacity-10">
        <Sparkles className="absolute top-10 right-20 w-6 h-6 animate-pulse" />
        <Sparkles className="absolute bottom-20 left-20 w-4 h-4 animate-pulse delay-75" />
        <Sparkles className="absolute top-1/2 right-1/3 w-5 h-5 animate-pulse delay-150" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-start gap-6">
            {/* Logo or Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0"
            >
              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={entity.name}
                  className="w-24 h-24 rounded-2xl object-cover bg-white p-2 shadow-2xl border-2 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/20">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </motion.div>

            {/* Entity Info */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <h1 className="text-4xl font-bold tracking-tight">{entity.name}</h1>
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                  {entity.type}
                </Badge>
              </motion.div>

              {entity.summary && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-lg text-blue-100 max-w-3xl mb-4 leading-relaxed"
                >
                  {entity.summary}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-6 text-sm"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <span className="font-bold text-2xl">
                    {entity.mentionCount}
                  </span>
                  <span className="text-blue-100">
                    {entity.mentionCount === 1 ? 'Mention' : 'Mentions'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
