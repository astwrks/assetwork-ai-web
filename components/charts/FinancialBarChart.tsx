'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FinancialBarChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

// AssetWorks brand colors
const COLORS = {
  primary: '#0052CC',
  secondary: '#172B4D',
  accent: '#00B8D9',
  success: '#36B37E',
  warning: '#FFAB00',
  error: '#FF5630',
};

const DEFAULT_BAR_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.secondary,
];

export default function FinancialBarChart({
  data,
  xAxisKey,
  bars,
  title,
  height = 400,
  showGrid = true,
  showLegend = true,
  orientation = 'vertical',
}: FinancialBarChartProps) {
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          {orientation === 'vertical' ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: '#4B5563', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fill: '#4B5563', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fill: '#4B5563', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tick={{ fill: '#4B5563', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 82, 204, 0.1)',
            }}
            labelStyle={{ color: '#172B4D', fontWeight: 600 }}
            cursor={{ fill: 'rgba(0, 82, 204, 0.1)' }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
          )}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || DEFAULT_BAR_COLORS[index % DEFAULT_BAR_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
