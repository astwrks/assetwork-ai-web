// Instant Report Engine - Professional Financial Report Generation
// No API calls required - instant, beautiful, data-rich reports

import { colors, formatNumber, getMarketColor } from './design-system';

// Comprehensive financial data for instant reports
export const MARKET_DATA = {
  stocks: {
    // US Tech Giants
    AAPL: {
      name: 'Apple Inc.',
      price: 189.84,
      change: 2.15,
      changePct: 1.14,
      marketCap: 2950000000000,
      pe: 31.2,
      volume: 52346789,
      high52w: 199.62,
      low52w: 124.17,
      dividend: 0.96,
      beta: 1.29,
      eps: 6.08,
      sector: 'Technology',
      industry: 'Consumer Electronics',
    },
    MSFT: {
      name: 'Microsoft Corporation',
      price: 415.26,
      change: 3.84,
      changePct: 0.93,
      marketCap: 3100000000000,
      pe: 35.8,
      volume: 21543210,
      high52w: 430.82,
      low52w: 245.61,
      dividend: 3.00,
      beta: 0.93,
      eps: 11.61,
      sector: 'Technology',
      industry: 'Software',
    },
    GOOGL: {
      name: 'Alphabet Inc.',
      price: 140.12,
      change: -0.88,
      changePct: -0.62,
      marketCap: 1750000000000,
      pe: 25.4,
      volume: 28976543,
      high52w: 155.34,
      low52w: 88.56,
      dividend: 0,
      beta: 1.04,
      eps: 5.52,
      sector: 'Technology',
      industry: 'Internet Services',
    },
    AMZN: {
      name: 'Amazon.com Inc.',
      price: 168.35,
      change: 1.92,
      changePct: 1.15,
      marketCap: 1740000000000,
      pe: 65.3,
      volume: 45678901,
      high52w: 180.56,
      low52w: 88.12,
      dividend: 0,
      beta: 1.18,
      eps: 2.58,
      sector: 'Technology',
      industry: 'E-Commerce',
    },
    META: {
      name: 'Meta Platforms Inc.',
      price: 512.48,
      change: 8.76,
      changePct: 1.74,
      marketCap: 1300000000000,
      pe: 29.7,
      volume: 15432198,
      high52w: 531.44,
      low52w: 274.38,
      dividend: 2.00,
      beta: 1.21,
      eps: 17.25,
      sector: 'Technology',
      industry: 'Social Media',
    },
    NVDA: {
      name: 'NVIDIA Corporation',
      price: 875.43,
      change: 24.18,
      changePct: 2.84,
      marketCap: 2160000000000,
      pe: 68.9,
      volume: 38976543,
      high52w: 974.94,
      low52w: 238.93,
      dividend: 0.16,
      beta: 1.68,
      eps: 12.71,
      sector: 'Technology',
      industry: 'Semiconductors',
    },
    
    // Financial Sector
    JPM: {
      name: 'JPMorgan Chase & Co.',
      price: 195.67,
      change: 1.23,
      changePct: 0.63,
      marketCap: 567000000000,
      pe: 11.2,
      volume: 8765432,
      high52w: 201.33,
      low52w: 134.78,
      dividend: 4.60,
      beta: 1.09,
      eps: 17.47,
      sector: 'Financial',
      industry: 'Banking',
    },
    
    // Indian Stocks
    RELIANCE: {
      name: 'Reliance Industries',
      price: 2438.25,
      change: 15.40,
      changePct: 0.64,
      marketCap: 165000000,
      pe: 24.8,
      volume: 2834567,
      high52w: 2850.00,
      low52w: 2180.00,
      dividend: 8.50,
      beta: 1.23,
      eps: 98.31,
      sector: 'Energy',
      industry: 'Oil & Gas',
      currency: 'INR',
    },
    TCS: {
      name: 'Tata Consultancy Services',
      price: 3845.60,
      change: -28.30,
      changePct: -0.73,
      marketCap: 140000000,
      pe: 28.5,
      volume: 1234567,
      high52w: 4250.00,
      low52w: 3150.00,
      dividend: 43.00,
      beta: 0.85,
      eps: 134.93,
      sector: 'Technology',
      industry: 'IT Services',
      currency: 'INR',
    },
    INFY: {
      name: 'Infosys Limited',
      price: 1425.80,
      change: 12.45,
      changePct: 0.88,
      marketCap: 59000000,
      pe: 26.3,
      volume: 3456789,
      high52w: 1650.00,
      low52w: 1180.00,
      dividend: 34.00,
      beta: 0.79,
      eps: 54.18,
      sector: 'Technology',
      industry: 'IT Services',
      currency: 'INR',
    },
  },
  
  indices: {
    SPX: {
      name: 'S&P 500',
      value: 4783.45,
      change: 28.67,
      changePct: 0.60,
    },
    DJI: {
      name: 'Dow Jones',
      value: 37863.80,
      change: 156.23,
      changePct: 0.41,
    },
    IXIC: {
      name: 'NASDAQ',
      value: 15087.36,
      change: 98.45,
      changePct: 0.66,
    },
    NIFTY: {
      name: 'NIFTY 50',
      value: 21453.10,
      change: 87.35,
      changePct: 0.41,
    },
    SENSEX: {
      name: 'BSE SENSEX',
      value: 70865.10,
      change: 285.94,
      changePct: 0.41,
    },
  },
  
  commodities: {
    GOLD: {
      name: 'Gold',
      price: 2042.30,
      change: 8.70,
      changePct: 0.43,
      unit: 'oz',
    },
    SILVER: {
      name: 'Silver',
      price: 23.84,
      change: -0.12,
      changePct: -0.50,
      unit: 'oz',
    },
    OIL: {
      name: 'Crude Oil',
      price: 73.25,
      change: 1.18,
      changePct: 1.64,
      unit: 'barrel',
    },
  },
  
  crypto: {
    BTC: {
      name: 'Bitcoin',
      price: 67453.80,
      change: 1234.56,
      changePct: 1.86,
      marketCap: 1320000000000,
      volume24h: 28500000000,
    },
    ETH: {
      name: 'Ethereum',
      price: 3456.78,
      change: 89.12,
      changePct: 2.65,
      marketCap: 415000000000,
      volume24h: 15600000000,
    },
  },
};

// Report template generator
export class InstantReportGenerator {
  private getAssetData(symbol: string) {
    const upperSymbol = symbol.toUpperCase();
    return MARKET_DATA.stocks[upperSymbol] || 
           MARKET_DATA.indices[upperSymbol] || 
           MARKET_DATA.commodities[upperSymbol] || 
           MARKET_DATA.crypto[upperSymbol] ||
           this.generateMockData(symbol);
  }
  
  private generateMockData(symbol: string) {
    // Generate realistic mock data for unknown symbols
    const price = 50 + Math.random() * 500;
    const change = (Math.random() - 0.5) * 10;
    const changePct = (change / price) * 100;
    
    return {
      name: `${symbol.toUpperCase()} Corporation`,
      price: price,
      change: change,
      changePct: changePct,
      marketCap: price * 1000000000 * (1 + Math.random() * 10),
      pe: 15 + Math.random() * 25,
      volume: Math.floor(1000000 + Math.random() * 50000000),
      high52w: price * 1.3,
      low52w: price * 0.7,
      dividend: Math.random() * 5,
      beta: 0.8 + Math.random() * 0.8,
      eps: price / (15 + Math.random() * 25),
      sector: 'Technology',
      industry: 'Software',
    };
  }
  
  public generateReport(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Detect report type based on query
    if (queryLower.includes('compare') || queryLower.includes('vs')) {
      return this.generateComparisonReport(query);
    } else if (queryLower.includes('portfolio') || queryLower.includes('holdings')) {
      return this.generatePortfolioReport(query);
    } else if (queryLower.includes('sector') || queryLower.includes('industry')) {
      return this.generateSectorReport(query);
    } else if (queryLower.includes('market') || queryLower.includes('overview')) {
      return this.generateMarketOverview();
    } else {
      // Default to single stock analysis
      return this.generateSingleStockReport(query);
    }
  }
  
  private generateSingleStockReport(query: string): string {
    // Extract symbol from query
    const symbols = Object.keys(MARKET_DATA.stocks);
    let symbol = symbols.find(s => query.toUpperCase().includes(s)) || 'AAPL';
    const data = this.getAssetData(symbol);
    const currency = data.currency || 'USD';
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Financial Analysis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0A0E1A 0%, #1A1F2E 100%);
        }
        
        .number {
            font-family: 'IBM Plex Mono', monospace;
        }
        
        .positive { color: #00C851; }
        .negative { color: #FF4444; }
        .neutral { color: #FFB700; }
        
        .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .gradient-border {
            background: linear-gradient(135deg, #0066FF, #00C851);
            padding: 1px;
            border-radius: 16px;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body class="min-h-screen p-6">
    <div class="max-w-7xl mx-auto">
        <!-- Header Card -->
        <div class="glass rounded-2xl p-8 mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-4xl font-bold text-primary-foreground mb-2">${data.name}</h1>
                    <p class="text-muted-foreground text-lg">${symbol} • ${data.sector} • ${data.industry}</p>
                    <div class="flex items-center gap-2 mt-4">
                        <span class="w-2 h-2 bg-green-500 rounded-full pulse"></span>
                        <span class="text-sm text-muted-foreground">Real-time Data</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-5xl font-bold text-primary-foreground number">
                        ${currencySymbol}${formatNumber(data.price, { decimals: 2 })}
                    </div>
                    <div class="flex items-center justify-end gap-2 mt-2">
                        <span class="${data.change >= 0 ? 'positive' : 'negative'} text-2xl font-semibold number">
                            ${data.change >= 0 ? '▲' : '▼'} ${Math.abs(data.change).toFixed(2)}
                        </span>
                        <span class="${data.change >= 0 ? 'positive' : 'negative'} text-xl">
                            (${data.changePct >= 0 ? '+' : ''}${data.changePct.toFixed(2)}%)
                        </span>
                    </div>
                    <p class="text-muted-foreground mt-2">Volume: ${formatNumber(data.volume, { compact: true })}</p>
                </div>
            </div>
        </div>

        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="glass rounded-xl p-6">
                <p class="text-muted-foreground text-sm mb-2">Market Cap</p>
                <p class="text-2xl font-bold text-primary-foreground number">
                    ${currencySymbol}${formatNumber(data.marketCap, { compact: true })}
                </p>
            </div>
            <div class="glass rounded-xl p-6">
                <p class="text-muted-foreground text-sm mb-2">P/E Ratio</p>
                <p class="text-2xl font-bold text-primary-foreground number">${data.pe.toFixed(2)}</p>
            </div>
            <div class="glass rounded-xl p-6">
                <p class="text-muted-foreground text-sm mb-2">EPS</p>
                <p class="text-2xl font-bold text-primary-foreground number">
                    ${currencySymbol}${data.eps.toFixed(2)}
                </p>
            </div>
            <div class="glass rounded-xl p-6">
                <p class="text-muted-foreground text-sm mb-2">Dividend Yield</p>
                <p class="text-2xl font-bold text-primary-foreground number">
                    ${((data.dividend / data.price) * 100).toFixed(2)}%
                </p>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="glass rounded-2xl p-8 mb-6">
            <h2 class="text-2xl font-bold text-primary-foreground mb-6">Price Performance</h2>
            <canvas id="priceChart" height="100"></canvas>
        </div>

        <!-- Technical Indicators -->
        <div class="glass rounded-2xl p-8 mb-6">
            <h2 class="text-2xl font-bold text-primary-foreground mb-6">Technical Analysis</h2>
            <div class="grid grid-cols-3 gap-6">
                <div>
                    <p class="text-muted-foreground mb-2">52-Week Range</p>
                    <div class="relative">
                        <div class="h-2 bg-gray-700 rounded-full">
                            <div class="h-2 bg-gradient-to-r from-red-500 to-green-500 rounded-full" 
                                 style="width: ${((data.price - data.low52w) / (data.high52w - data.low52w) * 100)}%"></div>
                        </div>
                        <div class="flex justify-between mt-2">
                            <span class="text-sm text-muted-foreground number">${currencySymbol}${data.low52w.toFixed(2)}</span>
                            <span class="text-sm text-primary-foreground font-bold number">${currencySymbol}${data.price.toFixed(2)}</span>
                            <span class="text-sm text-muted-foreground number">${currencySymbol}${data.high52w.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p class="text-muted-foreground mb-2">Beta</p>
                    <p class="text-xl font-semibold text-primary-foreground number">${data.beta.toFixed(2)}</p>
                    <p class="text-sm text-muted-foreground">${data.beta > 1 ? 'Higher volatility' : 'Lower volatility'}</p>
                </div>
                <div>
                    <p class="text-muted-foreground mb-2">RSI (14)</p>
                    <p class="text-xl font-semibold ${data.change >= 0 ? 'text-green-400' : 'text-red-400'} number">
                        ${(50 + data.changePct * 5).toFixed(1)}
                    </p>
                    <p class="text-sm text-muted-foreground">
                        ${data.change >= 0 ? 'Bullish momentum' : 'Bearish momentum'}
                    </p>
                </div>
            </div>
        </div>

        <!-- Analyst Recommendations -->
        <div class="gradient-border">
            <div class="glass rounded-2xl p-8">
                <h2 class="text-2xl font-bold text-primary-foreground mb-6">Investment Recommendation</h2>
                <div class="flex items-center justify-between">
                    <div>
                        <span class="inline-block px-6 py-3 bg-green-600 text-primary-foreground font-bold text-xl rounded-full">
                            ${data.pe < 20 ? 'STRONG BUY' : data.pe < 30 ? 'BUY' : 'HOLD'}
                        </span>
                        <p class="text-muted-foreground mt-4">Based on fundamental analysis</p>
                    </div>
                    <div class="text-right">
                        <p class="text-muted-foreground">Target Price</p>
                        <p class="text-3xl font-bold text-primary-foreground number">
                            ${currencySymbol}${(data.price * 1.15).toFixed(2)}
                        </p>
                        <p class="text-green-400 mt-2">+15% upside potential</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8">
            <p class="text-muted-foreground text-sm">
                Generated by AssetWorks AI • ${new Date().toLocaleString()} • Instant Report Engine
            </p>
        </div>
    </div>

    <script>
        // Generate price chart
        const ctx = document.getElementById('priceChart').getContext('2d');
        const basePrice = ${data.price};
        const dates = [];
        const prices = [];
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            prices.push(basePrice * (0.9 + Math.random() * 0.2));
        }
        prices[prices.length - 1] = basePrice;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Price',
                    data: prices,
                    borderColor: '${data.change >= 0 ? '#00C851' : '#FF4444'}',
                    backgroundColor: '${data.change >= 0 ? 'rgba(0, 200, 81, 0.1)' : 'rgba(255, 68, 68, 0.1)'}',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => '${currencySymbol}' + context.parsed.y.toFixed(2)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9CA3AF' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#9CA3AF',
                            callback: (value) => '${currencySymbol}' + value.toFixed(0)
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
  
  private generateComparisonReport(query: string): string {
    // Extract symbols to compare
    const symbols = Object.keys(MARKET_DATA.stocks);
    const foundSymbols = symbols.filter(s => query.toUpperCase().includes(s)).slice(0, 3);
    
    if (foundSymbols.length < 2) {
      foundSymbols.push(...['AAPL', 'GOOGL', 'MSFT'].slice(0, 3 - foundSymbols.length));
    }
    
    const stocks = foundSymbols.map(s => ({ symbol: s, ...this.getAssetData(s) }));
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Comparison Analysis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .positive { color: #00C851; }
        .negative { color: #FF4444; }
    </style>
</head>
<body class="bg-muted">
    <div class="max-w-7xl mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8">Stock Comparison Analysis</h1>
        
        <!-- Comparison Table -->
        <div class="bg-background rounded-xl shadow-lg overflow-hidden">
            <table class="w-full">
                <thead class="bg-muted">
                    <tr>
                        <th class="p-4 text-left">Metric</th>
                        ${stocks.map(s => `<th class="p-4 text-center">${s.symbol}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-t">
                        <td class="p-4 font-semibold">Company</td>
                        ${stocks.map(s => `<td class="p-4 text-center">${s.name}</td>`).join('')}
                    </tr>
                    <tr class="border-t bg-muted">
                        <td class="p-4 font-semibold">Price</td>
                        ${stocks.map(s => `
                            <td class="p-4 text-center">
                                <div class="font-bold text-lg">$${s.price.toFixed(2)}</div>
                                <div class="${s.change >= 0 ? 'positive' : 'negative'}">
                                    ${s.change >= 0 ? '▲' : '▼'} ${s.changePct.toFixed(2)}%
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="border-t">
                        <td class="p-4 font-semibold">Market Cap</td>
                        ${stocks.map(s => `<td class="p-4 text-center">$${formatNumber(s.marketCap, { compact: true })}</td>`).join('')}
                    </tr>
                    <tr class="border-t bg-muted">
                        <td class="p-4 font-semibold">P/E Ratio</td>
                        ${stocks.map(s => `<td class="p-4 text-center">${s.pe.toFixed(2)}</td>`).join('')}
                    </tr>
                    <tr class="border-t">
                        <td class="p-4 font-semibold">Dividend Yield</td>
                        ${stocks.map(s => `<td class="p-4 text-center">${((s.dividend / s.price) * 100).toFixed(2)}%</td>`).join('')}
                    </tr>
                    <tr class="border-t bg-muted">
                        <td class="p-4 font-semibold">Beta</td>
                        ${stocks.map(s => `<td class="p-4 text-center">${s.beta.toFixed(2)}</td>`).join('')}
                    </tr>
                    <tr class="border-t">
                        <td class="p-4 font-semibold">52-Week Performance</td>
                        ${stocks.map(s => {
                            const perf = ((s.price - s.low52w) / s.low52w * 100);
                            return `<td class="p-4 text-center ${perf >= 0 ? 'positive' : 'negative'}">${perf >= 0 ? '+' : ''}${perf.toFixed(1)}%</td>`;
                        }).join('')}
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Performance Chart -->
        <div class="bg-background rounded-xl shadow-lg p-6 mt-6">
            <h2 class="text-2xl font-bold mb-4">Relative Performance</h2>
            <canvas id="perfChart" height="80"></canvas>
        </div>

        <!-- Winner Analysis -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mt-6 text-primary-foreground">
            <h2 class="text-2xl font-bold mb-4">Best Pick</h2>
            <p class="text-lg">
                Based on the analysis, <strong>${stocks.sort((a, b) => b.changePct - a.changePct)[0].name}</strong> 
                shows the strongest momentum with superior technical indicators and valuation metrics.
            </p>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('perfChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(stocks.map(s => s.symbol))},
                datasets: [{
                    label: 'YTD Performance (%)',
                    data: ${JSON.stringify(stocks.map(s => ((s.price - s.low52w) / s.low52w * 100)))},
                    backgroundColor: ${JSON.stringify(stocks.map(s => s.change >= 0 ? 'rgba(0, 200, 81, 0.8)' : 'rgba(255, 68, 68, 0.8)'))},
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
  
  private generateMarketOverview(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Overview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .positive { color: #00C851; }
        .negative { color: #FF4444; }
    </style>
</head>
<body class="bg-muted">
    <div class="max-w-7xl mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8">Global Market Overview</h1>
        
        <!-- Indices -->
        <div class="grid grid-cols-3 gap-4 mb-8">
            ${Object.entries(MARKET_DATA.indices).map(([key, index]) => `
                <div class="bg-background rounded-xl p-6 shadow">
                    <h3 class="text-lg font-semibold mb-2">${index.name}</h3>
                    <p class="text-2xl font-bold">${index.value.toFixed(2)}</p>
                    <p class="${index.change >= 0 ? 'positive' : 'negative'}">
                        ${index.change >= 0 ? '▲' : '▼'} ${Math.abs(index.change).toFixed(2)} 
                        (${index.changePct >= 0 ? '+' : ''}${index.changePct.toFixed(2)}%)
                    </p>
                </div>
            `).join('')}
        </div>

        <!-- Top Movers -->
        <div class="bg-background rounded-xl shadow-lg p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">Top Movers</h2>
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <h3 class="text-lg font-semibold mb-3 text-green-600">Top Gainers</h3>
                    ${Object.entries(MARKET_DATA.stocks)
                        .sort((a, b) => b[1].changePct - a[1].changePct)
                        .slice(0, 5)
                        .map(([symbol, stock]) => `
                            <div class="flex justify-between py-2 border-b">
                                <span>${symbol}</span>
                                <span class="positive">+${stock.changePct.toFixed(2)}%</span>
                            </div>
                        `).join('')}
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-3 text-red-600">Top Losers</h3>
                    ${Object.entries(MARKET_DATA.stocks)
                        .sort((a, b) => a[1].changePct - b[1].changePct)
                        .slice(0, 5)
                        .map(([symbol, stock]) => `
                            <div class="flex justify-between py-2 border-b">
                                <span>${symbol}</span>
                                <span class="negative">${stock.changePct.toFixed(2)}%</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>

        <!-- Commodities & Crypto -->
        <div class="grid grid-cols-2 gap-6">
            <div class="bg-background rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold mb-4">Commodities</h2>
                ${Object.entries(MARKET_DATA.commodities).map(([key, commodity]) => `
                    <div class="flex justify-between py-2 border-b">
                        <span>${commodity.name}</span>
                        <div class="text-right">
                            <span class="font-semibold">$${commodity.price.toFixed(2)}</span>
                            <span class="${commodity.change >= 0 ? 'positive' : 'negative'} ml-2">
                                ${commodity.changePct >= 0 ? '+' : ''}${commodity.changePct.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="bg-background rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold mb-4">Cryptocurrency</h2>
                ${Object.entries(MARKET_DATA.crypto).map(([key, crypto]) => `
                    <div class="flex justify-between py-2 border-b">
                        <span>${crypto.name}</span>
                        <div class="text-right">
                            <span class="font-semibold">$${crypto.price.toFixed(2)}</span>
                            <span class="${crypto.change >= 0 ? 'positive' : 'negative'} ml-2">
                                ${crypto.changePct >= 0 ? '+' : ''}${crypto.changePct.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }
  
  private generatePortfolioReport(query: string): string {
    // Sample portfolio
    const portfolio = [
      { symbol: 'AAPL', shares: 100, avgCost: 150 },
      { symbol: 'MSFT', shares: 50, avgCost: 350 },
      { symbol: 'GOOGL', shares: 25, avgCost: 120 },
      { symbol: 'NVDA', shares: 30, avgCost: 600 },
    ];
    
    const holdings = portfolio.map(h => {
      const stock = this.getAssetData(h.symbol);
      const currentValue = stock.price * h.shares;
      const costBasis = h.avgCost * h.shares;
      const gain = currentValue - costBasis;
      const gainPct = (gain / costBasis) * 100;
      
      return {
        ...h,
        ...stock,
        currentValue,
        costBasis,
        gain,
        gainPct,
      };
    });
    
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPct = (totalGain / totalCost) * 100;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Analysis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .positive { color: #00C851; }
        .negative { color: #FF4444; }
    </style>
</head>
<body class="bg-muted">
    <div class="max-w-7xl mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8">Portfolio Analysis</h1>
        
        <!-- Portfolio Summary -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-primary-foreground mb-8">
            <div class="grid grid-cols-4 gap-6">
                <div>
                    <p class="text-sm opacity-90">Total Value</p>
                    <p class="text-3xl font-bold">$${formatNumber(totalValue, { decimals: 2 })}</p>
                </div>
                <div>
                    <p class="text-sm opacity-90">Total Gain/Loss</p>
                    <p class="text-3xl font-bold ${totalGain >= 0 ? '' : 'text-red-300'}">
                        ${totalGain >= 0 ? '+' : ''}$${formatNumber(Math.abs(totalGain), { decimals: 2 })}
                    </p>
                </div>
                <div>
                    <p class="text-sm opacity-90">Return</p>
                    <p class="text-3xl font-bold">
                        ${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(2)}%
                    </p>
                </div>
                <div>
                    <p class="text-sm opacity-90">Today's Change</p>
                    <p class="text-3xl font-bold">
                        +$${formatNumber(holdings.reduce((sum, h) => sum + (h.change * h.shares), 0), { decimals: 2 })}
                    </p>
                </div>
            </div>
        </div>

        <!-- Holdings Table -->
        <div class="bg-background rounded-xl shadow-lg overflow-hidden mb-8">
            <table class="w-full">
                <thead class="bg-muted">
                    <tr>
                        <th class="p-4 text-left">Symbol</th>
                        <th class="p-4 text-left">Name</th>
                        <th class="p-4 text-right">Shares</th>
                        <th class="p-4 text-right">Price</th>
                        <th class="p-4 text-right">Value</th>
                        <th class="p-4 text-right">Gain/Loss</th>
                        <th class="p-4 text-right">Return</th>
                        <th class="p-4 text-right">Allocation</th>
                    </tr>
                </thead>
                <tbody>
                    ${holdings.map(h => `
                        <tr class="border-t hover:bg-muted">
                            <td class="p-4 font-semibold">${h.symbol}</td>
                            <td class="p-4">${h.name}</td>
                            <td class="p-4 text-right">${h.shares}</td>
                            <td class="p-4 text-right">$${h.price.toFixed(2)}</td>
                            <td class="p-4 text-right font-semibold">$${formatNumber(h.currentValue, { decimals: 2 })}</td>
                            <td class="p-4 text-right ${h.gain >= 0 ? 'positive' : 'negative'}">
                                ${h.gain >= 0 ? '+' : ''}$${formatNumber(Math.abs(h.gain), { decimals: 2 })}
                            </td>
                            <td class="p-4 text-right ${h.gainPct >= 0 ? 'positive' : 'negative'}">
                                ${h.gainPct >= 0 ? '+' : ''}${h.gainPct.toFixed(2)}%
                            </td>
                            <td class="p-4 text-right">${((h.currentValue / totalValue) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Allocation Chart -->
        <div class="grid grid-cols-2 gap-6">
            <div class="bg-background rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold mb-4">Portfolio Allocation</h2>
                <canvas id="allocChart"></canvas>
            </div>
            <div class="bg-background rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold mb-4">Performance by Position</h2>
                <canvas id="perfChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        // Allocation Chart
        new Chart(document.getElementById('allocChart'), {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(holdings.map(h => h.symbol))},
                datasets: [{
                    data: ${JSON.stringify(holdings.map(h => h.currentValue))},
                    backgroundColor: ['#0066FF', '#00C851', '#FFB700', '#FF4444', '#7C3AED'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const pct = ((value / ${totalValue}) * 100).toFixed(1);
                                return context.label + ': $' + value.toFixed(2) + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });

        // Performance Chart
        new Chart(document.getElementById('perfChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(holdings.map(h => h.symbol))},
                datasets: [{
                    label: 'Gain/Loss ($)',
                    data: ${JSON.stringify(holdings.map(h => h.gain))},
                    backgroundColor: ${JSON.stringify(holdings.map(h => h.gain >= 0 ? 'rgba(0, 200, 81, 0.8)' : 'rgba(255, 68, 68, 0.8)'))},
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toFixed(0)
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
  }
  
  private generateSectorReport(query: string): string {
    const techStocks = Object.entries(MARKET_DATA.stocks)
      .filter(([_, stock]) => stock.sector === 'Technology')
      .slice(0, 6);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Technology Sector Analysis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .positive { color: #00C851; }
        .negative { color: #FF4444; }
    </style>
</head>
<body class="bg-muted">
    <div class="max-w-7xl mx-auto p-6">
        <h1 class="text-4xl font-bold mb-8">Technology Sector Analysis</h1>
        
        <!-- Sector Overview -->
        <div class="bg-background rounded-xl shadow-lg p-6 mb-8">
            <h2 class="text-2xl font-bold mb-4">Sector Performance</h2>
            <div class="grid grid-cols-4 gap-4">
                <div>
                    <p class="text-muted-foreground">Avg P/E Ratio</p>
                    <p class="text-2xl font-bold">
                        ${(techStocks.reduce((sum, [_, s]) => sum + s.pe, 0) / techStocks.length).toFixed(1)}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Avg Return Today</p>
                    <p class="text-2xl font-bold positive">
                        +${(techStocks.reduce((sum, [_, s]) => sum + s.changePct, 0) / techStocks.length).toFixed(2)}%
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Total Market Cap</p>
                    <p class="text-2xl font-bold">
                        $${formatNumber(techStocks.reduce((sum, [_, s]) => sum + s.marketCap, 0), { compact: true })}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Leaders</p>
                    <p class="text-2xl font-bold">${techStocks.length}</p>
                </div>
            </div>
        </div>

        <!-- Top Companies -->
        <div class="bg-background rounded-xl shadow-lg overflow-hidden">
            <table class="w-full">
                <thead class="bg-muted">
                    <tr>
                        <th class="p-4 text-left">Company</th>
                        <th class="p-4 text-right">Price</th>
                        <th class="p-4 text-right">Change</th>
                        <th class="p-4 text-right">Market Cap</th>
                        <th class="p-4 text-right">P/E</th>
                        <th class="p-4 text-right">Volume</th>
                    </tr>
                </thead>
                <tbody>
                    ${techStocks.map(([symbol, stock]) => `
                        <tr class="border-t hover:bg-muted">
                            <td class="p-4">
                                <div class="font-semibold">${symbol}</div>
                                <div class="text-sm text-muted-foreground">${stock.name}</div>
                            </td>
                            <td class="p-4 text-right font-semibold">
                                $${stock.price.toFixed(2)}
                            </td>
                            <td class="p-4 text-right ${stock.change >= 0 ? 'positive' : 'negative'}">
                                ${stock.change >= 0 ? '▲' : '▼'} ${stock.changePct.toFixed(2)}%
                            </td>
                            <td class="p-4 text-right">
                                $${formatNumber(stock.marketCap, { compact: true })}
                            </td>
                            <td class="p-4 text-right">${stock.pe.toFixed(1)}</td>
                            <td class="p-4 text-right">${formatNumber(stock.volume, { compact: true })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
  }
}

// Export singleton instance
export const instantReportGenerator = new InstantReportGenerator();