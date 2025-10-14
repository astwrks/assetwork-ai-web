'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinancialLineChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
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

const DEFAULT_LINE_COLORS = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.secondary,
];

export default function FinancialLineChart({
  data,
  xAxisKey,
  lines,
  title,
  height = 400,
  showGrid = true,
  showLegend = true,
}: FinancialLineChartProps) {
  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: '#4B5563', fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fill: '#4B5563', fontSize: 12 }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 82, 204, 0.1)',
            }}
            labelStyle={{ color: '#172B4D', fontWeight: 600 }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || DEFAULT_LINE_COLORS[index % DEFAULT_LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
