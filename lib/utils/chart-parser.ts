/**
 * Chart Parser - Extracts chart data from HTML and prepares for React rendering
 */

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie';
  data: any;
  config: any;
  placeholder: string;
}

/**
 * Parse HTML to extract chart data from data attributes
 */
export function parseChartsFromHTML(htmlContent: string): ChartData[] {
  if (!htmlContent) return [];

  const charts: ChartData[] = [];

  // Create a DOM parser (server-safe)
  if (typeof window === 'undefined') {
    // Server-side: use regex parsing
    const chartRegex = /<div[^>]*data-chart-type="([^"]*)"[^>]*data-chart='([^']*)'[^>]*>[\s\S]*?<\/div>/g;
    let match;
    let index = 0;

    while ((match = chartRegex.exec(htmlContent)) !== null) {
      const type = match[1] as 'line' | 'bar' | 'pie';
      const chartDataStr = match[2];
      const placeholder = match[0];

      try {
        const chartData = JSON.parse(chartDataStr.replace(/&quot;/g, '"'));
        charts.push({
          id: `chart-${index++}`,
          type,
          data: chartData.data,
          config: { ...chartData, type },
          placeholder,
        });
      } catch (error) {
        console.error('Failed to parse chart data:', error);
      }
    }
  } else {
    // Client-side: use DOM parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const chartElements = doc.querySelectorAll('[data-chart-type]');

    chartElements.forEach((element, index) => {
      const type = element.getAttribute('data-chart-type') as 'line' | 'bar' | 'pie';
      const chartDataStr = element.getAttribute('data-chart');

      if (type && chartDataStr) {
        try {
          const chartData = JSON.parse(chartDataStr);
          charts.push({
            id: `chart-${index}`,
            type,
            data: chartData.data,
            config: { ...chartData, type },
            placeholder: element.outerHTML,
          });
        } catch (error) {
          console.error('Failed to parse chart data:', error);
        }
      }
    });
  }

  return charts;
}

/**
 * Replace chart placeholders with React component markers
 */
export function prepareHTMLForChartRendering(htmlContent: string, charts: ChartData[]): string {
  let processedHTML = htmlContent;

  charts.forEach((chart) => {
    // Replace the chart placeholder with a unique marker
    const marker = `<div id="${chart.id}" class="react-chart-placeholder" data-chart-id="${chart.id}"></div>`;
    processedHTML = processedHTML.replace(chart.placeholder, marker);
  });

  return processedHTML;
}

/**
 * Generate sample chart data for testing
 */
export function generateSampleChartData() {
  return {
    lineChart: {
      data: [
        { month: 'Jan', revenue: 4000, expenses: 2400 },
        { month: 'Feb', revenue: 3000, expenses: 1398 },
        { month: 'Mar', revenue: 2000, expenses: 9800 },
        { month: 'Apr', revenue: 2780, expenses: 3908 },
        { month: 'May', revenue: 1890, expenses: 4800 },
        { month: 'Jun', revenue: 2390, expenses: 3800 },
        { month: 'Jul', revenue: 3490, expenses: 4300 },
      ],
      xAxisKey: 'month',
      lines: [
        { dataKey: 'revenue', name: 'Revenue', color: '#0052CC' },
        { dataKey: 'expenses', name: 'Expenses', color: '#FF5630' },
      ],
      title: 'Monthly Financial Performance',
    },
    barChart: {
      data: [
        { quarter: 'Q1', sales: 4000, profit: 2400 },
        { quarter: 'Q2', sales: 3000, profit: 1398 },
        { quarter: 'Q3', sales: 2000, profit: 9800 },
        { quarter: 'Q4', sales: 2780, profit: 3908 },
      ],
      xAxisKey: 'quarter',
      bars: [
        { dataKey: 'sales', name: 'Sales', color: '#0052CC' },
        { dataKey: 'profit', name: 'Profit', color: '#36B37E' },
      ],
      title: 'Quarterly Performance',
    },
    pieChart: {
      data: [
        { name: 'Product A', value: 400 },
        { name: 'Product B', value: 300 },
        { name: 'Product C', value: 300 },
        { name: 'Product D', value: 200 },
      ],
      title: 'Product Distribution',
    },
  };
}
