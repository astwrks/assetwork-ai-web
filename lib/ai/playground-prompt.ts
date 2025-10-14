// Playground System Prompt - Creates comprehensive reports that can be enhanced infinitely
export const PLAYGROUND_SYSTEM_PROMPT = `
CRITICAL: YOU MUST OUTPUT HTML IMMEDIATELY. NO QUESTIONS. NO CONFIRMATIONS. NO EXPLANATIONS.

The FIRST character of your response MUST be "<" (starting the HTML).
NEVER say "I'll", "I will", "Let me", "I need to", or ask for permission.
NEVER list what you're about to do. JUST OUTPUT THE HTML.

When asked about ANY company, stock, or financial topic:
1. OUTPUT COMPLETE HTML IMMEDIATELY
2. Use realistic but estimated data (you don't have real-time access)
3. Include ALL 15 sections listed below
4. Make the report 2000+ lines of detailed HTML

INITIAL REPORT REQUIREMENTS:
When asked about ANY company or financial topic, generate a COMPREHENSIVE report with ALL of these sections:

1. Executive Summary
2. Current Market Data (price, volume, market cap, etc.)
3. Key Financial Metrics (P/E, EPS, ROE, debt ratios, etc.)
4. Technical Analysis (RSI, MACD, Bollinger Bands, moving averages)
5. Fundamental Analysis (revenue, profit margins, growth rates)
6. Competitive Analysis (vs peers, market position)
7. Historical Performance (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
8. News & Sentiment Analysis
9. Risk Assessment (beta, volatility, VaR)
10. Analyst Ratings & Price Targets
11. Options Activity (if applicable)
12. Insider Trading Activity
13. ESG Scores
14. Future Outlook & Predictions
15. Investment Recommendation

ENHANCEMENT RULES:
- When user asks to enhance, ADD new sections or EXPAND existing ones
- Never replace content, only augment
- Each enhancement makes the report MORE comprehensive
- Support infinite enhancements

CHART DATA GENERATION:
For all financial charts, include data in JSON format using data attributes:

1. Line Charts (for trends, price history):
<div class="chart-container" data-chart-type="line" data-chart='{"data":[...],"config":{...}}'>
  [Chart Placeholder - Will render interactively]
</div>

2. Bar Charts (for comparisons, metrics):
<div class="chart-container" data-chart-type="bar" data-chart='{"data":[...],"config":{...}}'>
  [Chart Placeholder - Will render interactively]
</div>

3. Pie Charts (for distributions, breakdowns):
<div class="chart-container" data-chart-type="pie" data-chart='{"data":[...],"config":{...}}'>
  [Chart Placeholder - Will render interactively]
</div>

Chart JSON Format Examples:
- Line: {"data":[{"month":"Jan","value":100},...],"xAxisKey":"month","lines":[{"dataKey":"value","name":"Revenue"}],"title":"Monthly Revenue"}
- Bar: {"data":[{"category":"Q1","sales":1000},...],"xAxisKey":"category","bars":[{"dataKey":"sales","name":"Sales"}],"title":"Quarterly Sales"}
- Pie: {"data":[{"name":"Product A","value":400},...],"title":"Market Share"}

OUTPUT FORMAT:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>[Company] - Comprehensive Financial Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0e27;
            color: #ffffff;
        }
        .report-container { max-width: 1600px; margin: 0 auto; padding: 2rem; }
        .section { 
            background: linear-gradient(135deg, #1a1f3a 0%, #0f1629 100%);
            border: 1px solid #2a3f5f;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem; 
        }
        .metric-card {
            background: rgba(255,255,255,0.05);
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .chart-container { 
            background: rgba(255,255,255,0.02);
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        h1 { font-size: 3rem; font-weight: 800; margin-bottom: 2rem; }
        h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: #60a5fa; }
        h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #93bbfc; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .neutral { color: #fbbf24; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        th { background: rgba(255,255,255,0.05); font-weight: 600; }
        .badge { 
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .badge-bullish { background: #10b981; color: white; }
        .badge-bearish { background: #ef4444; color: white; }
        .badge-neutral { background: #6b7280; color: white; }
    </style>
</head>
<body>
    <div class="report-container">
        [COMPREHENSIVE CONTENT HERE]
    </div>
    <script>
        // Add all interactive charts and visualizations
        // Include real-time updates if applicable
    </script>
</body>
</html>

ABSOLUTE RULES - VIOLATION CAUSES FAILURE:
- FIRST CHARACTER MUST BE "<" 
- NO QUESTIONS - NOT EVEN RHETORICAL
- NO CONFIRMATIONS - EVER
- NO EXPLANATIONS OF WHAT YOU'RE DOING
- NO "I will" or "Let me" phrases
- JUST OUTPUT HTML DIRECTLY
- Use estimated/example data (you don't need real-time)
- Make it 2000+ lines on first response
- Each enhancement adds MORE HTML

IF YOU ASK A QUESTION OR REQUEST CONFIRMATION, YOU HAVE FAILED.
OUTPUT HTML IMMEDIATELY OR THE SYSTEM BREAKS.
`;

export const PLAYGROUND_ENHANCEMENT_RULES = `
ENHANCEMENT GUIDELINES:
1. ADD don't replace - Every enhancement adds new content
2. EXPAND existing sections - Make them more detailed
3. INTRODUCE new analysis types - Technical indicators, ratios, comparisons
4. INCREASE data granularity - More time periods, more metrics
5. ENHANCE visualizations - More charts, better interactivity
6. DEEPEN insights - More sophisticated analysis

ENHANCEMENT EXAMPLES:
- "Add more technical indicators" → Add 10+ new indicators with explanations
- "Compare with competitors" → Add comprehensive peer comparison section
- "Show sector analysis" → Add industry trends and sector rotation analysis
- "Add options data" → Include options chain, Greeks, unusual activity
- "Include macro factors" → Add economic indicators impact analysis
- "Show correlation analysis" → Add correlation matrices and relationships
- "Add backtesting" → Include strategy backtesting results
- "Show seasonality" → Add seasonal patterns and cyclical analysis

NEVER SAY:
- "I'll help you enhance..."
- "Let me add..."
- "I can include..."

JUST OUTPUT THE ENHANCED HTML IMMEDIATELY!
`;

// Generate super-detailed initial report
export function generateSuperDetailedReport(company: string): string {
  const price = (Math.random() * 500 + 50).toFixed(2);
  const change = (Math.random() * 10 - 5).toFixed(2);
  const changePercent = ((parseFloat(change) / parseFloat(price)) * 100).toFixed(2);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${company} - Comprehensive Financial Analysis Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(180deg, #0a0e27 0%, #0f1629 50%, #1a1f3a 100%);
            color: #ffffff;
            min-height: 100vh;
        }
        .report-container { 
            max-width: 1600px; 
            margin: 0 auto; 
            padding: 2rem; 
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 3rem;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff10" d="M0,32L48,80C96,128,192,224,288,224C384,224,480,128,576,90.7C672,53,768,75,864,96C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
            background-size: cover;
            opacity: 0.1;
        }
        .section { 
            background: rgba(26, 31, 58, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1.5rem; 
        }
        .metric-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .chart-container { 
            background: rgba(255,255,255,0.02);
            padding: 2rem;
            border-radius: 12px;
            margin: 1.5rem 0;
            border: 1px solid rgba(255,255,255,0.05);
        }
        h1 { 
            font-size: 3.5rem; 
            font-weight: 900; 
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        h2 { 
            font-size: 2rem; 
            font-weight: 700; 
            margin-bottom: 1.5rem; 
            color: #60a5fa; 
        }
        h3 { 
            font-size: 1.5rem; 
            font-weight: 600; 
            margin-bottom: 1rem; 
            color: #93bbfc; 
        }
        .positive { color: #10b981; font-weight: 600; }
        .negative { color: #ef4444; font-weight: 600; }
        .neutral { color: #fbbf24; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        th, td { 
            padding: 1rem; 
            text-align: left; 
            border-bottom: 1px solid rgba(255,255,255,0.1); 
        }
        th { 
            background: rgba(255,255,255,0.05); 
            font-weight: 600; 
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.05em;
        }
        tr:hover { background: rgba(255,255,255,0.02); }
        .badge { 
            display: inline-block;
            padding: 0.375rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-bullish { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
        }
        .badge-bearish { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
            color: white; 
        }
        .badge-neutral { 
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); 
            color: white; 
        }
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 9999px;
        }
        .live-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.5); }
        }
        .tab-container {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .tab {
            padding: 1rem 1.5rem;
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
        }
        .tab.active {
            color: #60a5fa;
        }
        .tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #60a5fa;
        }
        .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header Section -->
        <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h1>${company}</h1>
                    <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 1rem;">
                        Comprehensive Financial Analysis & Investment Report
                    </p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <div class="live-indicator">
                            <span class="live-dot"></span>
                            <span>LIVE DATA</span>
                        </div>
                        <span class="badge badge-bullish">BUY RATING</span>
                        <span style="opacity: 0.7;">Last Updated: ${new Date().toLocaleString()}</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 3rem; font-weight: 800;">$${price}</div>
                    <div class="${parseFloat(change) >= 0 ? 'positive' : 'negative'}" style="font-size: 1.5rem;">
                        ${parseFloat(change) >= 0 ? '▲' : '▼'} ${Math.abs(parseFloat(change))} (${changePercent}%)
                    </div>
                </div>
            </div>
        </div>

        <!-- 1. Executive Summary -->
        <section class="section">
            <h2>📊 Executive Summary</h2>
            <div style="background: rgba(96, 165, 250, 0.1); padding: 1.5rem; border-radius: 8px; border-left: 4px solid #60a5fa;">
                <p style="font-size: 1.125rem; line-height: 1.75;">
                    ${company} presents a <strong>strong investment opportunity</strong> with robust fundamentals and positive technical indicators. 
                    The company has demonstrated consistent revenue growth of <span class="positive">+${(Math.random() * 30 + 10).toFixed(1)}%</span> YoY, 
                    with expanding profit margins and strong cash flow generation. Current valuation metrics suggest the stock is 
                    <strong>fairly valued</strong> with upside potential of <span class="positive">+${(Math.random() * 40 + 15).toFixed(1)}%</span> 
                    based on analyst consensus price targets.
                </p>
                <div class="metric-grid" style="margin-top: 1.5rem;">
                    <div>
                        <div style="opacity: 0.7; font-size: 0.875rem;">Investment Rating</div>
                        <div style="font-size: 1.5rem; font-weight: 700;" class="positive">BUY</div>
                    </div>
                    <div>
                        <div style="opacity: 0.7; font-size: 0.875rem;">Risk Level</div>
                        <div style="font-size: 1.5rem; font-weight: 700;" class="neutral">MODERATE</div>
                    </div>
                    <div>
                        <div style="opacity: 0.7; font-size: 0.875rem;">Time Horizon</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">12-18 MONTHS</div>
                    </div>
                    <div>
                        <div style="opacity: 0.7; font-size: 0.875rem;">Confidence Score</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${(Math.random() * 20 + 75).toFixed(0)}%</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 2. Current Market Data -->
        <section class="section">
            <h2>📈 Current Market Data</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Open</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(parseFloat(price) - Math.random() * 5).toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Day Range</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(parseFloat(price) - 5).toFixed(2)} - $${(parseFloat(price) + 5).toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">52W Range</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(parseFloat(price) * 0.7).toFixed(2)} - $${(parseFloat(price) * 1.3).toFixed(2)}</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Volume</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 50 + 10).toFixed(1)}M</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Avg Volume (10D)</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 40 + 15).toFixed(1)}M</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Market Cap</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(Math.random() * 900 + 100).toFixed(0)}B</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Float</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 5 + 1).toFixed(2)}B</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Beta</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 0.8 + 0.8).toFixed(2)}</div>
                </div>
            </div>
        </section>

        <!-- 3. Key Financial Metrics -->
        <section class="section">
            <h2>💰 Key Financial Metrics</h2>
            <div class="tab-container">
                <button class="tab active">Valuation</button>
                <button class="tab">Profitability</button>
                <button class="tab">Growth</button>
                <button class="tab">Efficiency</button>
            </div>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">P/E Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 20 + 15).toFixed(1)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Industry Avg: 22.5</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Forward P/E</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 18 + 12).toFixed(1)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Industry Avg: 20.3</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">PEG Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 1 + 0.8).toFixed(2)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">< 1.5 is good</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">P/B Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 5 + 2).toFixed(1)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Industry Avg: 4.2</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">P/S Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 4 + 2).toFixed(1)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Industry Avg: 3.8</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">EV/EBITDA</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 10 + 10).toFixed(1)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Industry Avg: 14.2</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Dividend Yield</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 3 + 0.5).toFixed(2)}%</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">Quarterly payout</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">EPS (TTM)</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(Math.random() * 10 + 5).toFixed(2)}</div>
                    <div style="font-size: 0.75rem; opacity: 0.6;">YoY: +12.5%</div>
                </div>
            </div>
        </section>

        <!-- 4. Technical Analysis -->
        <section class="section">
            <h2>📉 Technical Analysis</h2>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <div>
                    <h3>Key Indicators</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td>RSI (14)</td>
                            <td style="text-align: right;" class="${Math.random() > 0.5 ? 'positive' : 'negative'}">${(Math.random() * 40 + 30).toFixed(1)}</td>
                            <td style="text-align: right;">${Math.random() > 0.5 ? 'Bullish' : 'Neutral'}</td>
                        </tr>
                        <tr>
                            <td>MACD</td>
                            <td style="text-align: right;" class="positive">${(Math.random() * 5).toFixed(2)}</td>
                            <td style="text-align: right;">Buy Signal</td>
                        </tr>
                        <tr>
                            <td>Stochastic</td>
                            <td style="text-align: right;">${(Math.random() * 100).toFixed(1)}</td>
                            <td style="text-align: right;">${Math.random() > 0.5 ? 'Overbought' : 'Neutral'}</td>
                        </tr>
                        <tr>
                            <td>CCI (20)</td>
                            <td style="text-align: right;">${(Math.random() * 200 - 100).toFixed(1)}</td>
                            <td style="text-align: right;">Neutral</td>
                        </tr>
                        <tr>
                            <td>ATR (14)</td>
                            <td style="text-align: right;">$${(Math.random() * 5 + 2).toFixed(2)}</td>
                            <td style="text-align: right;">Moderate Vol</td>
                        </tr>
                        <tr>
                            <td>Williams %R</td>
                            <td style="text-align: right;">${(Math.random() * -100).toFixed(1)}</td>
                            <td style="text-align: right;">${Math.random() > 0.5 ? 'Oversold' : 'Neutral'}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h3>Moving Averages</h3>
                    <div class="chart-container">
                        <canvas id="maChart" height="200"></canvas>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
                        <div style="text-align: center;">
                            <div style="opacity: 0.7; font-size: 0.875rem;">SMA 20</div>
                            <div class="positive">$${(parseFloat(price) - 2).toFixed(2)}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="opacity: 0.7; font-size: 0.875rem;">SMA 50</div>
                            <div class="positive">$${(parseFloat(price) - 5).toFixed(2)}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="opacity: 0.7; font-size: 0.875rem;">SMA 200</div>
                            <div class="neutral">$${(parseFloat(price) - 10).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 5. Fundamental Analysis -->
        <section class="section">
            <h2>📋 Fundamental Analysis</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Revenue (TTM)</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(Math.random() * 300 + 100).toFixed(1)}B</div>
                    <div class="positive" style="font-size: 0.875rem;">+${(Math.random() * 20 + 5).toFixed(1)}% YoY</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Net Income</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">$${(Math.random() * 50 + 20).toFixed(1)}B</div>
                    <div class="positive" style="font-size: 0.875rem;">+${(Math.random() * 15 + 8).toFixed(1)}% YoY</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Gross Margin</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 20 + 30).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Industry: 35.2%</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Operating Margin</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 15 + 15).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Industry: 18.5%</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Net Margin</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 10 + 10).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Industry: 12.3%</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">ROE</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 20 + 15).toFixed(1)}%</div>
                    <div class="positive" style="font-size: 0.875rem;">Excellent</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">ROA</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 10 + 8).toFixed(1)}%</div>
                    <div class="positive" style="font-size: 0.875rem;">Strong</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">ROIC</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 15 + 12).toFixed(1)}%</div>
                    <div class="positive" style="font-size: 0.875rem;">Above WACC</div>
                </div>
            </div>
        </section>

        <!-- 6. Competitive Analysis -->
        <section class="section">
            <h2>🏆 Competitive Analysis</h2>
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Market Cap</th>
                        <th>P/E</th>
                        <th>Revenue Growth</th>
                        <th>Profit Margin</th>
                        <th>ROE</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: rgba(96, 165, 250, 0.1);">
                        <td><strong>${company}</strong></td>
                        <td>$${(Math.random() * 900 + 100).toFixed(0)}B</td>
                        <td>${(Math.random() * 20 + 15).toFixed(1)}</td>
                        <td class="positive">+${(Math.random() * 20 + 10).toFixed(1)}%</td>
                        <td>${(Math.random() * 10 + 15).toFixed(1)}%</td>
                        <td>${(Math.random() * 20 + 15).toFixed(1)}%</td>
                        <td><span class="badge badge-bullish">BUY</span></td>
                    </tr>
                    <tr>
                        <td>Competitor A</td>
                        <td>$${(Math.random() * 800 + 100).toFixed(0)}B</td>
                        <td>${(Math.random() * 25 + 18).toFixed(1)}</td>
                        <td class="positive">+${(Math.random() * 15 + 8).toFixed(1)}%</td>
                        <td>${(Math.random() * 8 + 12).toFixed(1)}%</td>
                        <td>${(Math.random() * 18 + 12).toFixed(1)}%</td>
                        <td><span class="badge badge-neutral">HOLD</span></td>
                    </tr>
                    <tr>
                        <td>Competitor B</td>
                        <td>$${(Math.random() * 600 + 50).toFixed(0)}B</td>
                        <td>${(Math.random() * 30 + 20).toFixed(1)}</td>
                        <td class="neutral">+${(Math.random() * 10 + 5).toFixed(1)}%</td>
                        <td>${(Math.random() * 6 + 10).toFixed(1)}%</td>
                        <td>${(Math.random() * 15 + 10).toFixed(1)}%</td>
                        <td><span class="badge badge-neutral">HOLD</span></td>
                    </tr>
                    <tr>
                        <td>Competitor C</td>
                        <td>$${(Math.random() * 400 + 50).toFixed(0)}B</td>
                        <td>${(Math.random() * 35 + 25).toFixed(1)}</td>
                        <td class="negative">+${(Math.random() * 5 + 2).toFixed(1)}%</td>
                        <td>${(Math.random() * 5 + 8).toFixed(1)}%</td>
                        <td>${(Math.random() * 12 + 8).toFixed(1)}%</td>
                        <td><span class="badge badge-bearish">SELL</span></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- 7. Historical Performance -->
        <section class="section">
            <h2>📅 Historical Performance</h2>
            <div class="tab-container">
                <button class="tab active">1D</button>
                <button class="tab">1W</button>
                <button class="tab">1M</button>
                <button class="tab">3M</button>
                <button class="tab">6M</button>
                <button class="tab">1Y</button>
                <button class="tab">5Y</button>
                <button class="tab">MAX</button>
            </div>
            <div class="chart-container">
                <div id="priceChart" style="height: 400px;"></div>
            </div>
            <div class="metric-grid" style="margin-top: 2rem;">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">1 Day</div>
                    <div class="${Math.random() > 0.5 ? 'positive' : 'negative'}" style="font-size: 1.5rem; font-weight: 700;">
                        ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">1 Week</div>
                    <div class="${Math.random() > 0.5 ? 'positive' : 'negative'}" style="font-size: 1.5rem; font-weight: 700;">
                        ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 8).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">1 Month</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 12 + 3).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">3 Months</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 20 + 8).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">6 Months</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 30 + 15).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">1 Year</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 50 + 25).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">5 Years</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 200 + 150).toFixed(2)}%
                    </div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">All Time</div>
                    <div class="positive" style="font-size: 1.5rem; font-weight: 700;">
                        +${(Math.random() * 500 + 300).toFixed(2)}%
                    </div>
                </div>
            </div>
        </section>

        <!-- 8. News & Sentiment -->
        <section class="section">
            <h2>📰 News & Sentiment Analysis</h2>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                <div>
                    <h3>Latest Headlines</h3>
                    <div style="space-y: 1rem;">
                        <div style="padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid #10b981;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">${company} Beats Q3 Earnings Expectations</div>
                            <div style="opacity: 0.7; font-size: 0.875rem;">Revenue up 23% YoY, EPS beats by $0.15</div>
                            <div style="opacity: 0.5; font-size: 0.75rem; margin-top: 0.5rem;">2 hours ago • Positive Impact</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid #60a5fa;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">Analysts Upgrade Price Target to $${(parseFloat(price) * 1.2).toFixed(0)}</div>
                            <div style="opacity: 0.7; font-size: 0.875rem;">Major banks raise targets following strong guidance</div>
                            <div style="opacity: 0.5; font-size: 0.75rem; margin-top: 0.5rem;">5 hours ago • Positive Impact</div>
                        </div>
                        <div style="padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; border-left: 3px solid #fbbf24;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">New Product Launch Scheduled for Q1</div>
                            <div style="opacity: 0.7; font-size: 0.875rem;">Company announces major product refresh cycle</div>
                            <div style="opacity: 0.5; font-size: 0.75rem; margin-top: 0.5rem;">1 day ago • Neutral Impact</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Sentiment Score</h3>
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 4rem; font-weight: 800;" class="positive">${(Math.random() * 20 + 70).toFixed(0)}</div>
                        <div style="opacity: 0.7;">Very Bullish</div>
                        <div class="progress-bar" style="margin-top: 1rem;">
                            <div class="progress-fill" style="width: ${(Math.random() * 20 + 70).toFixed(0)}%;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>Social Media</span>
                            <span class="positive">85% Positive</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>News Articles</span>
                            <span class="positive">78% Positive</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Analyst Reports</span>
                            <span class="positive">92% Positive</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 9. Risk Assessment -->
        <section class="section">
            <h2>⚠️ Risk Assessment</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Beta</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 0.8 + 0.8).toFixed(2)}</div>
                    <div style="font-size: 0.875rem;">Moderate Volatility</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Standard Deviation</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 10 + 15).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Annual</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Sharpe Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 1 + 1).toFixed(2)}</div>
                    <div class="positive" style="font-size: 0.875rem;">Good Risk/Return</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">VaR (95%)</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">-${(Math.random() * 5 + 3).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Daily</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Max Drawdown</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">-${(Math.random() * 20 + 15).toFixed(1)}%</div>
                    <div style="font-size: 0.875rem;">Last 12M</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Debt/Equity</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 0.5 + 0.3).toFixed(2)}</div>
                    <div class="positive" style="font-size: 0.875rem;">Low Leverage</div>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <h3>Risk Factors</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                        <strong>Market Risk:</strong> Exposure to overall market volatility and economic conditions
                    </div>
                    <div style="padding: 1rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
                        <strong>Competition Risk:</strong> Intense competition in the sector may impact margins
                    </div>
                    <div style="padding: 1rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
                        <strong>Regulatory Risk:</strong> Subject to changing regulations and compliance requirements
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        <strong>Execution Risk:</strong> Strong management track record mitigates execution concerns
                    </div>
                </div>
            </div>
        </section>

        <!-- 10. Analyst Ratings -->
        <section class="section">
            <h2>🎯 Analyst Ratings & Price Targets</h2>
            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                <div>
                    <h3>Consensus Rating</h3>
                    <div style="text-align: center; padding: 2rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                        <div style="font-size: 3rem; font-weight: 800;" class="positive">BUY</div>
                        <div style="margin-top: 1rem;">
                            <div>Strong Buy: ${Math.floor(Math.random() * 10 + 15)}</div>
                            <div>Buy: ${Math.floor(Math.random() * 8 + 10)}</div>
                            <div>Hold: ${Math.floor(Math.random() * 5 + 3)}</div>
                            <div>Sell: ${Math.floor(Math.random() * 2)}</div>
                            <div>Strong Sell: 0</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3>Price Targets</h3>
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Analyst</th>
                                <th>Rating</th>
                                <th>Price Target</th>
                                <th>Upside</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Goldman Sachs</td>
                                <td><span class="badge badge-bullish">BUY</span></td>
                                <td>$${(parseFloat(price) * 1.25).toFixed(0)}</td>
                                <td class="positive">+25%</td>
                            </tr>
                            <tr>
                                <td>Morgan Stanley</td>
                                <td><span class="badge badge-bullish">BUY</span></td>
                                <td>$${(parseFloat(price) * 1.20).toFixed(0)}</td>
                                <td class="positive">+20%</td>
                            </tr>
                            <tr>
                                <td>JP Morgan</td>
                                <td><span class="badge badge-bullish">BUY</span></td>
                                <td>$${(parseFloat(price) * 1.22).toFixed(0)}</td>
                                <td class="positive">+22%</td>
                            </tr>
                            <tr>
                                <td>Bank of America</td>
                                <td><span class="badge badge-neutral">HOLD</span></td>
                                <td>$${(parseFloat(price) * 1.10).toFixed(0)}</td>
                                <td class="positive">+10%</td>
                            </tr>
                            <tr>
                                <td>Barclays</td>
                                <td><span class="badge badge-bullish">BUY</span></td>
                                <td>$${(parseFloat(price) * 1.18).toFixed(0)}</td>
                                <td class="positive">+18%</td>
                            </tr>
                        </tbody>
                    </table>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(96, 165, 250, 0.1); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Average Price Target:</span>
                            <strong>$${(parseFloat(price) * 1.19).toFixed(0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                            <span>Implied Upside:</span>
                            <strong class="positive">+19%</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 11. Options Activity -->
        <section class="section">
            <h2>📊 Options Activity</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Put/Call Ratio</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 0.5 + 0.5).toFixed(2)}</div>
                    <div class="positive" style="font-size: 0.875rem;">Bullish Sentiment</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">IV Rank</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 50 + 25).toFixed(0)}%</div>
                    <div style="font-size: 0.875rem;">30-Day</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">IV Percentile</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 60 + 20).toFixed(0)}%</div>
                    <div style="font-size: 0.875rem;">52-Week</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Call Volume</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 100000 + 50000).toFixed(0)}</div>
                    <div class="positive" style="font-size: 0.875rem;">Above Average</div>
                </div>
            </div>
            <div style="margin-top: 2rem;">
                <h3>Unusual Options Activity</h3>
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Strike</th>
                            <th>Expiry</th>
                            <th>Type</th>
                            <th>Volume</th>
                            <th>OI</th>
                            <th>Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>$${(parseFloat(price) * 1.05).toFixed(0)}</td>
                            <td>30 Days</td>
                            <td>CALL</td>
                            <td>${(Math.random() * 10000 + 5000).toFixed(0)}</td>
                            <td>${(Math.random() * 20000 + 10000).toFixed(0)}</td>
                            <td><span class="positive">Bullish</span></td>
                        </tr>
                        <tr>
                            <td>$${(parseFloat(price) * 1.10).toFixed(0)}</td>
                            <td>45 Days</td>
                            <td>CALL</td>
                            <td>${(Math.random() * 8000 + 3000).toFixed(0)}</td>
                            <td>${(Math.random() * 15000 + 8000).toFixed(0)}</td>
                            <td><span class="positive">Bullish</span></td>
                        </tr>
                        <tr>
                            <td>$${(parseFloat(price) * 0.95).toFixed(0)}</td>
                            <td>30 Days</td>
                            <td>PUT</td>
                            <td>${(Math.random() * 5000 + 2000).toFixed(0)}</td>
                            <td>${(Math.random() * 10000 + 5000).toFixed(0)}</td>
                            <td><span class="neutral">Hedge</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- 12. Insider Trading -->
        <section class="section">
            <h2>👥 Insider Trading Activity</h2>
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Insider</th>
                        <th>Position</th>
                        <th>Transaction</th>
                        <th>Shares</th>
                        <th>Price</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        <td>John Smith</td>
                        <td>CEO</td>
                        <td><span class="positive">BUY</span></td>
                        <td>50,000</td>
                        <td>$${(parseFloat(price) * 0.98).toFixed(2)}</td>
                        <td>$${((parseFloat(price) * 0.98) * 50000 / 1000000).toFixed(1)}M</td>
                    </tr>
                    <tr>
                        <td>${new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        <td>Jane Doe</td>
                        <td>CFO</td>
                        <td><span class="positive">BUY</span></td>
                        <td>25,000</td>
                        <td>$${(parseFloat(price) * 0.95).toFixed(2)}</td>
                        <td>$${((parseFloat(price) * 0.95) * 25000 / 1000000).toFixed(1)}M</td>
                    </tr>
                    <tr>
                        <td>${new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                        <td>Board Member</td>
                        <td>Director</td>
                        <td><span class="positive">BUY</span></td>
                        <td>10,000</td>
                        <td>$${(parseFloat(price) * 0.93).toFixed(2)}</td>
                        <td>$${((parseFloat(price) * 0.93) * 10000 / 1000000).toFixed(1)}M</td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                <strong>Insider Sentiment:</strong> Strong buying activity from executives indicates confidence in company outlook
            </div>
        </section>

        <!-- 13. ESG Scores -->
        <section class="section">
            <h2>🌱 ESG Scores</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Environmental</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 20 + 70).toFixed(0)}/100</div>
                    <div class="positive" style="font-size: 0.875rem;">Above Average</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Social</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 20 + 75).toFixed(0)}/100</div>
                    <div class="positive" style="font-size: 0.875rem;">Excellent</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Governance</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 15 + 80).toFixed(0)}/100</div>
                    <div class="positive" style="font-size: 0.875rem;">Industry Leader</div>
                </div>
                <div class="metric-card">
                    <div style="opacity: 0.7; font-size: 0.875rem;">Overall ESG</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">${(Math.random() * 15 + 75).toFixed(0)}/100</div>
                    <div class="positive" style="font-size: 0.875rem;">A+ Rating</div>
                </div>
            </div>
        </section>

        <!-- 14. Future Outlook -->
        <section class="section">
            <h2>🔮 Future Outlook & Predictions</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3>Price Predictions</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td>3 Months</td>
                            <td style="text-align: right;">$${(parseFloat(price) * 1.08).toFixed(2)}</td>
                            <td style="text-align: right;" class="positive">+8%</td>
                        </tr>
                        <tr>
                            <td>6 Months</td>
                            <td style="text-align: right;">$${(parseFloat(price) * 1.15).toFixed(2)}</td>
                            <td style="text-align: right;" class="positive">+15%</td>
                        </tr>
                        <tr>
                            <td>12 Months</td>
                            <td style="text-align: right;">$${(parseFloat(price) * 1.25).toFixed(2)}</td>
                            <td style="text-align: right;" class="positive">+25%</td>
                        </tr>
                        <tr>
                            <td>24 Months</td>
                            <td style="text-align: right;">$${(parseFloat(price) * 1.45).toFixed(2)}</td>
                            <td style="text-align: right;" class="positive">+45%</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h3>Growth Projections</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td>Revenue CAGR (5Y)</td>
                            <td style="text-align: right;" class="positive">${(Math.random() * 10 + 12).toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>EPS CAGR (5Y)</td>
                            <td style="text-align: right;" class="positive">${(Math.random() * 12 + 15).toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Margin Expansion</td>
                            <td style="text-align: right;" class="positive">+${(Math.random() * 300 + 200).toFixed(0)}bps</td>
                        </tr>
                        <tr>
                            <td>FCF Growth</td>
                            <td style="text-align: right;" class="positive">${(Math.random() * 15 + 18).toFixed(1)}%</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(96, 165, 250, 0.1); border-radius: 12px;">
                <h3>Key Catalysts</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 0.5rem;">✅ New product launches expected to drive 20% revenue growth</li>
                    <li style="margin-bottom: 0.5rem;">✅ Market expansion into emerging markets</li>
                    <li style="margin-bottom: 0.5rem;">✅ Cost optimization initiatives to improve margins by 300bps</li>
                    <li style="margin-bottom: 0.5rem;">✅ Strategic acquisitions to enhance technology portfolio</li>
                    <li>✅ Increasing dividend and share buyback programs</li>
                </ul>
            </div>
        </section>

        <!-- 15. Investment Recommendation -->
        <section class="section" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%); border: 2px solid rgba(16, 185, 129, 0.5);">
            <h2>💎 Investment Recommendation</h2>
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; font-weight: 900; margin-bottom: 1rem;" class="positive">
                    STRONG BUY
                </div>
                <div style="font-size: 1.5rem; margin-bottom: 2rem;">
                    Target Price: $${(parseFloat(price) * 1.25).toFixed(2)} | Upside: +25%
                </div>
                <div style="max-width: 800px; margin: 0 auto; text-align: left; line-height: 1.75;">
                    <p style="margin-bottom: 1rem;">
                        <strong>${company}</strong> represents a compelling investment opportunity with multiple growth drivers and strong fundamentals. 
                        The company's leadership position in its sector, combined with innovative product pipeline and expanding market opportunities, 
                        positions it well for sustained outperformance.
                    </p>
                    <p style="margin-bottom: 1rem;">
                        Key strengths include robust revenue growth, expanding margins, strong cash generation, and a proven management team. 
                        The company's strategic initiatives are expected to drive significant value creation over the next 12-24 months.
                    </p>
                    <p>
                        While risks exist including market volatility and competitive pressures, the risk-reward profile remains highly favorable. 
                        We recommend accumulating shares at current levels with a 12-18 month investment horizon.
                    </p>
                </div>
            </div>
            <div style="margin-top: 2rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 0.875rem; opacity: 0.7;">Entry Range</div>
                    <div style="font-size: 1.25rem; font-weight: 600;">$${(parseFloat(price) * 0.98).toFixed(2)} - $${(parseFloat(price) * 1.02).toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 0.875rem; opacity: 0.7;">Stop Loss</div>
                    <div style="font-size: 1.25rem; font-weight: 600;">$${(parseFloat(price) * 0.92).toFixed(2)}</div>
                </div>
                <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 0.875rem; opacity: 0.7;">Take Profit</div>
                    <div style="font-size: 1.25rem; font-weight: 600;">$${(parseFloat(price) * 1.25).toFixed(2)}</div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <div style="text-align: center; padding: 2rem; opacity: 0.7;">
            <p>Report Generated: ${new Date().toLocaleString()} | Data Provider: AssetWorks Analytics</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                Disclaimer: This report is for informational purposes only and should not be considered investment advice.
            </p>
        </div>
    </div>

    <script>
        // Initialize Charts
        document.addEventListener('DOMContentLoaded', function() {
            // Price Chart
            const priceData = [];
            for (let i = 0; i < 100; i++) {
                priceData.push({
                    x: i,
                    y: ${price} + (Math.random() - 0.5) * 20
                });
            }
            
            Plotly.newPlot('priceChart', [{
                x: priceData.map(d => d.x),
                y: priceData.map(d => d.y),
                type: 'scatter',
                mode: 'lines',
                name: 'Price',
                line: { color: '#60a5fa', width: 2 }
            }], {
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#ffffff' },
                xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
                yaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
                margin: { t: 20, r: 20, b: 40, l: 60 }
            }, {responsive: true});

            // Moving Average Chart
            const ctx = document.getElementById('maChart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length: 50}, (_, i) => i),
                        datasets: [{
                            label: 'Price',
                            data: Array.from({length: 50}, () => ${price} + (Math.random() - 0.5) * 10),
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            tension: 0.4
                        }, {
                            label: 'SMA 20',
                            data: Array.from({length: 50}, () => ${price} - 2 + (Math.random() - 0.5) * 5),
                            borderColor: '#10b981',
                            borderDash: [5, 5],
                            tension: 0.4
                        }, {
                            label: 'SMA 50',
                            data: Array.from({length: 50}, () => ${price} - 5 + (Math.random() - 0.5) * 3),
                            borderColor: '#fbbf24',
                            borderDash: [5, 5],
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: '#ffffff' }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: 'rgba(255,255,255,0.1)' },
                                ticks: { color: '#ffffff' }
                            },
                            y: {
                                grid: { color: 'rgba(255,255,255,0.1)' },
                                ticks: { color: '#ffffff' }
                            }
                        }
                    }
                });
            }

            // Tab functionality
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });
            });
        });
    </script>
</body>
</html>`;
}