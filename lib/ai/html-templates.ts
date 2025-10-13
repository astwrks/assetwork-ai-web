/**
 * Professional HTML Templates for Financial Reports
 * Provides reusable, high-quality HTML structures with modern styling
 */

export const HTML_DESIGN_SYSTEM = `
/* AssetWorks Design System - Use these classes and styles */

COLOR PALETTE:
- Primary: #1B2951 (Navy Blue)
- Secondary: #405D80 (Steel Blue)
- Accent: #6C7B95 (Slate Blue)
- Success: #10B981 (Emerald)
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)
- Info: #3B82F6 (Blue)
- Background: #F8FAFC (Light Gray)
- Text: #1E293B (Dark Slate)
- Muted: #64748B (Gray)

TYPOGRAPHY HIERARCHY:
- Section Title: text-2xl md:text-3xl font-bold text-[#1B2951]
- Subsection: text-xl font-semibold text-[#405D80]
- Body: text-base text-[#1E293B]
- Caption: text-sm text-[#64748B]
- Metric: text-3xl font-bold

SPACING SYSTEM:
- Section padding: p-6 md:p-8
- Card padding: p-4 md:p-6
- Gap between elements: space-y-4 or gap-4
- Container max width: max-w-7xl mx-auto

COMPONENT PATTERNS:
1. Metric Cards: bg-white rounded-lg shadow-sm border border-gray-100
2. Data Tables: rounded-lg overflow-hidden with striped rows
3. Charts: bg-gradient-to-br with color accents
4. Insights: bg-blue-50 border-l-4 border-blue-500
5. Warnings: bg-amber-50 border-l-4 border-amber-500
`;

export const SECTION_TEMPLATES = {
  // Executive Summary with Key Metrics
  executiveSummary: `
<section data-section-id="section_executive_summary" class="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
  <h2 class="text-3xl font-bold text-[#1B2951] mb-6 pb-4 border-b-2 border-[#405D80]">
    Executive Summary
  </h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Metric Card 1 -->
    <div class="bg-gradient-to-br from-blue-50 to-white rounded-lg p-6 border border-blue-100 hover:shadow-md transition-shadow">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-[#64748B]">Total Revenue</span>
        <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/>
        </svg>
      </div>
      <div class="text-3xl font-bold text-[#1B2951]">$2.4M</div>
      <div class="mt-2 flex items-center text-sm">
        <span class="text-green-600 font-medium">↑ 12.5%</span>
        <span class="text-[#64748B] ml-2">vs last quarter</span>
      </div>
    </div>
    
    <!-- Add more metric cards -->
  </div>
  
  <div class="prose max-w-none">
    <p class="text-[#1E293B] leading-relaxed">
      [Summary content here]
    </p>
  </div>
</section>
  `,

  // Data Table with Modern Styling
  dataTable: `
<section data-section-id="section_data_table" class="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
  <h2 class="text-2xl font-bold text-[#1B2951] mb-4">Financial Breakdown</h2>
  
  <div class="overflow-x-auto rounded-lg border border-gray-200">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gradient-to-r from-[#1B2951] to-[#405D80]">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Category</th>
          <th class="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
          <th class="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Change</th>
          <th class="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Status</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1E293B]">Revenue</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[#1B2951]">$2,400,000</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              +12.5%
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ On Target
            </span>
          </td>
        </tr>
        <!-- Add more rows -->
      </tbody>
    </table>
  </div>
</section>
  `,

  // Insight Box
  insightBox: `
<div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 my-6 shadow-sm">
  <div class="flex items-start">
    <svg class="w-6 h-6 text-blue-500 mt-1 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
    </svg>
    <div>
      <h4 class="text-lg font-semibold text-[#1B2951] mb-2">Key Insight</h4>
      <p class="text-[#1E293B] leading-relaxed">[Insight content]</p>
    </div>
  </div>
</div>
  `,

  // Chart Container
  chartContainer: `
<div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-semibold text-[#1B2951]">Revenue Trends</h3>
    <span class="text-sm text-[#64748B]">Last 12 Months</span>
  </div>
  
  <div class="aspect-video bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg flex items-center justify-center border border-gray-200">
    <!-- Chart visualization would go here -->
    <div class="text-center">
      <svg class="w-16 h-16 mx-auto text-[#405D80] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      <p class="text-sm text-[#64748B]">Chart visualization</p>
    </div>
  </div>
  
  <div class="mt-4 grid grid-cols-3 gap-4 text-center">
    <div>
      <div class="text-2xl font-bold text-[#1B2951]">$1.2M</div>
      <div class="text-xs text-[#64748B] mt-1">Average</div>
    </div>
    <div>
      <div class="text-2xl font-bold text-green-600">$1.8M</div>
      <div class="text-xs text-[#64748B] mt-1">Peak</div>
    </div>
    <div>
      <div class="text-2xl font-bold text-amber-600">$0.8M</div>
      <div class="text-xs text-[#64748B] mt-1">Low</div>
    </div>
  </div>
</div>
  `,
};

export const HTML_BEST_PRACTICES = `
QUALITY GUIDELINES FOR GENERATED HTML:

1. STRUCTURE:
   ✓ Use semantic HTML5 elements (section, article, aside)
   ✓ Include data-section-id attribute on root element
   ✓ Proper heading hierarchy (h2 for section, h3 for subsections)
   ✓ Use descriptive class names

2. STYLING (Tailwind CSS):
   ✓ Use AssetWorks color palette consistently
   ✓ Apply responsive classes (md:, lg: breakpoints)
   ✓ Add hover states for interactive elements
   ✓ Include shadows, borders, and rounded corners
   ✓ Use gradients for visual interest
   ✓ Ensure proper spacing (p-6, space-y-4, gap-4)

3. VISUAL HIERARCHY:
   ✓ Bold, large titles (text-2xl md:text-3xl)
   ✓ Clear section separation (borders, backgrounds)
   ✓ Grouped related content (cards, containers)
   ✓ Consistent alignment
   ✓ Proper use of whitespace

4. COMPONENTS:
   ✓ Metric cards with icons and trend indicators
   ✓ Professional tables with header styling
   ✓ Insight boxes with colored borders
   ✓ Chart containers with legends
   ✓ Status badges (pills/tags)

5. ACCESSIBILITY:
   ✓ Sufficient color contrast
   ✓ Readable font sizes (text-sm minimum)
   ✓ Clear focus states
   ✓ Semantic markup

6. DATA PRESENTATION:
   ✓ Format numbers with commas (e.g., $1,234,567)
   ✓ Show percentages with proper precision
   ✓ Use icons for trends (↑ ↓ →)
   ✓ Color-code status (green=good, red=bad, amber=warning)
   ✓ Include comparative metrics (vs last period)

7. PROFESSIONAL TOUCHES:
   ✓ Gradients on cards and headers
   ✓ Subtle shadows for depth
   ✓ Hover effects for interactivity
   ✓ Icons from heroicons or lucide
   ✓ Smooth transitions
   ✓ Responsive grid layouts
`;
