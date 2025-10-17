/**
 * Entity Breakdown Chart Component
 * Lazy-loaded pie chart component
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Companies', value: 45, color: '#3b82f6' },
  { name: 'Stocks', value: 30, color: '#10b981' },
  { name: 'Crypto', value: 15, color: '#f59e0b' },
  { name: 'Other', value: 10, color: '#6b7280' },
];

export function EntityBreakdownChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entity Distribution</CardTitle>
        <CardDescription>
          Breakdown of tracked entities by type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
