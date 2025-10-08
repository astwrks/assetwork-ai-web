'use client';

import { useState, useEffect } from 'react';
import ChartBuilder, { ChartData } from '../ChartBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Activity,
  Download,
  Maximize2
} from 'lucide-react';

interface FinancialChartProps {
  title: string;
  data: any;
  type: 'line' | 'bar' | 'candlestick' | 'pie' | 'scatter';
  onDataPointClick?: (data: any) => void;
  className?: string;
}

export default function FinancialChart({ 
  title, 
  data, 
  type, 
  onDataPointClick,
  className = '' 
}: FinancialChartProps) {
  const [chartData, setChartData] = useState<ChartData>({
    type,
    title,
    data,
    height: 300,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setChartData(prev => ({
      ...prev,
      data,
      title,
    }));
  }, [data, title]);

  const handleChartClick = (params: any) => {
    if (onDataPointClick) {
      onDataPointClick(params);
    }
  };

  const handleDownload = () => {
    // TODO: Implement chart download functionality
    console.log('Download chart:', title);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getChartIcon = () => {
    switch (type) {
      case 'line':
        return TrendingUp;
      case 'bar':
        return BarChart3;
      case 'candlestick':
        return Activity;
      case 'pie':
        return PieChart;
      case 'scatter':
        return Activity;
      default:
        return BarChart3;
    }
  };

  const Icon = getChartIcon();

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className={`${isFullscreen ? 'h-[calc(100vh-8rem)]' : ''}`}>
          <ChartBuilder
            chartData={chartData}
            onChartClick={handleChartClick}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
