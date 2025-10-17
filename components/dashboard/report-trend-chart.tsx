/**
 * Report Trend Chart Component
 * Lazy-loaded chart component to improve initial page load
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { date: 'Mon', reports: 12 },
  { date: 'Tue', reports: 19 },
  { date: 'Wed', reports: 15 },
  { date: 'Thu', reports: 22 },
  { date: 'Fri', reports: 18 },
  { date: 'Sat', reports: 25 },
  { date: 'Sun', reports: 20 },
];

export function ReportTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Generation Trend</CardTitle>
        <CardDescription>
          Your report activity over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="reports"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorReports)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
