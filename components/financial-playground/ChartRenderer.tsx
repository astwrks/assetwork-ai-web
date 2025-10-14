'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseChartsFromHTML, prepareHTMLForChartRendering, type ChartData } from '@/lib/utils/chart-parser';
import { FinancialLineChart, FinancialBarChart, FinancialPieChart } from '@/components/charts';

interface ChartRendererProps {
  htmlContent: string;
  onProcessed?: (processedHTML: string) => void;
}

/**
 * ChartRenderer - Hydrates HTML with interactive React charts
 *
 * This component:
 * 1. Parses chart data from HTML data attributes
 * 2. Replaces placeholders with React chart components
 * 3. Renders the processed HTML with interactive charts
 */
export default function ChartRenderer({ htmlContent, onProcessed }: ChartRendererProps) {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [processedHTML, setProcessedHTML] = useState<string>('');

  // Parse charts from HTML
  useEffect(() => {
    if (!htmlContent) return;

    const extractedCharts = parseChartsFromHTML(htmlContent);
    setCharts(extractedCharts);

    if (extractedCharts.length > 0) {
      const prepared = prepareHTMLForChartRendering(htmlContent, extractedCharts);
      setProcessedHTML(prepared);
      onProcessed?.(prepared);
    } else {
      setProcessedHTML(htmlContent);
      onProcessed?.(htmlContent);
    }
  }, [htmlContent, onProcessed]);

  // Hydrate chart placeholders with React components
  useEffect(() => {
    if (charts.length === 0) return;

    charts.forEach((chart) => {
      const placeholder = document.getElementById(chart.id);
      if (!placeholder) return;

      // Chart is already rendered if it has children
      if (placeholder.children.length > 0) return;

      // Create a container for the React chart
      const container = document.createElement('div');
      container.id = `${chart.id}-container`;
      placeholder.appendChild(container);
    });
  }, [charts]);

  // Render individual chart by type
  const renderChart = (chart: ChartData) => {
    const commonProps = {
      height: chart.config.height || 400,
      showGrid: chart.config.showGrid !== false,
      showLegend: chart.config.showLegend !== false,
    };

    switch (chart.type) {
      case 'line':
        return (
          <FinancialLineChart
            data={chart.data}
            xAxisKey={chart.config.xAxisKey}
            lines={chart.config.lines}
            title={chart.config.title}
            {...commonProps}
          />
        );

      case 'bar':
        return (
          <FinancialBarChart
            data={chart.data}
            xAxisKey={chart.config.xAxisKey}
            bars={chart.config.bars}
            title={chart.config.title}
            orientation={chart.config.orientation || 'vertical'}
            {...commonProps}
          />
        );

      case 'pie':
        return (
          <FinancialPieChart
            data={chart.data}
            title={chart.config.title}
            innerRadius={chart.config.innerRadius || 0}
            colors={chart.config.colors}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Render the HTML with chart placeholders */}
      <div
        className="report-content"
        dangerouslySetInnerHTML={{ __html: processedHTML }}
      />

      {/* Portal React charts into placeholders */}
      {charts.map((chart) => {
        if (typeof window === 'undefined') return null;

        const placeholder = document.getElementById(`${chart.id}-container`);
        if (!placeholder) return null;

        return (
          <ChartPortal key={chart.id} containerId={`${chart.id}-container`}>
            {renderChart(chart)}
          </ChartPortal>
        );
      })}
    </>
  );
}

/**
 * ChartPortal - Renders React components into DOM placeholders using portals
 */
function ChartPortal({ containerId, children }: { containerId: string; children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.getElementById(containerId);
    setContainer(element);
  }, [containerId]);

  if (!container) return null;

  // Use React 18 createRoot for better hydration
  useEffect(() => {
    if (!container || !children) return;

    // Simple approach: directly render into container
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container);
      root.render(children);

      return () => {
        setTimeout(() => root.unmount(), 0);
      };
    });
  }, [container, children]);

  return null;
}
