'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
  itemStyle?: {
    color?: string;
  };
}

interface TreemapChartProps {
  data: TreemapData[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showToolbox?: boolean;
  showDataZoom?: boolean;
  onNodeClick?: (params: any) => void;
  onNodeHover?: (params: any) => void;
}

export function TreemapChart({
  data,
  title,
  subtitle,
  height = 400,
  width,
  showToolbox = true,
  showDataZoom = false,
  onNodeClick,
  onNodeHover,
}: TreemapChartProps) {
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
        formatter: (params: any) => {
          const { name, value, data } = params;
          return `
            <div style="padding: 8px;">
              <strong>${name}</strong><br/>
              Value: ${value?.toLocaleString()}<br/>
              ${data?.children ? `Children: ${data.children.length}` : ''}
            </div>
          `;
        },
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? '#333' : '#ccc',
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
      },
      series: [
        {
          type: 'treemap',
          data,
          roam: false,
          nodeClick: 'zoomToNode',
          breadcrumb: {
            show: true,
            height: 22,
            left: 'center',
            top: 'bottom',
            emptyItemWidth: 25,
            itemStyle: {
              color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderColor: isDark ? '#333' : '#ccc',
              borderWidth: 1,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
              shadowBlur: 3,
              shadowOffsetX: 2,
              shadowOffsetY: 2,
            },
            emphasis: {
              itemStyle: {
                color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              },
            },
            textStyle: {
              color: isDark ? '#fff' : '#333',
            },
          },
          label: {
            show: true,
            formatter: '{b}',
            fontSize: 12,
            color: isDark ? '#fff' : '#333',
          },
          upperLabel: {
            show: true,
            height: 30,
            fontSize: 14,
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#333',
          },
          itemStyle: {
            borderColor: isDark ? '#333' : '#fff',
            borderWidth: 2,
            gapWidth: 1,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          levels: [
            {
              itemStyle: {
                borderColor: isDark ? '#333' : '#fff',
                borderWidth: 0,
                gapWidth: 1,
              },
              upperLabel: {
                show: false,
              },
            },
            {
              itemStyle: {
                borderColor: isDark ? '#333' : '#fff',
                borderWidth: 5,
                gapWidth: 1,
              },
              emphasis: {
                itemStyle: {
                  borderColor: isDark ? '#666' : '#333',
                },
              },
            },
            {
              colorSaturation: [0.35, 0.5],
              itemStyle: {
                borderWidth: 5,
                gapWidth: 1,
                borderColorSaturation: 0.6,
              },
            },
          ],
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, title, subtitle, theme, isDark]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      onEvents={{
        click: onNodeClick,
        mouseover: onNodeHover,
      }}
    />
  );
}
