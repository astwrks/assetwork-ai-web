# Ultimate One-Shot Report Prompt

## The Problem
Claude has output token limits that prevent generating 2000+ line reports in one go. The solution is to use a more efficient prompt that generates comprehensive reports within the limits.

## Solution: Compressed Super-Detailed Prompt

Use this system prompt for maximum detail within token limits:

```
YOU ARE A FINANCIAL HTML REPORT GENERATOR. OUTPUT ONLY HTML.

CRITICAL RULES:
1. Start with <!DOCTYPE html>
2. NO text before HTML
3. NO questions or confirmations
4. Use compact HTML (minimize whitespace)
5. Include inline data (no placeholders)

OUTPUT THIS EXACT STRUCTURE:

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>[Company] Analysis</title>
<style>
body{background:#0a0e27;color:#fff;font-family:system-ui;margin:0;padding:20px}
.container{max-width:1400px;margin:0 auto}
.card{background:linear-gradient(135deg,#1a1f3a,#0f1629);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.metric{background:rgba(255,255,255,0.05);padding:16px;border-radius:8px}
.positive{color:#10b981}
.negative{color:#ef4444}
.chart{height:300px;background:rgba(255,255,255,0.02);border-radius:8px;margin:16px 0}
h1{font-size:2.5rem;margin:0}
h2{color:#60a5fa;border-bottom:2px solid #1e40af;padding-bottom:8px}
table{width:100%;border-collapse:collapse}
th,td{padding:12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.1)}
th{background:rgba(255,255,255,0.05)}
</style>
<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
<div class="container">

<!-- HEADER -->
<div class="card" style="background:linear-gradient(135deg,#3730a3,#1e3a8a)">
<h1>[COMPANY NAME]</h1>
<div style="display:flex;justify-content:space-between">
<div>
<div style="font-size:3rem;font-weight:bold">$[PRICE]</div>
<div class="[POS/NEG]">[CHANGE] ([CHANGE%])</div>
</div>
<div style="text-align:right">
<div>Market Cap: $[MCAP]B</div>
<div>Volume: [VOL]M</div>
<div>52W: $[LOW]-$[HIGH]</div>
</div>
</div>
</div>

<!-- EXECUTIVE SUMMARY -->
<div class="card">
<h2>Executive Summary</h2>
<p>Investment Rating: <strong>BUY</strong> | Target: $[TARGET] | Upside: [UP]%</p>
<div class="grid">
<div class="metric">
<div style="opacity:0.7">Revenue Growth</div>
<div style="font-size:1.5rem" class="positive">+[X]%</div>
</div>
<div class="metric">
<div style="opacity:0.7">Profit Margin</div>
<div style="font-size:1.5rem">[X]%</div>
</div>
<div class="metric">
<div style="opacity:0.7">ROE</div>
<div style="font-size:1.5rem">[X]%</div>
</div>
<div class="metric">
<div style="opacity:0.7">Debt/Equity</div>
<div style="font-size:1.5rem">[X]</div>
</div>
</div>
</div>

<!-- FINANCIAL METRICS -->
<div class="card">
<h2>Key Financial Metrics</h2>
<table>
<tr><th>Metric</th><th>Value</th><th>Industry Avg</th><th>Rating</th></tr>
<tr><td>P/E Ratio</td><td>[X]</td><td>[Y]</td><td class="positive">Good</td></tr>
<tr><td>PEG Ratio</td><td>[X]</td><td>[Y]</td><td>Fair</td></tr>
<tr><td>P/B Ratio</td><td>[X]</td><td>[Y]</td><td class="positive">Good</td></tr>
<tr><td>P/S Ratio</td><td>[X]</td><td>[Y]</td><td>Fair</td></tr>
<tr><td>EV/EBITDA</td><td>[X]</td><td>[Y]</td><td class="positive">Good</td></tr>
<tr><td>Current Ratio</td><td>[X]</td><td>[Y]</td><td class="positive">Strong</td></tr>
<tr><td>Quick Ratio</td><td>[X]</td><td>[Y]</td><td>Fair</td></tr>
<tr><td>Gross Margin</td><td>[X]%</td><td>[Y]%</td><td class="positive">Excellent</td></tr>
<tr><td>Operating Margin</td><td>[X]%</td><td>[Y]%</td><td class="positive">Strong</td></tr>
<tr><td>Net Margin</td><td>[X]%</td><td>[Y]%</td><td>Good</td></tr>
</table>
</div>

<!-- TECHNICAL ANALYSIS -->
<div class="card">
<h2>Technical Analysis</h2>
<div class="grid">
<div class="metric">
<div>RSI(14)</div>
<div style="font-size:2rem">[X]</div>
<div class="positive">Bullish</div>
</div>
<div class="metric">
<div>MACD</div>
<div style="font-size:2rem">[X]</div>
<div class="positive">Buy Signal</div>
</div>
<div class="metric">
<div>SMA 50</div>
<div style="font-size:2rem">$[X]</div>
<div>Support</div>
</div>
<div class="metric">
<div>SMA 200</div>
<div style="font-size:2rem">$[X]</div>
<div>Support</div>
</div>
</div>
<div class="chart" id="techChart"></div>
</div>

<!-- Add 10 more sections with similar structure -->
<!-- Sections: Fundamentals, Competitors, Historical, News, Risk, Analysts, Options, Insiders, ESG, Outlook -->

<!-- INVESTMENT RECOMMENDATION -->
<div class="card" style="background:linear-gradient(135deg,#059669,#10b981)">
<h2>Investment Recommendation</h2>
<div style="font-size:2rem;text-align:center;margin:20px 0">
<strong>STRONG BUY</strong>
</div>
<div class="grid">
<div class="metric">
<div>Entry Range</div>
<div>$[X]-$[Y]</div>
</div>
<div class="metric">
<div>Target Price</div>
<div>$[X]</div>
</div>
<div class="metric">
<div>Stop Loss</div>
<div>$[X]</div>
</div>
<div class="metric">
<div>Risk/Reward</div>
<div>1:[X]</div>
</div>
</div>
</div>

</div>
<script>
// Add interactive charts
Plotly.newPlot('techChart',[{x:[1,2,3,4,5],y:[190,192,195,193,195],type:'scatter',name:'Price'}],{paper_bgcolor:'transparent',plot_bgcolor:'transparent',font:{color:'#fff'}});
</script>
</body>
</html>
```

## Alternative: Multi-Part Generation

If you need even more detail, use this approach:

### Part 1 - Core Report
```
Generate HTML financial report for [Company]. Include sections 1-5:
1. Executive Summary with all key metrics
2. Complete Financial Dashboard
3. Technical Analysis with 20+ indicators  
4. Fundamental Analysis with all ratios
5. Competitive Analysis table

Start with <!DOCTYPE html> and include all CSS/scripts.
```

### Part 2 - Enhancement
```
Continue the report with sections 6-10:
6. Historical Performance charts
7. News & Sentiment analysis
8. Risk Assessment metrics
9. Analyst Coverage details
10. Options Activity data

Output only the HTML for these sections.
```

### Part 3 - Final Sections
```
Complete the report with sections 11-15:
11. Insider Trading activity
12. ESG Scores breakdown
13. Future Outlook projections
14. AI Predictions
15. Investment Recommendation

Close with </body></html>
```

## Best Practices

1. **Use compressed HTML** - Minimize whitespace
2. **Inline styles** - Reduces separate style blocks
3. **Data tables** - More efficient than individual cards
4. **Placeholder patterns** - Use [X] for values
5. **Reusable classes** - Define once, use many times

## Working Example Prompt

For immediate results, use this:

```
Generate a complete HTML stock analysis report. Start with <!DOCTYPE html>. Include: header with price data, executive summary, financial metrics table (15 rows), technical indicators grid, competitive comparison table, risk metrics, analyst ratings, and investment recommendation. Use dark theme with gradients. Include Plotly charts. Output only HTML, no explanations.
```

This approach works within token limits while still providing comprehensive reports!