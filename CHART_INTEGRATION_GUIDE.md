# 📊 Interactive Chart Integration Guide

## Overview

AssetWorks Financial Playground now supports **interactive React charts** powered by Recharts! Charts are automatically rendered from JSON data embedded in AI-generated HTML reports.

---

## 🚀 Features

✅ **Line Charts** - Trends, time series, price history
✅ **Bar Charts** - Comparisons, metrics, category data
✅ **Pie Charts** - Distributions, breakdowns, percentages
✅ **Real-time Rendering** - Charts render dynamically as reports generate
✅ **AssetWorks Branding** - Consistent color palette across all visualizations
✅ **Responsive** - Auto-scales to fit container
✅ **Interactive** - Hover tooltips, legends, animations

---

## 📐 Architecture

### Data Flow

```
AI generates HTML
    ↓
HTML contains chart data as JSON in data attributes
    ↓
ChartParser extracts chart data
    ↓
ChartRenderer hydrates placeholders with React charts
    ↓
Interactive charts displayed in report
```

### Key Components

1. **Chart Components** (`/components/charts/`)
   - `FinancialLineChart.tsx` - Multi-line trend charts
   - `FinancialBarChart.tsx` - Vertical/horizontal bar charts
   - `FinancialPieChart.tsx` - Pie/donut charts

2. **Parser Utility** (`/lib/utils/chart-parser.ts`)
   - Extracts chart JSON from HTML data attributes
   - Prepares HTML for React chart hydration

3. **Chart Renderer** (`/components/financial-playground/ChartRenderer.tsx`)
   - Orchestrates chart rendering
   - Injects React charts into HTML placeholders

4. **System Prompt** (`/lib/ai/playground-prompt.ts`)
   - Instructs AI to generate chart data in correct format

---

## 🎨 Chart Data Format

### Line Chart

```html
<div class="chart-container" data-chart-type="line" data-chart='{
  "data": [
    {"month": "Jan", "revenue": 4000, "expenses": 2400},
    {"month": "Feb", "revenue": 3000, "expenses": 1398},
    {"month": "Mar", "revenue": 2000, "expenses": 9800}
  ],
  "xAxisKey": "month",
  "lines": [
    {"dataKey": "revenue", "name": "Revenue", "color": "#0052CC"},
    {"dataKey": "expenses", "name": "Expenses", "color": "#FF5630"}
  ],
  "title": "Monthly Financial Performance",
  "height": 400,
  "showGrid": true,
  "showLegend": true
}'>
  [Chart Placeholder - Will render interactively]
</div>
```

### Bar Chart

```html
<div class="chart-container" data-chart-type="bar" data-chart='{
  "data": [
    {"quarter": "Q1", "sales": 4000, "profit": 2400},
    {"quarter": "Q2", "sales": 3000, "profit": 1398},
    {"quarter": "Q3", "sales": 2000, "profit": 9800}
  ],
  "xAxisKey": "quarter",
  "bars": [
    {"dataKey": "sales", "name": "Sales", "color": "#0052CC"},
    {"dataKey": "profit", "name": "Profit", "color": "#36B37E"}
  ],
  "title": "Quarterly Performance",
  "orientation": "vertical"
}'>
  [Chart Placeholder - Will render interactively]
</div>
```

### Pie Chart

```html
<div class="chart-container" data-chart-type="pie" data-chart='{
  "data": [
    {"name": "Product A", "value": 400},
    {"name": "Product B", "value": 300},
    {"name": "Product C", "value": 300},
    {"name": "Product D", "value": 200}
  ],
  "title": "Product Distribution",
  "innerRadius": 0
}'>
  [Chart Placeholder - Will render interactively]
</div>
```

---

## 🛠️ Usage in Code

### Direct Component Usage

```tsx
import { FinancialLineChart, FinancialBarChart, FinancialPieChart } from '@/components/charts';

// Line Chart
<FinancialLineChart
  data={[
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 }
  ]}
  xAxisKey="month"
  lines={[{ dataKey: 'revenue', name: 'Revenue' }]}
  title="Monthly Revenue"
  height={400}
  showGrid={true}
  showLegend={true}
/>

// Bar Chart
<FinancialBarChart
  data={[{ category: 'Q1', sales: 4000 }]}
  xAxisKey="category"
  bars={[{ dataKey: 'sales', name: 'Sales' }]}
  title="Quarterly Sales"
  orientation="vertical"
/>

// Pie Chart
<FinancialPieChart
  data={[{ name: 'Product A', value: 400 }]}
  title="Market Share"
  innerRadius={60}  // For donut chart
/>
```

### Chart Renderer Usage

```tsx
import ChartRenderer from '@/components/financial-playground/ChartRenderer';

<ChartRenderer htmlContent={reportHtmlWithChartData} />
```

---

## 🎨 AssetWorks Color Palette

All charts use the following brand colors by default:

```ts
const COLORS = {
  primary: '#0052CC',    // Blue
  secondary: '#172B4D',  // Dark Blue
  accent: '#00B8D9',     // Cyan
  success: '#36B37E',    // Green
  warning: '#FFAB00',    // Orange
  error: '#FF5630',      // Red
};
```

---

## 📝 AI Prompt Instructions

The AI system prompt includes instructions to generate charts:

```
CHART DATA GENERATION:
For all financial charts, include data in JSON format using data attributes:

1. Line Charts (for trends, price history)
2. Bar Charts (for comparisons, metrics)
3. Pie Charts (for distributions, breakdowns)

Chart JSON Format Examples:
- Line: {"data":[...], "xAxisKey":"month", "lines":[...], "title":"..."}
- Bar: {"data":[...], "xAxisKey":"category", "bars":[...], "title":"..."}
- Pie: {"data":[...], "title":"..."}
```

---

## 🧪 Testing Chart Generation

### Manual Test

1. Open Financial Playground
2. Create a new thread
3. Ask for a report with visualizations:
   ```
   "Generate a financial report for AAPL with revenue trends and profit margin analysis. Include interactive charts."
   ```
4. Charts should render automatically in the report

### Sample Data

Use the helper function to generate test data:

```ts
import { generateSampleChartData } from '@/lib/utils/chart-parser';

const samples = generateSampleChartData();
// Returns: { lineChart, barChart, pieChart }
```

---

## 🔧 Configuration Options

### Chart Props

#### Common Props (All Charts)
- `title?: string` - Chart title
- `height?: number` - Chart height in pixels (default: 400)
- `showGrid?: boolean` - Show gridlines (default: true)
- `showLegend?: boolean` - Show legend (default: true)

#### Line Chart Specific
- `data: Array<Record<string, any>>` - Chart data
- `xAxisKey: string` - Key for X-axis values
- `lines: Array<{dataKey, name, color?}>` - Line definitions

#### Bar Chart Specific
- `data: Array<Record<string, any>>` - Chart data
- `xAxisKey: string` - Key for X-axis/Y-axis values
- `bars: Array<{dataKey, name, color?}>` - Bar definitions
- `orientation?: 'vertical' | 'horizontal'` - Chart orientation

#### Pie Chart Specific
- `data: Array<{name, value}>` - Chart data
- `innerRadius?: number` - Inner radius for donut charts (0 = pie, >0 = donut)
- `colors?: string[]` - Custom color array

---

## 🐛 Troubleshooting

### Charts Not Rendering

1. **Check console** for parsing errors
2. **Verify JSON format** - Must be valid JSON in `data-chart` attribute
3. **Check data structure** - Ensure data matches expected format
4. **Validate chart type** - Must be `line`, `bar`, or `pie`

### Charts Look Wrong

1. **Check colors** - Use AssetWorks palette for consistency
2. **Adjust height** - Default is 400px, may need adjustment
3. **Verify data** - Ensure numerical values are numbers, not strings

### Performance Issues

1. **Limit data points** - Keep datasets reasonable (< 100 points for line charts)
2. **Use pagination** - For large datasets, paginate or aggregate
3. **Lazy load** - Consider lazy loading charts below the fold

---

## 🚀 Future Enhancements

- [ ] Area charts for cumulative data
- [ ] Scatter plots for correlation analysis
- [ ] Mixed chart types (line + bar)
- [ ] Export charts as images
- [ ] Chart annotations and markers
- [ ] Real-time data updates
- [ ] Custom themes

---

## 📚 References

- [Recharts Documentation](https://recharts.org/)
- [AssetWorks Design System](#)
- [React 18 Patterns](#)

---

## ✅ Checklist for Developers

When adding new chart types:

- [ ] Create chart component in `/components/charts/`
- [ ] Export from `/components/charts/index.ts`
- [ ] Add chart type to `ChartData` interface
- [ ] Update `chart-parser.ts` to handle new type
- [ ] Update `ChartRenderer` to render new type
- [ ] Add to system prompt instructions
- [ ] Update this documentation
- [ ] Add tests
- [ ] Add storybook stories (if applicable)

---

## 🎉 Summary

Interactive charts are now fully integrated! The AI will automatically include chart data in generated reports, and they'll render as beautiful, interactive Recharts visualizations with AssetWorks branding.

**Key Benefits:**
- 📊 Professional, interactive visualizations
- 🎨 Consistent AssetWorks branding
- ⚡ Real-time rendering during report generation
- 🔧 Easy to extend with new chart types
- 📱 Responsive and mobile-friendly

---

Generated on: ${new Date().toLocaleString()}
