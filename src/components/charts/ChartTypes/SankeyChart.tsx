'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export interface SankeyNode {
  name: string;
  value?: number;
  itemStyle?: {
    color?: string;
  };
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  lineStyle?: {
    color?: string;
    opacity?: number;
  };
}

interface SankeyChartProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showToolbox?: boolean;
  showDataZoom?: boolean;
  onNodeClick?: (params: any) => void;
  onLinkClick?: (params: any) => void;
  onNodeHover?: (params: any) => void;
}

export function SankeyChart({
  nodes,
  links,
  title,
  subtitle,
  height = 400,
  width,
  showToolbox = true,
  showDataZoom = false,
  onNodeClick,
  onLinkClick,
  onNodeHover,
}: SankeyChartProps) {
  const { theme } = useTheme();

  const option = useMemo(() => {
    const isDark = theme === 'dark';
    
    return {
      title: {
        text: title,
        subtext: subtitle,
        left: 'center',
        textStyle: {
          color: isDark ? '#ffffff' : '#333333',
        },
        subtextStyle: {
          color: isDark ? '#cccccc' : '#666666',
        },
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: any) => {
          const { data, name } = params;
          if (params.dataType === 'node') {
            return `
              <div style="padding: 8px;">
                <strong>${name}</strong><br/>
                Value: ${data.value?.toLocaleString() || 'N/A'}
              </div>
            `;
          } else {
            return `
              <div style="padding: 8px;">
                <strong>${data.source} → ${data.target}</strong><br/>
                Value: ${data.value?.toLocaleString()}
              </div>
            `;
          }
        },
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? '#333' : '#ccc',
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
      },
      series: [
        {
          type: 'sankey',
          data: nodes,
          links,
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          },
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: isDark ? '#333' : '#fff',
          },
          label: {
            color: isDark ? '#fff' : '#333',
            fontSize: 12,
          },
          nodeWidth: 20,
          nodeGap: 8,
          layoutIterations: 32,
          draggable: true,
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [nodes, links, title, subtitle, theme]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      onEvents={{
        click: (params: any) => {
          if (params.dataType === 'node') {
            onNodeClick?.(params);
          } else {
            onLinkClick?.(params);
          }
        },
        mouseover: onNodeHover,
      }}
    />
  );
}
