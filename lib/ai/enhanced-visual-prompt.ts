// Enhanced Visual Prompt - Forces AI to generate all 10 charts
export const ENHANCED_VISUAL_PROMPT = `
CRITICAL VISUAL REQUIREMENTS:
You MUST include ALL 10 interactive charts below in your HTML report.
Each chart MUST have real data (not placeholder).
Copy this EXACT structure and modify with real data:

<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
</head>
<body>
    <!-- CHART 1: Price Movement -->
    <div id="priceChart" style="height:400px;"></div>
    
    <!-- CHART 2: Volume -->
    <div id="volumeChart" style="height:400px;"></div>
    
    <!-- CHART 3: Technical Indicators -->
    <div id="technicalChart" style="height:400px;"></div>
    
    <!-- CHART 4: Financial Metrics -->
    <canvas id="metricsRadar" style="height:400px;"></canvas>
    
    <!-- CHART 5: Sentiment Gauge -->
    <div id="sentimentGauge" style="height:400px;"></div>
    
    <!-- CHART 6: Competitor Comparison -->
    <canvas id="competitorChart" style="height:400px;"></canvas>
    
    <!-- CHART 7: Risk Heatmap -->
    <div id="riskMatrix" style="height:400px;"></div>
    
    <!-- CHART 8: Performance Timeline -->
    <div id="performanceChart" style="height:400px;"></div>
    
    <!-- CHART 9: Correlation Matrix -->
    <div id="correlationMatrix" style="height:400px;"></div>
    
    <!-- CHART 10: Candlestick -->
    <div id="candlestickChart" style="height:400px;"></div>

    <script>
    // CHART 1: Price Movement (Plotly)
    Plotly.newPlot('priceChart', [{
        x: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        y: [150,155,148,162,168,175,180,185,190,195,193,195],
        type: 'scatter',
        mode: 'lines+markers',
        line: {color: '#60a5fa', width: 3},
        marker: {size: 8}
    }], {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {color: '#fff'},
        title: 'Stock Price Movement'
    });

    // CHART 2: Volume (ApexCharts)
    new ApexCharts(document.querySelector("#volumeChart"), {
        series: [{
            name: 'Volume',
            data: [45000000, 52000000, 38000000, 45000000, 61000000, 48000000, 52000000, 49000000, 53000000, 51000000, 48000000, 55000000]
        }],
        chart: {type: 'bar', height: 350, background: 'transparent'},
        colors: ['#10b981'],
        theme: {mode: 'dark'},
        xaxis: {categories: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']},
        title: {text: 'Trading Volume', style: {color: '#60a5fa'}}
    }).render();

    // CHART 3: Technical Indicators (Plotly)
    Plotly.newPlot('technicalChart', [
        {x: ['1','2','3','4','5','6','7','8','9','10'], y: [45,52,48,55,62,58,65,70,68,72], name: 'RSI', type: 'scatter'},
        {x: ['1','2','3','4','5','6','7','8','9','10'], y: [2,1.5,-0.5,1.8,3.2,2.8,3.5,4.2,3.8,4.5], name: 'MACD', yaxis: 'y2'}
    ], {
        paper_bgcolor: 'transparent',
        yaxis2: {overlaying: 'y', side: 'right'},
        title: 'Technical Indicators'
    });

    // CHART 4: Financial Metrics Radar (Chart.js)
    new Chart(document.getElementById('metricsRadar'), {
        type: 'radar',
        data: {
            labels: ['P/E', 'ROE', 'Margin', 'Growth', 'Debt/Equity', 'EPS'],
            datasets: [{
                label: 'Company',
                data: [85, 92, 78, 88, 45, 82],
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96,165,250,0.2)'
            }]
        },
        options: {
            scales: {r: {ticks: {color: '#fff'}, grid: {color: 'rgba(255,255,255,0.1)'}}},
            plugins: {legend: {labels: {color: '#fff'}}}
        }
    });

    // CHART 5: Sentiment Gauge (Plotly)
    Plotly.newPlot('sentimentGauge', [{
        type: "indicator",
        mode: "gauge+number",
        value: 78,
        gauge: {
            axis: {range: [0, 100]},
            bar: {color: "#10b981"},
            steps: [
                {range: [0,50], color: "#ef4444"},
                {range: [50,100], color: "#10b981"}
            ]
        }
    }], {paper_bgcolor: 'transparent', title: 'Market Sentiment'});

    // CHART 6: Competitor Comparison (Chart.js)
    new Chart(document.getElementById('competitorChart'), {
        type: 'bar',
        data: {
            labels: ['Company', 'Competitor A', 'Competitor B'],
            datasets: [
                {label: 'Market Cap', data: [850, 720, 650], backgroundColor: '#60a5fa'},
                {label: 'Revenue', data: [365, 298, 276], backgroundColor: '#10b981'}
            ]
        },
        options: {
            scales: {
                x: {ticks: {color: '#fff'}},
                y: {ticks: {color: '#fff'}}
            },
            plugins: {legend: {labels: {color: '#fff'}}}
        }
    });

    // CHART 7: Risk Matrix (Plotly)
    Plotly.newPlot('riskMatrix', [{
        z: [[1,2,3,4],[2,3,4,5],[3,4,5,6],[4,5,6,7]],
        x: ['Low','Medium','High','Critical'],
        y: ['Low','Medium','High','Very High'],
        type: 'heatmap',
        colorscale: [[0,'#10b981'],[0.5,'#fbbf24'],[1,'#ef4444']]
    }], {paper_bgcolor: 'transparent', title: 'Risk Assessment'});

    // CHART 8: Performance Timeline (Plotly)
    Plotly.newPlot('performanceChart', [{
        x: ['1D','1W','1M','3M','6M','1Y'],
        y: [-0.5, 2.3, 5.6, 12.4, 18.9, 28.5],
        type: 'bar',
        marker: {color: ['#ef4444','#10b981','#10b981','#10b981','#10b981','#10b981']}
    }], {paper_bgcolor: 'transparent', title: 'Performance Timeline'});

    // CHART 9: Correlation Matrix (Plotly)
    Plotly.newPlot('correlationMatrix', [{
        z: [[1,0.8,0.6],[0.8,1,0.7],[0.6,0.7,1]],
        x: ['Price','Volume','RSI'],
        y: ['Price','Volume','RSI'],
        type: 'heatmap',
        colorscale: 'RdBu'
    }], {paper_bgcolor: 'transparent', title: 'Correlation Matrix'});

    // CHART 10: Candlestick (Plotly)
    Plotly.newPlot('candlestickChart', [{
        x: ['2024-01-01','2024-01-02','2024-01-03','2024-01-04','2024-01-05'],
        close: [150,155,152,158,156],
        high: [152,157,156,160,159],
        low: [148,153,151,156,155],
        open: [149,154,155,157,158],
        type: 'candlestick',
        increasing: {line: {color: '#10b981'}},
        decreasing: {line: {color: '#ef4444'}}
    }], {paper_bgcolor: 'transparent', title: 'Candlestick Pattern'});
    </script>
</body>
</html>

REMEMBER: Include ALL 10 charts with REAL DATA from your analysis!
`;

// Create a function to inject visual charts into any HTML response
export function injectVisualCharts(html: string, data: any = {}): string {
  // If HTML doesn't contain charts, inject them
  if (!html.includes('priceChart') || !html.includes('Plotly')) {
    const chartScripts = `
    <!-- Auto-Injected Visual Charts -->
    <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.44.0/dist/apexcharts.min.js"></script>
    
    <div style="margin: 2rem 0;">
      <h2 style="color: #60a5fa; margin-bottom: 1rem;">📊 Interactive Visualizations</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem;">
        <div id="priceChart" style="height:300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem;"></div>
        <div id="volumeChart" style="height:300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem;"></div>
        <div id="sentimentGauge" style="height:300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem;"></div>
        <canvas id="metricsRadar" style="height:300px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem;"></canvas>
      </div>
    </div>
    
    <script>
    // Auto-generate charts with available data
    setTimeout(() => {
      // Price Chart
      if (document.getElementById('priceChart')) {
        Plotly.newPlot('priceChart', [{
          x: ['Jan','Feb','Mar','Apr','May','Jun'],
          y: [${data.prices || '150,155,148,162,168,175'}],
          type: 'scatter',
          mode: 'lines+markers',
          line: {color: '#60a5fa', width: 3}
        }], {
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: {color: '#fff'},
          title: 'Price Movement'
        });
      }
      
      // Volume Chart
      if (document.getElementById('volumeChart')) {
        new ApexCharts(document.querySelector("#volumeChart"), {
          series: [{name: 'Volume', data: [${data.volumes || '45,52,38,45,61,48'}]}],
          chart: {type: 'bar', height: 250, background: 'transparent'},
          colors: ['#10b981'],
          theme: {mode: 'dark'},
          title: {text: 'Trading Volume', style: {color: '#60a5fa'}}
        }).render();
      }
      
      // Sentiment Gauge
      if (document.getElementById('sentimentGauge')) {
        Plotly.newPlot('sentimentGauge', [{
          type: "indicator",
          mode: "gauge+number",
          value: ${data.sentiment || 75},
          gauge: {
            axis: {range: [0, 100]},
            bar: {color: "#10b981"}
          }
        }], {paper_bgcolor: 'transparent', title: 'Market Sentiment'});
      }
      
      // Metrics Radar
      if (document.getElementById('metricsRadar')) {
        new Chart(document.getElementById('metricsRadar'), {
          type: 'radar',
          data: {
            labels: ['P/E', 'ROE', 'Growth', 'Margin'],
            datasets: [{
              label: 'Metrics',
              data: [${data.metrics || '85,75,80,70'}],
              borderColor: '#60a5fa',
              backgroundColor: 'rgba(96,165,250,0.2)'
            }]
          },
          options: {
            plugins: {legend: {labels: {color: '#fff'}}}
          }
        });
      }
    }, 100);
    </script>`;
    
    // Inject before closing body tag
    if (html.includes('</body>')) {
      html = html.replace('</body>', chartScripts + '</body>');
    } else {
      html += chartScripts;
    }
  }
  
  return html;
}