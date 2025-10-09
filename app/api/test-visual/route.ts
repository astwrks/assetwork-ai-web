import { NextResponse } from 'next/server';

export async function GET() {
  // Generate a complete visual report with all 10 charts working
  const visualReport = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apple Inc. (AAPL) - Complete Visual Analysis Report</title>
    
    <!-- Chart Libraries -->
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #0f1629 100%);
            color: #e8e8e8;
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 3rem;
            margin-bottom: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        h1 {
            font-size: 3rem;
            font-weight: 900;
            margin-bottom: 1rem;
        }
        .section {
            background: rgba(26, 31, 58, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 2rem;
        }
        .chart-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.5rem;
        }
        h2 {
            color: #60a5fa;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }
        h3 {
            color: #94a3b8;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0.5rem 0;
        }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Apple Inc. (AAPL)</h1>
            <p style="font-size: 1.5rem; opacity: 0.9;">Complete Visual Analysis Report with 10+ Interactive Charts</p>
            <div style="margin-top: 2rem; display: flex; gap: 2rem;">
                <div>
                    <div style="opacity: 0.7;">Current Price</div>
                    <div class="metric-value">$195.82</div>
                    <div class="positive">↑ +2.45%</div>
                </div>
                <div>
                    <div style="opacity: 0.7;">Market Cap</div>
                    <div class="metric-value">$3.04T</div>
                </div>
                <div>
                    <div style="opacity: 0.7;">P/E Ratio</div>
                    <div class="metric-value">32.8</div>
                </div>
            </div>
        </div>

        <!-- Charts Section -->
        <section class="section">
            <h2>Interactive Visual Analytics</h2>
            <div class="chart-grid">
                
                <!-- 1. Price Chart -->
                <div class="chart-card">
                    <h3>1. Stock Price Movement (Plotly Line Chart)</h3>
                    <div id="priceChart" style="height: 400px;"></div>
                </div>
                
                <!-- 2. Volume Chart -->
                <div class="chart-card">
                    <h3>2. Trading Volume (ApexCharts Bar)</h3>
                    <div id="volumeChart" style="height: 400px;"></div>
                </div>
                
                <!-- 3. Technical Indicators -->
                <div class="chart-card">
                    <h3>3. Technical Indicators (Plotly Multi-Axis)</h3>
                    <div id="technicalChart" style="height: 400px;"></div>
                </div>
                
                <!-- 4. Financial Metrics Radar -->
                <div class="chart-card">
                    <h3>4. Financial Metrics (Chart.js Radar)</h3>
                    <canvas id="metricsRadar" style="max-height: 400px;"></canvas>
                </div>
                
                <!-- 5. Sentiment Gauge -->
                <div class="chart-card">
                    <h3>5. Market Sentiment (Plotly Gauge)</h3>
                    <div id="sentimentGauge" style="height: 400px;"></div>
                </div>
                
                <!-- 6. Competitor Comparison -->
                <div class="chart-card">
                    <h3>6. Competitor Analysis (Chart.js Bar)</h3>
                    <canvas id="competitorChart" style="max-height: 400px;"></canvas>
                </div>
                
                <!-- 7. Risk Heatmap -->
                <div class="chart-card">
                    <h3>7. Risk Matrix (Plotly Heatmap)</h3>
                    <div id="riskMatrix" style="height: 400px;"></div>
                </div>
                
                <!-- 8. Performance Timeline -->
                <div class="chart-card">
                    <h3>8. Performance Timeline (Plotly Bar)</h3>
                    <div id="performanceChart" style="height: 400px;"></div>
                </div>
                
                <!-- 9. Correlation Matrix -->
                <div class="chart-card">
                    <h3>9. Correlation Matrix (Plotly Heatmap)</h3>
                    <div id="correlationMatrix" style="height: 400px;"></div>
                </div>
                
                <!-- 10. Candlestick Chart -->
                <div class="chart-card">
                    <h3>10. Candlestick Pattern (Plotly OHLC)</h3>
                    <div id="candlestickChart" style="height: 400px;"></div>
                </div>
                
            </div>
        </section>
    </div>

    <script>
        // Chart styling
        const darkTheme = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#e8e8e8' },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)' }
        };

        // 1. Price Chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const prices = [182, 178, 175, 180, 185, 189, 192, 195, 193, 195, 198, 196];
        
        Plotly.newPlot('priceChart', [{
            x: months,
            y: prices,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'AAPL Price',
            line: { color: '#60a5fa', width: 3 },
            marker: { size: 8, color: '#60a5fa' },
            fill: 'tonexty',
            fillcolor: 'rgba(96, 165, 250, 0.1)'
        }], {
            ...darkTheme,
            title: { text: 'Stock Price Trend', font: { color: '#60a5fa' } },
            yaxis: { ...darkTheme.yaxis, title: 'Price ($)' }
        });

        // 2. Volume Chart
        const volumeOptions = {
            series: [{
                name: 'Volume',
                data: [45234000, 52456000, 38234000, 45678000, 61234000, 48956000, 52345000, 49876000, 53456000, 51234000, 48765000, 55432000]
            }],
            chart: {
                type: 'bar',
                height: 350,
                background: 'transparent',
                toolbar: { show: false }
            },
            colors: ['#10b981'],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '60%'
                }
            },
            theme: { mode: 'dark' },
            xaxis: {
                categories: months,
                labels: { style: { colors: '#e8e8e8' } }
            },
            yaxis: {
                labels: {
                    formatter: (val) => (val/1000000).toFixed(0) + 'M',
                    style: { colors: '#e8e8e8' }
                }
            },
            grid: { borderColor: 'rgba(255,255,255,0.1)' },
            title: {
                text: 'Monthly Trading Volume',
                style: { color: '#60a5fa' }
            }
        };
        new ApexCharts(document.querySelector("#volumeChart"), volumeOptions).render();

        // 3. Technical Indicators
        Plotly.newPlot('technicalChart', [
            {
                x: months,
                y: [45, 52, 48, 55, 62, 58, 65, 70, 68, 72, 75, 73],
                name: 'RSI',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#fbbf24', width: 2 }
            },
            {
                x: months,
                y: [2, 1.5, -0.5, 1.8, 3.2, 2.8, 3.5, 4.2, 3.8, 4.5, 5.0, 4.8],
                name: 'MACD',
                type: 'scatter',
                mode: 'lines',
                line: { color: '#ec4899', width: 2 },
                yaxis: 'y2'
            }
        ], {
            ...darkTheme,
            title: { text: 'Technical Indicators', font: { color: '#60a5fa' } },
            yaxis: { ...darkTheme.yaxis, title: 'RSI' },
            yaxis2: {
                overlaying: 'y',
                side: 'right',
                title: 'MACD',
                gridcolor: 'rgba(255,255,255,0.05)'
            }
        });

        // 4. Financial Metrics Radar
        const ctx = document.getElementById('metricsRadar').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['P/E Ratio', 'ROE', 'Profit Margin', 'Revenue Growth', 'Debt/Equity', 'EPS Growth'],
                datasets: [{
                    label: 'Apple',
                    data: [85, 92, 78, 88, 45, 82],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    pointBackgroundColor: '#60a5fa',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#60a5fa'
                }, {
                    label: 'Industry Average',
                    data: [65, 70, 60, 65, 55, 68],
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    pointBackgroundColor: '#94a3b8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#e8e8e8' } },
                    title: {
                        display: true,
                        text: 'Financial Metrics Comparison',
                        color: '#60a5fa'
                    }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#e8e8e8' },
                        ticks: { color: '#e8e8e8', backdropColor: 'transparent' }
                    }
                }
            }
        });

        // 5. Sentiment Gauge
        Plotly.newPlot('sentimentGauge', [{
            type: "indicator",
            mode: "gauge+number+delta",
            value: 78,
            delta: { reference: 65 },
            title: { text: "Market Sentiment", font: { color: '#60a5fa' } },
            gauge: {
                axis: { range: [0, 100], tickcolor: '#e8e8e8' },
                bar: { color: "#10b981" },
                bgcolor: "rgba(255,255,255,0.05)",
                steps: [
                    { range: [0, 25], color: "#ef4444" },
                    { range: [25, 50], color: "#fbbf24" },
                    { range: [50, 75], color: "#60a5fa" },
                    { range: [75, 100], color: "#10b981" }
                ],
                threshold: {
                    line: { color: "white", width: 4 },
                    thickness: 0.75,
                    value: 90
                }
            }
        }], darkTheme);

        // 6. Competitor Comparison
        const compCtx = document.getElementById('competitorChart').getContext('2d');
        new Chart(compCtx, {
            type: 'bar',
            data: {
                labels: ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta'],
                datasets: [
                    {
                        label: 'Market Cap (B)',
                        data: [3040, 2850, 1750, 1580, 900],
                        backgroundColor: '#60a5fa'
                    },
                    {
                        label: 'Revenue (B)',
                        data: [385, 211, 282, 513, 116],
                        backgroundColor: '#10b981'
                    },
                    {
                        label: 'Net Income (B)',
                        data: [97, 72, 73, 12, 39],
                        backgroundColor: '#fbbf24'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#e8e8e8' } },
                    title: {
                        display: true,
                        text: 'Tech Giants Comparison',
                        color: '#60a5fa'
                    }
                },
                scales: {
                    x: { ticks: { color: '#e8e8e8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: '#e8e8e8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });

        // 7. Risk Matrix
        Plotly.newPlot('riskMatrix', [{
            z: [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
            x: ['Low Impact', 'Medium Impact', 'High Impact', 'Critical Impact'],
            y: ['Low Probability', 'Medium Probability', 'High Probability', 'Very High Probability'],
            type: 'heatmap',
            colorscale: [[0, '#10b981'], [0.5, '#fbbf24'], [1, '#ef4444']],
            showscale: true,
            colorbar: {
                title: 'Risk Level',
                titlefont: { color: '#e8e8e8' },
                tickfont: { color: '#e8e8e8' }
            }
        }], {
            ...darkTheme,
            title: { text: 'Risk Assessment Matrix', font: { color: '#60a5fa' } }
        });

        // 8. Performance Timeline
        Plotly.newPlot('performanceChart', [{
            x: ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'],
            y: [-0.5, 2.3, 5.6, 12.4, 18.9, 22.3, 28.5, 65.2, 125.8],
            type: 'bar',
            marker: {
                color: [-0.5, 2.3, 5.6, 12.4, 18.9, 22.3, 28.5, 65.2, 125.8],
                colorscale: [
                    [0, '#ef4444'],
                    [0.5, '#fbbf24'],
                    [1, '#10b981']
                ],
                cmin: -10,
                cmax: 130
            }
        }], {
            ...darkTheme,
            title: { text: 'Performance Over Time', font: { color: '#60a5fa' } },
            yaxis: { ...darkTheme.yaxis, title: 'Return (%)' }
        });

        // 9. Correlation Matrix
        const corrData = [
            [1.00, 0.82, 0.65, 0.73, 0.58],
            [0.82, 1.00, 0.71, 0.68, 0.62],
            [0.65, 0.71, 1.00, 0.55, 0.48],
            [0.73, 0.68, 0.55, 1.00, 0.77],
            [0.58, 0.62, 0.48, 0.77, 1.00]
        ];
        
        Plotly.newPlot('correlationMatrix', [{
            z: corrData,
            x: ['Price', 'Volume', 'RSI', 'MACD', 'Volatility'],
            y: ['Price', 'Volume', 'RSI', 'MACD', 'Volatility'],
            type: 'heatmap',
            colorscale: 'RdBu',
            reversescale: true,
            showscale: true,
            colorbar: {
                title: 'Correlation',
                titlefont: { color: '#e8e8e8' },
                tickfont: { color: '#e8e8e8' }
            }
        }], {
            ...darkTheme,
            title: { text: 'Indicator Correlation Matrix', font: { color: '#60a5fa' } }
        });

        // 10. Candlestick Chart
        const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
        Plotly.newPlot('candlestickChart', [{
            x: dates,
            close: [195, 197, 194, 196, 198],
            high: [196, 199, 197, 198, 200],
            low: [193, 195, 192, 194, 196],
            open: [194, 195, 196, 194, 197],
            type: 'candlestick',
            increasing: { line: { color: '#10b981' } },
            decreasing: { line: { color: '#ef4444' } }
        }], {
            ...darkTheme,
            title: { text: '5-Day Candlestick Pattern', font: { color: '#60a5fa' } },
            yaxis: { ...darkTheme.yaxis, title: 'Price ($)' }
        });
    </script>
</body>
</html>`;

  return NextResponse.json({ 
    success: true, 
    html: visualReport,
    message: 'Visual report with all 10 charts generated successfully'
  });
}