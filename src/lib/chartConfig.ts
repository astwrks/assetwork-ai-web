import { useTheme } from '@/lib/theme/ThemeProvider';

export interface ChartTheme {
  backgroundColor: string;
  textStyle: {
    color: string;
  };
  title: {
    textStyle: {
      color: string;
    };
  };
  legend: {
    textStyle: {
      color: string;
    };
  };
  grid: {
    borderColor: string;
  };
  xAxis: {
    axisLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
  yAxis: {
    axisLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
}

export const getChartTheme = (isDark: boolean): ChartTheme => ({
  backgroundColor: isDark ? '#1f2937' : '#ffffff',
  textStyle: {
    color: isDark ? '#f9fafb' : '#111827',
  },
  title: {
    textStyle: {
      color: isDark ? '#f9fafb' : '#111827',
    },
  },
  legend: {
    textStyle: {
      color: isDark ? '#d1d5db' : '#6b7280',
    },
  },
  grid: {
    borderColor: isDark ? '#374151' : '#e5e7eb',
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    axisLabel: {
      color: isDark ? '#d1d5db' : '#6b7280',
    },
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    axisLabel: {
      color: isDark ? '#d1d5db' : '#6b7280',
    },
  },
});

export const getChartColors = (isDark: boolean): string[] => {
  if (isDark) {
    return [
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#06b6d4', // cyan-500
      '#84cc16', // lime-500
      '#f97316', // orange-500
    ];
  }
  
  return [
    '#2563eb', // blue-600
    '#059669', // emerald-600
    '#d97706', // amber-600
    '#dc2626', // red-600
    '#7c3aed', // violet-600
    '#0891b2', // cyan-600
    '#65a30d', // lime-600
    '#ea580c', // orange-600
  ];
};

export const getFinancialChartOptions = (isDark: boolean) => ({
  backgroundColor: isDark ? '#1f2937' : '#ffffff',
  textStyle: {
    color: isDark ? '#f9fafb' : '#111827',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    textStyle: {
      color: isDark ? '#f9fafb' : '#111827',
      fontSize: 16,
      fontWeight: '600',
    },
    left: 'center',
    top: 20,
  },
  legend: {
    textStyle: {
      color: isDark ? '#d1d5db' : '#6b7280',
      fontSize: 12,
    },
    top: 50,
    left: 'center',
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
    borderColor: isDark ? '#374151' : '#e5e7eb',
  },
  tooltip: {
    backgroundColor: isDark ? '#374151' : '#ffffff',
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    textStyle: {
      color: isDark ? '#f9fafb' : '#111827',
    },
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      lineStyle: {
        color: isDark ? '#6b7280' : '#9ca3af',
      },
    },
  },
  xAxis: {
    type: 'category',
    axisLine: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    axisLabel: {
      color: isDark ? '#d1d5db' : '#6b7280',
      fontSize: 11,
    },
    axisTick: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    axisLabel: {
      color: isDark ? '#d1d5db' : '#6b7280',
      fontSize: 11,
      formatter: (value: number) => {
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
      },
    },
    axisTick: {
      lineStyle: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    splitLine: {
      lineStyle: {
        color: isDark ? '#374151' : '#f3f4f6',
      },
    },
  },
  color: getChartColors(isDark),
});

export const getCandlestickOptions = (isDark: boolean) => ({
  ...getFinancialChartOptions(isDark),
  series: [
    {
      type: 'candlestick',
      itemStyle: {
        color: isDark ? '#10b981' : '#059669', // up color
        color0: isDark ? '#ef4444' : '#dc2626', // down color
        borderColor: isDark ? '#10b981' : '#059669',
        borderColor0: isDark ? '#ef4444' : '#dc2626',
      },
    },
  ],
});

export const getHeatmapOptions = (isDark: boolean) => ({
  ...getFinancialChartOptions(isDark),
  visualMap: {
    min: 0,
    max: 1,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '5%',
    inRange: {
      color: isDark 
        ? ['#1f2937', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        : ['#f3f4f6', '#dbeafe', '#10b981', '#fbbf24', '#f87171'],
    },
    textStyle: {
      color: isDark ? '#f9fafb' : '#111827',
    },
  },
  series: [
    {
      type: 'heatmap',
      label: {
        show: true,
        color: isDark ? '#f9fafb' : '#111827',
      },
    },
  ],
});

export const getTreemapOptions = (isDark: boolean) => ({
  ...getFinancialChartOptions(isDark),
  series: [
    {
      type: 'treemap',
      roam: false,
      nodeClick: false,
      breadcrumb: {
        show: false,
      },
      label: {
        show: true,
        formatter: '{b}',
        color: isDark ? '#f9fafb' : '#111827',
        fontSize: 12,
      },
      upperLabel: {
        show: true,
        height: 30,
        color: isDark ? '#f9fafb' : '#111827',
      },
      itemStyle: {
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 2,
      },
    },
  ],
});
