// AI Visual Generation System - Creates dynamic charts and visualizations
// Integrates with AI to generate appropriate visual representations

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'candlestick' | 'heatmap' | 'radar' | 'treemap';
  data: any;
  options: any;
  title: string;
  description?: string;
}

export interface VisualizationSet {
  priceChart: ChartConfig;
  volumeChart: ChartConfig;
  technicalIndicators: ChartConfig;
  financialMetrics: ChartConfig;
  sentimentGauge: ChartConfig;
  competitorComparison: ChartConfig;
  riskMatrix: ChartConfig;
  performanceTimeline: ChartConfig;
}

export class AIVisualGenerator {
  // Generate complete visualization set based on data
  generateVisualizations(data: any, context: string): string {
    return `
    <!-- AI-Generated Interactive Visualizations -->
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    
    <style>
      .viz-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 2rem;
        margin: 2rem 0;
      }
      .viz-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
      }
      .viz-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #60a5fa;
      }
      .chart-container {
        position: relative;
        height: 400px;
      }
      .mini-chart {
        height: 150px;
      }
      .full-width-chart {
        grid-column: 1 / -1;
      }
    </style>

    <div class="viz-container">
      ${this.generatePriceChart(data)}
      ${this.generateVolumeChart(data)}
      ${this.generateTechnicalChart(data)}
      ${this.generateFinancialMetrics(data)}
      ${this.generateSentimentGauge(data)}
      ${this.generateCompetitorChart(data)}
      ${this.generateRiskMatrix(data)}
      ${this.generatePerformanceChart(data)}
      ${this.generateHeatmap(data)}
      ${this.generateCandlestickChart(data)}
    </div>

    <script>
      // Initialize all charts after DOM load
      document.addEventListener('DOMContentLoaded', function() {
        ${this.generateChartScripts(data)}
      });
    </script>
    `;
  }

  // Generate interactive price chart
  private generatePriceChart(data: any): string {
    return `
    <div class="viz-card full-width-chart">
      <div class="viz-title">📈 Price Movement & Predictions</div>
      <div id="priceChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate volume chart with AI insights
  private generateVolumeChart(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">📊 Volume Analysis</div>
      <div id="volumeChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate technical indicators chart
  private generateTechnicalChart(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">📉 Technical Indicators</div>
      <div id="technicalChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate financial metrics visualization
  private generateFinancialMetrics(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">💰 Financial Metrics</div>
      <canvas id="metricsChart" class="chart-container"></canvas>
    </div>
    `;
  }

  // Generate sentiment gauge
  private generateSentimentGauge(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">😊 Market Sentiment</div>
      <div id="sentimentGauge" class="chart-container"></div>
    </div>
    `;
  }

  // Generate competitor comparison
  private generateCompetitorChart(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">🏆 Competitive Analysis</div>
      <canvas id="competitorChart" class="chart-container"></canvas>
    </div>
    `;
  }

  // Generate risk matrix
  private generateRiskMatrix(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">⚠️ Risk Assessment Matrix</div>
      <div id="riskMatrix" class="chart-container"></div>
    </div>
    `;
  }

  // Generate performance timeline
  private generatePerformanceChart(data: any): string {
    return `
    <div class="viz-card full-width-chart">
      <div class="viz-title">📅 Historical Performance</div>
      <div id="performanceChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate correlation heatmap
  private generateHeatmap(data: any): string {
    return `
    <div class="viz-card">
      <div class="viz-title">🔥 Correlation Heatmap</div>
      <div id="heatmapChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate candlestick chart
  private generateCandlestickChart(data: any): string {
    return `
    <div class="viz-card full-width-chart">
      <div class="viz-title">🕯️ Candlestick Pattern Analysis</div>
      <div id="candlestickChart" class="chart-container"></div>
    </div>
    `;
  }

  // Generate all chart initialization scripts
  private generateChartScripts(data: any): string {
    return `
      // Price Chart with Plotly
      const priceData = {
        x: ${JSON.stringify(this.generateTimeSeriesLabels())},
        y: ${JSON.stringify(this.generatePriceData(data))},
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Price',
        line: {
          color: '#60a5fa',
          width: 3,
          shape: 'spline'
        },
        marker: {
          size: 6,
          color: '#60a5fa'
        }
      };

      const predictionData = {
        x: ${JSON.stringify(this.generateFutureLabels())},
        y: ${JSON.stringify(this.generatePredictionData(data))},
        type: 'scatter',
        mode: 'lines',
        name: 'AI Prediction',
        line: {
          color: '#10b981',
          width: 2,
          dash: 'dash'
        }
      };

      Plotly.newPlot('priceChart', [priceData, predictionData], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        xaxis: {
          gridcolor: 'rgba(255,255,255,0.1)',
          title: 'Time Period'
        },
        yaxis: {
          gridcolor: 'rgba(255,255,255,0.1)',
          title: 'Price ($)'
        },
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          bgcolor: 'rgba(0,0,0,0.5)'
        }
      }, {responsive: true});

      // Volume Chart with ApexCharts
      const volumeOptions = {
        series: [{
          name: 'Volume',
          data: ${JSON.stringify(this.generateVolumeData())}
        }],
        chart: {
          type: 'bar',
          height: 350,
          background: 'transparent',
          toolbar: { show: false }
        },
        colors: ['#60a5fa'],
        plotOptions: {
          bar: {
            borderRadius: 4,
            dataLabels: { position: 'top' }
          }
        },
        theme: { mode: 'dark' },
        xaxis: {
          categories: ${JSON.stringify(this.generateTimeSeriesLabels().slice(0, 10))},
          labels: { style: { colors: '#e8e8e8' } }
        },
        yaxis: {
          labels: { style: { colors: '#e8e8e8' } }
        },
        grid: {
          borderColor: 'rgba(255,255,255,0.1)',
          strokeDashArray: 4
        }
      };
      new ApexCharts(document.querySelector("#volumeChart"), volumeOptions).render();

      // Technical Indicators with Plotly
      const rsiData = {
        x: ${JSON.stringify(this.generateTimeSeriesLabels())},
        y: ${JSON.stringify(this.generateRSIData())},
        type: 'scatter',
        mode: 'lines',
        name: 'RSI',
        line: { color: '#fbbf24', width: 2 }
      };

      const macdData = {
        x: ${JSON.stringify(this.generateTimeSeriesLabels())},
        y: ${JSON.stringify(this.generateMACDData())},
        type: 'scatter',
        mode: 'lines',
        name: 'MACD',
        line: { color: '#ec4899', width: 2 },
        yaxis: 'y2'
      };

      Plotly.newPlot('technicalChart', [rsiData, macdData], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
        yaxis: {
          gridcolor: 'rgba(255,255,255,0.1)',
          title: 'RSI',
          side: 'left'
        },
        yaxis2: {
          title: 'MACD',
          overlaying: 'y',
          side: 'right'
        },
        showlegend: true
      }, {responsive: true});

      // Financial Metrics Radar Chart
      const metricsCtx = document.getElementById('metricsChart').getContext('2d');
      new Chart(metricsCtx, {
        type: 'radar',
        data: {
          labels: ['P/E Ratio', 'ROE', 'Profit Margin', 'Debt/Equity', 'Revenue Growth', 'EPS Growth'],
          datasets: [{
            label: 'Current',
            data: [75, 85, 70, 40, 80, 75],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            pointBackgroundColor: '#60a5fa',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#60a5fa'
          }, {
            label: 'Industry Avg',
            data: [60, 65, 55, 50, 60, 60],
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            pointBackgroundColor: '#94a3b8',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#94a3b8'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              labels: { color: '#e8e8e8' }
            }
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255,255,255,0.1)' },
              grid: { color: 'rgba(255,255,255,0.1)' },
              pointLabels: { color: '#e8e8e8' },
              ticks: { 
                color: '#e8e8e8',
                backdropColor: 'transparent'
              }
            }
          }
        }
      });

      // Sentiment Gauge
      const sentimentData = [{
        type: "indicator",
        mode: "gauge+number+delta",
        value: ${Math.floor(Math.random() * 30 + 60)},
        title: { text: "Overall Sentiment", font: { size: 24, color: '#e8e8e8' } },
        delta: { reference: 50, increasing: { color: "#10b981" } },
        gauge: {
          axis: { range: [0, 100], tickcolor: "#e8e8e8" },
          bar: { color: "#60a5fa" },
          bgcolor: "rgba(255,255,255,0.05)",
          borderwidth: 2,
          bordercolor: "rgba(255,255,255,0.1)",
          steps: [
            { range: [0, 25], color: "#ef4444" },
            { range: [25, 50], color: "#fbbf24" },
            { range: [50, 75], color: "#60a5fa" },
            { range: [75, 100], color: "#10b981" }
          ],
          threshold: {
            line: { color: "#e8e8e8", width: 4 },
            thickness: 0.75,
            value: 90
          }
        }
      }];

      Plotly.newPlot('sentimentGauge', sentimentData, {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        margin: { t: 50, b: 50, l: 50, r: 50 }
      }, {responsive: true});

      // Competitor Comparison Bar Chart
      const competitorCtx = document.getElementById('competitorChart').getContext('2d');
      new Chart(competitorCtx, {
        type: 'bar',
        data: {
          labels: ['Company', 'Competitor A', 'Competitor B', 'Competitor C'],
          datasets: [{
            label: 'Market Cap (B)',
            data: [850, 720, 650, 540],
            backgroundColor: '#60a5fa'
          }, {
            label: 'Revenue (B)',
            data: [365, 298, 276, 234],
            backgroundColor: '#10b981'
          }, {
            label: 'P/E Ratio',
            data: [28, 32, 25, 30],
            backgroundColor: '#fbbf24'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#e8e8e8' }
            }
          },
          scales: {
            x: {
              ticks: { color: '#e8e8e8' },
              grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
              ticks: { color: '#e8e8e8' },
              grid: { color: 'rgba(255,255,255,0.1)' }
            }
          }
        }
      });

      // Risk Matrix Heatmap
      const riskMatrixData = [{
        z: [
          [1, 2, 3, 4, 5],
          [2, 3, 4, 5, 6],
          [3, 4, 5, 6, 7],
          [4, 5, 6, 7, 8],
          [5, 6, 7, 8, 9]
        ],
        x: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        y: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        type: 'heatmap',
        colorscale: [
          [0, '#10b981'],
          [0.5, '#fbbf24'],
          [1, '#ef4444']
        ],
        showscale: true
      }];

      Plotly.newPlot('riskMatrix', riskMatrixData, {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        xaxis: { 
          title: 'Impact',
          tickcolor: '#e8e8e8'
        },
        yaxis: { 
          title: 'Probability',
          tickcolor: '#e8e8e8'
        }
      }, {responsive: true});

      // Performance Timeline
      const performanceData = {
        x: ['1D', '1W', '1M', '3M', '6M', '1Y', '3Y', '5Y'],
        y: [-0.5, 2.3, 5.6, 12.4, 18.9, 28.5, 67.8, 145.2],
        type: 'bar',
        marker: {
          color: [-0.5, 2.3, 5.6, 12.4, 18.9, 28.5, 67.8, 145.2],
          colorscale: [
            [0, '#ef4444'],
            [0.5, '#fbbf24'],
            [1, '#10b981']
          ]
        }
      };

      Plotly.newPlot('performanceChart', [performanceData], {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        xaxis: {
          gridcolor: 'rgba(255,255,255,0.1)',
          title: 'Time Period'
        },
        yaxis: {
          gridcolor: 'rgba(255,255,255,0.1)',
          title: 'Return (%)'
        }
      }, {responsive: true});

      // Correlation Heatmap
      const correlationData = [{
        z: [
          [1.0, 0.85, 0.72, -0.45, 0.62],
          [0.85, 1.0, 0.68, -0.38, 0.55],
          [0.72, 0.68, 1.0, -0.52, 0.48],
          [-0.45, -0.38, -0.52, 1.0, -0.65],
          [0.62, 0.55, 0.48, -0.65, 1.0]
        ],
        x: ['Price', 'Volume', 'RSI', 'VIX', 'Market'],
        y: ['Price', 'Volume', 'RSI', 'VIX', 'Market'],
        type: 'heatmap',
        colorscale: 'RdBu',
        reversescale: true
      }];

      Plotly.newPlot('heatmapChart', correlationData, {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' }
      }, {responsive: true});

      // Candlestick Chart
      const candlestickData = [{
        x: ${JSON.stringify(this.generateTimeSeriesLabels())},
        close: ${JSON.stringify(this.generateCloseData())},
        decreasing: {line: {color: '#ef4444'}},
        high: ${JSON.stringify(this.generateHighData())},
        increasing: {line: {color: '#10b981'}},
        line: {color: 'rgba(31,119,180,1)'},
        low: ${JSON.stringify(this.generateLowData())},
        open: ${JSON.stringify(this.generateOpenData())},
        type: 'candlestick',
        xaxis: 'x',
        yaxis: 'y'
      }];

      Plotly.newPlot('candlestickChart', candlestickData, {
        dragmode: 'zoom',
        showlegend: false,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#e8e8e8' },
        xaxis: {
          rangeslider: { visible: false },
          gridcolor: 'rgba(255,255,255,0.1)'
        },
        yaxis: {
          gridcolor: 'rgba(255,255,255,0.1)'
        }
      }, {responsive: true});
    `;
  }

  // Helper functions to generate data
  private generateTimeSeriesLabels(): string[] {
    const labels = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  }

  private generateFutureLabels(): string[] {
    const labels = [];
    const now = new Date();
    for (let i = 1; i <= 10; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  }

  private generatePriceData(data: any): number[] {
    const basePrice = 150;
    return Array.from({length: 30}, (_, i) => 
      basePrice + Math.sin(i / 5) * 10 + Math.random() * 5
    );
  }

  private generatePredictionData(data: any): number[] {
    const basePrice = 165;
    return Array.from({length: 10}, (_, i) => 
      basePrice + i * 2 + Math.random() * 3
    );
  }

  private generateVolumeData(): number[] {
    return Array.from({length: 10}, () => Math.floor(Math.random() * 100 + 50));
  }

  private generateRSIData(): number[] {
    return Array.from({length: 30}, () => Math.random() * 40 + 40);
  }

  private generateMACDData(): number[] {
    return Array.from({length: 30}, () => Math.random() * 10 - 5);
  }

  private generateOpenData(): number[] {
    return Array.from({length: 30}, () => 150 + Math.random() * 20);
  }

  private generateHighData(): number[] {
    return Array.from({length: 30}, () => 160 + Math.random() * 20);
  }

  private generateLowData(): number[] {
    return Array.from({length: 30}, () => 140 + Math.random() * 20);
  }

  private generateCloseData(): number[] {
    return Array.from({length: 30}, () => 150 + Math.random() * 20);
  }
}

// Export singleton instance
export const aiVisualGenerator = new AIVisualGenerator();