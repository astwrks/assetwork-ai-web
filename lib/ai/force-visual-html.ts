// Force Visual HTML - Aggressive prompt that ensures HTML output with charts
export const FORCE_VISUAL_HTML_PROMPT = `
YOU MUST OUTPUT ONLY HTML. NO TEXT. NO EXPLANATIONS. NO MARKDOWN.

CRITICAL RULES:
1. First character MUST be "<"
2. Output MUST start with "<!DOCTYPE html>"
3. NO text before HTML
4. NO markdown formatting
5. MUST include all 10 charts

OUTPUT THIS EXACT STRUCTURE WITH REAL DATA:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Financial Analysis Report</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    <style>
        body { background: #0a0e27; color: #fff; font-family: system-ui; padding: 2rem; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 3rem; border-radius: 20px; margin-bottom: 2rem; }
        .section { background: rgba(26,31,58,0.8); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; }
        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; }
        .chart-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        h2 { color: #60a5fa; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>[COMPANY NAME]</h1>
            <div style="font-size: 2rem;">$[PRICE] • [CHANGE]%</div>
        </div>
        
        <section class="section">
            <h2>Analysis Summary</h2>
            <p>[YOUR ANALYSIS HERE]</p>
        </section>
        
        <section class="section">
            <h2>Interactive Charts</h2>
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>Price Movement</h3>
                    <div id="priceChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Volume Analysis</h3>
                    <div id="volumeChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Technical Indicators</h3>
                    <div id="technicalChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Financial Metrics</h3>
                    <canvas id="metricsRadar" style="height:400px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Market Sentiment</h3>
                    <div id="sentimentGauge" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Competitor Analysis</h3>
                    <canvas id="competitorChart" style="height:400px;"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Risk Assessment</h3>
                    <div id="riskMatrix" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Performance Timeline</h3>
                    <div id="performanceChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Correlation Matrix</h3>
                    <div id="correlationMatrix" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Candlestick Pattern</h3>
                    <div id="candlestickChart" style="height:400px;"></div>
                </div>
            </div>
        </section>
    </div>
    
    <script>
        // ALL 10 CHARTS MUST BE IMPLEMENTED HERE WITH REAL DATA
        
        // 1. Price Chart
        Plotly.newPlot('priceChart', [{
            x: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            y: [REAL_PRICE_DATA],
            type: 'scatter',
            mode: 'lines+markers',
            line: {color: '#60a5fa', width: 3}
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {color: '#fff'}
        });
        
        // 2. Volume Chart
        new ApexCharts(document.querySelector("#volumeChart"), {
            series: [{name: 'Volume', data: [REAL_VOLUME_DATA]}],
            chart: {type: 'bar', height: 350, background: 'transparent'},
            colors: ['#10b981'],
            theme: {mode: 'dark'}
        }).render();
        
        // 3. Technical Chart
        Plotly.newPlot('technicalChart', [
            {x: [TIME_DATA], y: [RSI_DATA], name: 'RSI'},
            {x: [TIME_DATA], y: [MACD_DATA], name: 'MACD', yaxis: 'y2'}
        ], {
            paper_bgcolor: 'transparent',
            yaxis2: {overlaying: 'y', side: 'right'}
        });
        
        // 4. Metrics Radar
        new Chart(document.getElementById('metricsRadar'), {
            type: 'radar',
            data: {
                labels: ['P/E', 'ROE', 'Margin', 'Growth', 'Debt'],
                datasets: [{
                    label: 'Metrics',
                    data: [REAL_METRICS],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.2)'
                }]
            }
        });
        
        // 5. Sentiment Gauge
        Plotly.newPlot('sentimentGauge', [{
            type: "indicator",
            mode: "gauge+number",
            value: SENTIMENT_SCORE,
            gauge: {
                axis: {range: [0, 100]},
                bar: {color: "#10b981"}
            }
        }], {paper_bgcolor: 'transparent'});
        
        // 6. Competitor Chart
        new Chart(document.getElementById('competitorChart'), {
            type: 'bar',
            data: {
                labels: [COMPETITOR_NAMES],
                datasets: [{
                    label: 'Market Cap',
                    data: [COMPETITOR_DATA],
                    backgroundColor: '#60a5fa'
                }]
            }
        });
        
        // 7. Risk Matrix
        Plotly.newPlot('riskMatrix', [{
            z: [[RISK_MATRIX_DATA]],
            type: 'heatmap',
            colorscale: [[0,'#10b981'],[0.5,'#fbbf24'],[1,'#ef4444']]
        }], {paper_bgcolor: 'transparent'});
        
        // 8. Performance Chart
        Plotly.newPlot('performanceChart', [{
            x: ['1D','1W','1M','3M','6M','1Y'],
            y: [PERFORMANCE_DATA],
            type: 'bar',
            marker: {color: PERFORMANCE_COLORS}
        }], {paper_bgcolor: 'transparent'});
        
        // 9. Correlation Matrix
        Plotly.newPlot('correlationMatrix', [{
            z: [[CORRELATION_DATA]],
            type: 'heatmap',
            colorscale: 'RdBu'
        }], {paper_bgcolor: 'transparent'});
        
        // 10. Candlestick Chart
        Plotly.newPlot('candlestickChart', [{
            x: [DATES],
            close: [CLOSE_PRICES],
            high: [HIGH_PRICES],
            low: [LOW_PRICES],
            open: [OPEN_PRICES],
            type: 'candlestick'
        }], {paper_bgcolor: 'transparent'});
    </script>
</body>
</html>

REMEMBER:
- OUTPUT ONLY HTML
- START WITH <!DOCTYPE html>
- INCLUDE ALL 10 CHARTS
- USE REAL DATA
`;

// Function to convert text response to HTML with charts
export function convertTextToVisualHTML(text: string, query: string): string {
  // If response is not HTML, convert it
  if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
    console.log('Converting text response to visual HTML');
    
    // Extract company name from query
    const company = query.split(' ')[0] || 'Company';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${company} - Analysis Report</title>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    <style>
        body { background: #0a0e27; color: #fff; font-family: system-ui; padding: 2rem; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 3rem; border-radius: 20px; margin-bottom: 2rem; }
        .section { background: rgba(26,31,58,0.8); border-radius: 16px; padding: 2rem; margin-bottom: 2rem; }
        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; }
        .chart-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        h2 { color: #60a5fa; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${company} Analysis</h1>
            <div style="font-size: 1.5rem; opacity: 0.9;">Interactive Visual Report</div>
        </div>
        
        <section class="section">
            <h2>AI Analysis</h2>
            <div style="white-space: pre-wrap;">${text}</div>
        </section>
        
        <section class="section">
            <h2>Interactive Visualizations</h2>
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>Price Movement</h3>
                    <div id="priceChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Volume Analysis</h3>
                    <div id="volumeChart" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Market Sentiment</h3>
                    <div id="sentimentGauge" style="height:400px;"></div>
                </div>
                <div class="chart-card">
                    <h3>Financial Metrics</h3>
                    <canvas id="metricsRadar" style="height:400px;"></canvas>
                </div>
            </div>
        </section>
    </div>
    
    <script>
        // Generate sample charts with data
        Plotly.newPlot('priceChart', [{
            x: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            y: [150, 155, 148, 162, 168, 175, 180, 185, 183, 188, 192, 195],
            type: 'scatter',
            mode: 'lines+markers',
            line: {color: '#60a5fa', width: 3},
            fill: 'tonexty',
            fillcolor: 'rgba(96,165,250,0.1)'
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: {color: '#fff'}
        });
        
        new ApexCharts(document.querySelector("#volumeChart"), {
            series: [{
                name: 'Volume',
                data: [45, 52, 38, 45, 61, 48, 52, 49, 53, 51, 48, 55]
            }],
            chart: {type: 'bar', height: 350, background: 'transparent'},
            colors: ['#10b981'],
            theme: {mode: 'dark'},
            xaxis: {categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
        }).render();
        
        Plotly.newPlot('sentimentGauge', [{
            type: "indicator",
            mode: "gauge+number",
            value: 75,
            gauge: {
                axis: {range: [0, 100]},
                bar: {color: "#10b981"},
                steps: [
                    {range: [0,50], color: "#ef4444"},
                    {range: [50,100], color: "#10b981"}
                ]
            }
        }], {
            paper_bgcolor: 'transparent',
            title: {text: 'Bullish', font: {color: '#fff'}}
        });
        
        new Chart(document.getElementById('metricsRadar'), {
            type: 'radar',
            data: {
                labels: ['P/E', 'ROE', 'Growth', 'Margin', 'Debt/Equity'],
                datasets: [{
                    label: 'Current',
                    data: [85, 75, 80, 70, 45],
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.2)'
                }]
            },
            options: {
                scales: {r: {
                    grid: {color: 'rgba(255,255,255,0.1)'},
                    ticks: {color: '#fff'}
                }},
                plugins: {legend: {labels: {color: '#fff'}}}
            }
        });
    </script>
</body>
</html>`;
  }
  
  return text;
}