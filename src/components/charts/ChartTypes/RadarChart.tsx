'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export interface RadarIndicator {
  name: string;
  max: number;
  min?: number;
}

export interface RadarData {
  name: string;
  value: number[];
  itemStyle?: {
    color?: string;
  };
  areaStyle?: {
    color?: string;
    opacity?: number;
  };
}

interface RadarChartProps {
  data: RadarData[];
  indicators: RadarIndicator[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showToolbox?: boolean;
  showDataZoom?: boolean;
  onDataClick?: (params: any) => void;
  onDataHover?: (params: any) => void;
}

export function RadarChart({
  data,
  indicators,
  title,
  subtitle,
  height = 400,
  width,
  showToolbox = true,
  showDataZoom = false,
  onDataClick,
  onDataHover,
}: RadarChartProps) {
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
          const { name, data } = params;
          const values = data.map((value: number, index: number) => 
            `${indicators[index].name}: ${value.toFixed(2)}`
          ).join('<br/>');
          
          return `
            <div style="padding: 8px;">
              <strong>${name}</strong><br/>
              ${values}
            </div>
          `;
        },
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? '#333' : '#ccc',
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        data: data.map(d => d.name),
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
      },
      radar: {
        indicator: indicators,
        name: {
          textStyle: {
            color: isDark ? '#fff' : '#333',
          },
        },
        nameGap: 5,
        splitNumber: 5,
        splitLine: {
          lineStyle: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          },
        },
        axisLine: {
          lineStyle: {
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          },
        },
      },
      series: [
        {
          name: 'Radar',
          type: 'radar',
          data,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2,
          },
          areaStyle: {
            opacity: 0.3,
          },
          emphasis: {
            areaStyle: {
              opacity: 0.5,
            },
            lineStyle: {
              width: 3,
            },
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, indicators, title, subtitle, theme]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      onEvents={{
        click: onDataClick,
        mouseover: onDataHover,
      }}
    />
  );
}
