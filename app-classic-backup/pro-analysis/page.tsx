'use client';

import { useState } from 'react';
import { Search, TrendingUp, Loader2, FileText, Settings, User } from 'lucide-react';
import { ONE_SHOT_SYSTEM_PROMPT, generateOneShotPrompt, buildUserContext } from '@/lib/ai/one-shot-report';
import { VISUAL_GENERATION_PROMPT } from '@/lib/ai/visual-prompt';
import { FORCE_VISUAL_HTML_PROMPT } from '@/lib/ai/force-visual-html';
import { masterPromptSystem, DEFAULT_USER_CONTEXT } from '@/lib/ai/master-prompt-system';
import toast, { Toaster } from 'react-hot-toast';

// Function to generate sample visual report
function generateSampleVisualReport(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apple Inc. - Visual Analytics Report</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    <style>
        body { background: #0a0e27; color: #fff; font-family: system-ui; margin: 0; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; margin: 2rem 0; }
        .chart-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.5rem; }
        h1 { color: #60a5fa; }
        h2 { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Apple Inc. (AAPL) - Interactive Visual Report</h1>
        
        <div class="chart-grid">
            <!-- Price Chart -->
            <div class="chart-card">
                <h2>Stock Price Movement</h2>
                <div id="priceChart" style="height: 400px;"></div>
            </div>
            
            <!-- Volume Chart -->
            <div class="chart-card">
                <h2>Trading Volume</h2>
                <div id="volumeChart" style="height: 400px;"></div>
            </div>
            
            <!-- Technical Indicators -->
            <div class="chart-card">
                <h2>Technical Indicators</h2>
                <div id="technicalChart" style="height: 400px;"></div>
            </div>
            
            <!-- Financial Metrics -->
            <div class="chart-card">
                <h2>Financial Metrics</h2>
                <canvas id="metricsChart" height="400"></canvas>
            </div>
            
            <!-- Sentiment Gauge -->
            <div class="chart-card">
                <h2>Market Sentiment</h2>
                <div id="sentimentGauge" style="height: 400px;"></div>
            </div>
            
            <!-- Risk Matrix -->
            <div class="chart-card">
                <h2>Risk Assessment</h2>
                <div id="riskMatrix" style="height: 400px;"></div>
            </div>
        </div>
    </div>
    
    <script>
        // Price Chart
        Plotly.newPlot('priceChart', [{
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            y: [182, 178, 175, 180, 185, 189, 192, 195, 193, 195],
            type: 'scatter',
            mode: 'lines+markers',
            name: 'AAPL',
            line: { color: '#60a5fa', width: 3 },
            marker: { size: 8 }
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#fff' },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', title: 'Price ($)' }
        });
        
        // Volume Chart
        new ApexCharts(document.querySelector("#volumeChart"), {
            series: [{
                name: 'Volume',
                data: [45234000, 52456000, 38234000, 45678000, 61234000, 48956000, 52345000, 49876000, 53456000, 51234000]
            }],
            chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
            colors: ['#10b981'],
            plotOptions: { bar: { borderRadius: 4 } },
            theme: { mode: 'dark' },
            xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'] },
            yaxis: { labels: { formatter: (val) => (val/1000000).toFixed(0) + 'M' } },
            grid: { borderColor: 'rgba(255,255,255,0.1)' }
        }).render();
        
        // Technical Indicators
        Plotly.newPlot('technicalChart', [
            {
                x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                y: [45, 52, 48, 55, 62, 58, 65, 70, 68, 72],
                name: 'RSI',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#fbbf24', width: 2 }
            },
            {
                x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                y: [2, 1.5, -0.5, 1.8, 3.2, 2.8, 3.5, 4.2, 3.8, 4.5],
                name: 'MACD',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#ec4899', width: 2 },
                yaxis: 'y2'
            }
        ], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#fff' },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', title: 'RSI' },
            yaxis2: { overlaying: 'y', side: 'right', title: 'MACD' }
        });
        
        // Financial Metrics Radar
        const ctx = document.getElementById('metricsChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['P/E Ratio', 'ROE', 'Profit Margin', 'Revenue Growth', 'Debt/Equity', 'EPS Growth'],
                datasets: [{
                    label: 'AAPL',
                    data: [85, 92, 78, 88, 45, 82],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    pointBackgroundColor: '#60a5fa'
                }, {
                    label: 'Industry Avg',
                    data: [65, 70, 60, 65, 55, 68],
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    pointBackgroundColor: '#94a3b8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#fff' },
                        ticks: { color: '#fff', backdropColor: 'transparent' }
                    }
                }
            }
        });
        
        // Sentiment Gauge
        Plotly.newPlot('sentimentGauge', [{
            type: "indicator",
            mode: "gauge+number",
            value: 78,
            title: { text: "Bullish", font: { color: '#fff' } },
            gauge: {
                axis: { range: [0, 100], tickcolor: '#fff' },
                bar: { color: "#10b981" },
                bgcolor: "rgba(255,255,255,0.05)",
                steps: [
                    { range: [0, 25], color: "#ef4444" },
                    { range: [25, 50], color: "#fbbf24" },
                    { range: [50, 75], color: "#60a5fa" },
                    { range: [75, 100], color: "#10b981" }
                ]
            }
        }], {
            paper_bgcolor: 'transparent',
            font: { color: '#fff' }
        });
        
        // Risk Matrix
        Plotly.newPlot('riskMatrix', [{
            z: [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
            x: ['Low Impact', 'Medium Impact', 'High Impact', 'Critical Impact'],
            y: ['Low Prob', 'Medium Prob', 'High Prob', 'Very High Prob'],
            type: 'heatmap',
            colorscale: [[0, '#10b981'], [0.5, '#fbbf24'], [1, '#ef4444']],
            showscale: true
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#fff' }
        });
    </script>
</body>
</html>`;
}

export default function ProAnalysisPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [userContext] = useState(DEFAULT_USER_CONTEXT);
  const [preferences, setPreferences] = useState({
    style: 'Comprehensive',
    risk: 'Moderate',
    horizon: 'Long-term',
    detail: 'Institutional-grade',
    dataSource: 'Real-time web search'
  });

  const generateReport = async () => {
    if (!query.trim()) {
      toast.error('Please enter a company or stock to analyze');
      return;
    }

    setLoading(true);
    try {
      // Build complete prompt with all context
      const fullPrompt = masterPromptSystem.buildMasterPrompt(query, userContext);
      
      // Use force visual HTML prompt for guaranteed HTML output
      const visualSystemPrompt = FORCE_VISUAL_HTML_PROMPT;
      
      // Call the visual-stream API that ALWAYS returns HTML with charts
      const response = await fetch('/api/ai/visual-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: query
          }],
          model: 'claude-3-5-sonnet-20241022'
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }

      // Set the complete HTML report
      if (fullContent.includes('<!DOCTYPE html>')) {
        setReport(fullContent);
        toast.success('Report generated successfully!');
      } else {
        throw new Error('Invalid report format received');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      generateReport();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Toaster position="top-right" />
      
      {/* Clean Header */}
      <header className="border-b border-border backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-primary-foreground">Professional Analysis</h1>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                Real-Time Data
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-secondary rounded-lg transition">
                <User className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-border">
            <h2 className="text-xl font-semibold text-primary-foreground mb-6">
              One-Shot Complete Analysis
            </h2>
            
            {/* Quick Test Buttons for Visual Reports */}
            <div className="mb-4 flex gap-4">
              <button
                onClick={() => {
                  // Generate a sample visual report directly
                  const sampleVisualReport = generateSampleVisualReport();
                  setReport(sampleVisualReport);
                  toast.success('Sample visual report generated!');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-primary-foreground rounded-lg font-medium transition"
              >
                Generate Sample Visual Report (Test)
              </button>
              
              <button
                onClick={async () => {
                  // Fetch the complete visual report from test API
                  try {
                    const response = await fetch('/api/test-visual');
                    const data = await response.json();
                    if (data.html) {
                      setReport(data.html);
                      toast.success('Complete visual report loaded with all 10 charts!');
                    }
                  } catch (error) {
                    toast.error('Failed to load visual report');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-primary-foreground rounded-lg font-medium transition"
              >
                Load Complete Visual Report (All 10 Charts)
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter company name or stock symbol (e.g., Apple, AAPL, Microsoft)"
                className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-xl text-primary-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 transition pr-32"
                disabled={loading}
              />
              <button
                onClick={generateReport}
                disabled={loading}
                className="absolute right-2 top-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-primary-foreground rounded-lg font-medium transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>

            {/* Info Bar */}
            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Real-time web search
              </span>
              <span>• Comprehensive analysis</span>
              <span>• Professional grade</span>
              <span>• Single prompt results</span>
            </div>
          </div>
        </div>

        {/* Preferences Quick Settings */}
        <div className="mb-8 grid grid-cols-5 gap-4">
          {Object.entries(preferences).map(([key, value]) => (
            <div key={key} className="bg-background/30 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1 capitalize">{key}</div>
              <div className="text-sm text-primary-foreground font-medium">{value}</div>
            </div>
          ))}
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-background/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-primary-foreground font-medium">Analysis Report</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                  Real Data
                </span>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([report], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analysis-report-${Date.now()}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Report downloaded!');
                }}
                className="px-4 py-2 bg-secondary hover:bg-accent text-primary-foreground rounded-lg text-sm transition"
              >
                Download HTML
              </button>
            </div>
            
            {/* Report iframe */}
            <iframe
              srcDoc={report}
              className="w-full h-[800px] bg-background"
              title="Analysis Report"
              sandbox="allow-scripts"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-12 border border-border text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-foreground mb-2">Generating Complete Analysis</h3>
            <p className="text-muted-foreground">
              Searching real-time data • Building comprehensive report • This may take a moment...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-12 border border-border text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary-foreground mb-2">Ready for Analysis</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a company name or stock symbol above to generate a comprehensive, 
              real-time analysis report with complete market data, financials, and insights.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}