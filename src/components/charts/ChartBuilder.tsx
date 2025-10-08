'use client';

import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getFinancialChartOptions, getCandlestickOptions, getHeatmapOptions, getTreemapOptions } from '@/lib/chartConfig';

export interface ChartData {
  type: 'line' | 'bar' | 'candlestick' | 'heatmap' | 'treemap' | 'pie' | 'scatter';
  title: string;
  data: any;
  options?: any;
  width?: number | string;
  height?: number | string;
}

interface ChartBuilderProps {
  chartData: ChartData;
  className?: string;
  onChartClick?: (params: any) => void;
  onChartReady?: (chart: any) => void;
}

export default function ChartBuilder({ 
  chartData, 
  className = '',
  onChartClick,
  onChartReady 
}: ChartBuilderProps) {
  const { resolvedTheme } = useTheme();
  const chartRef = useRef<ReactECharts>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getChartOption = () => {
    const baseOptions = getFinancialChartOptions(isDark);
    
    switch (chartData.type) {
      case 'candlestick':
        return {
          ...getCandlestickOptions(isDark),
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: 'candlestick',
              data: chartData.data,
              ...chartData.options?.series?.[0],
            },
          ],
        };
      
      case 'heatmap':
        return {
          ...getHeatmapOptions(isDark),
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: 'heatmap',
              data: chartData.data,
              ...chartData.options?.series?.[0],
            },
          ],
        };
      
      case 'treemap':
        return {
          ...getTreemapOptions(isDark),
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: 'treemap',
              data: chartData.data,
              ...chartData.options?.series?.[0],
            },
          ],
        };
      
      case 'pie':
        return {
          ...baseOptions,
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: 'pie',
              data: chartData.data,
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              label: {
                show: false,
                position: 'center',
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold',
                },
              },
              labelLine: {
                show: false,
              },
              ...chartData.options?.series?.[0],
            },
          ],
        };
      
      case 'scatter':
        return {
          ...baseOptions,
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: 'scatter',
              data: chartData.data,
              symbolSize: 8,
              ...chartData.options?.series?.[0],
            },
          ],
        };
      
      default: // line, bar
        return {
          ...baseOptions,
          ...chartData.options,
          title: {
            ...baseOptions.title,
            text: chartData.title,
          },
          series: [
            {
              type: chartData.type,
              data: chartData.data,
              smooth: chartData.type === 'line',
              ...chartData.options?.series?.[0],
            },
          ],
        };
    }
  };

  const handleChartClick = (params: any) => {
    if (onChartClick) {
      onChartClick(params);
    }
  };

  const handleChartReady = (chart: any) => {
    if (onChartReady) {
      onChartReady(chart);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ReactECharts
        ref={chartRef}
        option={getChartOption()}
        style={{
          width: chartData.width || '100%',
          height: chartData.height || '400px',
        }}
        onEvents={{
          click: handleChartClick,
        }}
        onChartReady={handleChartReady}
        theme={isDark ? 'dark' : 'light'}
        opts={{
          renderer: 'canvas',
          useDirtyRect: true,
        }}
      />
    </div>
  );
}
