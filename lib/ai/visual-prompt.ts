// Visual Prompt - Ensures charts are generated in reports
export const VISUAL_GENERATION_PROMPT = `
You MUST include interactive charts in your HTML report. 

CRITICAL: Every report MUST contain these 10 visualizations:

1. PRICE CHART (Plotly):
<div id="priceChart" style="height:400px;"></div>
<script>
const priceData = [{
  x: ['Jan','Feb','Mar','Apr','May','Jun'],
  y: [150,155,148,162,168,175],
  type: 'scatter',
  mode: 'lines+markers',
  line: {color: '#60a5fa', width: 3}
}];
Plotly.newPlot('priceChart', priceData, {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {color: '#fff'}
});
</script>

2. VOLUME CHART (ApexCharts):
<div id="volumeChart"></div>
<script>
new ApexCharts(document.querySelector("#volumeChart"), {
  series: [{name: 'Volume', data: [45,52,38,45,19,23]}],
  chart: {type: 'bar', height: 350, background: 'transparent'},
  colors: ['#60a5fa'],
  theme: {mode: 'dark'}
}).render();
</script>

3. TECHNICAL INDICATORS (Plotly):
<div id="technicalChart" style="height:400px;"></div>
<script>
Plotly.newPlot('technicalChart', [
  {x: ['1','2','3','4','5'], y: [45,55,50,60,58], name: 'RSI'},
  {x: ['1','2','3','4','5'], y: [2,3,1,4,3], name: 'MACD', yaxis: 'y2'}
], {
  yaxis2: {overlaying: 'y', side: 'right'},
  paper_bgcolor: 'transparent'
});
</script>

4. FINANCIAL METRICS RADAR (Chart.js):
<canvas id="metricsRadar" height="300"></canvas>
<script>
new Chart(document.getElementById('metricsRadar'), {
  type: 'radar',
  data: {
    labels: ['P/E', 'ROE', 'Margin', 'Growth', 'Debt'],
    datasets: [{
      label: 'Company',
      data: [75, 85, 70, 80, 40],
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96,165,250,0.2)'
    }]
  },
  options: {
    scales: {r: {ticks: {color: '#fff'}}}
  }
});
</script>

5. SENTIMENT GAUGE (Plotly):
<div id="sentimentGauge" style="height:300px;"></div>
<script>
Plotly.newPlot('sentimentGauge', [{
  type: "indicator",
  mode: "gauge+number",
  value: 75,
  gauge: {
    axis: {range: [0, 100]},
    bar: {color: "#60a5fa"},
    steps: [
      {range: [0,50], color: "#ef4444"},
      {range: [50,100], color: "#10b981"}
    ]
  }
}], {paper_bgcolor: 'transparent'});
</script>

6. COMPETITOR COMPARISON (Chart.js):
<canvas id="competitorChart" height="300"></canvas>
<script>
new Chart(document.getElementById('competitorChart'), {
  type: 'bar',
  data: {
    labels: ['Company', 'Comp A', 'Comp B'],
    datasets: [
      {label: 'Market Cap', data: [850, 720, 650], backgroundColor: '#60a5fa'},
      {label: 'Revenue', data: [365, 298, 276], backgroundColor: '#10b981'}
    ]
  }
});
</script>

7. RISK HEATMAP (Plotly):
<div id="riskMatrix" style="height:400px;"></div>
<script>
Plotly.newPlot('riskMatrix', [{
  z: [[1,2,3],[2,3,4],[3,4,5]],
  type: 'heatmap',
  colorscale: [[0,'#10b981'],[0.5,'#fbbf24'],[1,'#ef4444']]
}], {paper_bgcolor: 'transparent'});
</script>

8. PERFORMANCE TIMELINE (Plotly):
<div id="performanceChart" style="height:300px;"></div>
<script>
Plotly.newPlot('performanceChart', [{
  x: ['1D','1W','1M','3M','6M','1Y'],
  y: [-0.5, 2.3, 5.6, 12.4, 18.9, 28.5],
  type: 'bar',
  marker: {color: ['#ef4444','#10b981','#10b981','#10b981','#10b981','#10b981']}
}], {paper_bgcolor: 'transparent'});
</script>

9. CORRELATION MATRIX (Plotly):
<div id="correlationMatrix" style="height:400px;"></div>
<script>
Plotly.newPlot('correlationMatrix', [{
  z: [[1,0.8,0.6],[0.8,1,0.7],[0.6,0.7,1]],
  x: ['Price','Volume','RSI'],
  y: ['Price','Volume','RSI'],
  type: 'heatmap',
  colorscale: 'RdBu'
}], {paper_bgcolor: 'transparent'});
</script>

10. CANDLESTICK CHART (Plotly):
<div id="candlestickChart" style="height:400px;"></div>
<script>
Plotly.newPlot('candlestickChart', [{
  x: ['2024-01-01','2024-01-02','2024-01-03'],
  close: [150,155,152],
  high: [152,157,156],
  low: [148,153,151],
  open: [149,154,155],
  type: 'candlestick'
}], {paper_bgcolor: 'transparent'});
</script>

IMPORTANT: Include ALL 10 charts with real data!
`;