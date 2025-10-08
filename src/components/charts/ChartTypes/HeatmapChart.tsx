'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme/ThemeProvider';

export interface HeatmapData {
  name: string;
  value: [number, number, number]; // [x, y, value]
  itemStyle?: {
    color?: string;
  };
}

interface HeatmapChartProps {
  data: HeatmapData[];
  xAxisData: string[];
  yAxisData: string[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  showToolbox?: boolean;
  showDataZoom?: boolean;
  colorRange?: [string, string];
  onCellClick?: (params: any) => void;
  onCellHover?: (params: any) => void;
}

export function HeatmapChart({
  data,
  xAxisData,
  yAxisData,
  title,
  subtitle,
  height = 400,
  width,
  showToolbox = true,
  showDataZoom = false,
  colorRange = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
  onCellClick,
  onCellHover,
}: HeatmapChartProps) {
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
        position: 'top',
        formatter: (params: any) => {
          const { data, name } = params;
          return `
            <div style="padding: 8px;">
              <strong>${name}</strong><br/>
              Value: ${data[2]?.toLocaleString()}<br/>
              Position: (${data[0]}, ${data[1]})
            </div>
          `;
        },
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? '#333' : '#ccc',
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
      },
      grid: {
        height: '50%',
        top: '10%',
        left: '10%',
        right: '10%',
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: isDark ? '#ccc' : '#666',
          rotate: 45,
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#333' : '#ccc',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: isDark ? '#ccc' : '#666',
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#333' : '#ccc',
          },
        },
      },
      visualMap: {
        min: Math.min(...data.map(d => d.value[2])),
        max: Math.max(...data.map(d => d.value[2])),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: colorRange,
        },
        textStyle: {
          color: isDark ? '#fff' : '#333',
        },
        itemWidth: 20,
        itemHeight: 20,
      },
      series: [
        {
          name: 'Heatmap',
          type: 'heatmap',
          data,
          label: {
            show: true,
            formatter: (params: any) => {
              return params.data[2]?.toFixed(1);
            },
            color: isDark ? '#fff' : '#333',
            fontSize: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          itemStyle: {
            borderColor: isDark ? '#333' : '#fff',
            borderWidth: 1,
          },
        },
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }, [data, xAxisData, yAxisData, title, subtitle, theme, colorRange]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      onEvents={{
        click: onCellClick,
        mouseover: onCellHover,
      }}
    />
  );
}
