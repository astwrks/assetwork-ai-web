'use client';

import { Building2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            {/* Logo or Icon */}
            <div className="flex-shrink-0">
              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={entity.name}
                  className="w-24 h-24 rounded-xl object-cover bg-white p-2 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/20">
                  <Building2 className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Entity Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{entity.name}</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
                  {entity.type}
                </span>
              </div>

              {entity.summary && (
                <p className="text-lg text-blue-100 max-w-3xl mb-4">
                  {entity.summary}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-2xl">
                    {entity.mentionCount}
                  </span>
                  <span className="text-blue-200">
                    {entity.mentionCount === 1 ? 'Mention' : 'Mentions'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg font-medium transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
