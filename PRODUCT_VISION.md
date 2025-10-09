# AssetWorks - Product Vision & Architecture

## 🎯 Product Vision
AssetWorks is a professional-grade financial intelligence platform that combines real-time market data with AI-powered analysis to deliver instant, actionable insights through beautiful interactive visualizations.

## 🏗️ Core Principles
1. **Instant Intelligence**: Every query delivers immediate, comprehensive financial reports
2. **Professional Grade**: Bloomberg Terminal-quality data presentation
3. **AI-First Design**: Natural language interface for complex financial analysis
4. **Visual Excellence**: Every output is a beautiful, interactive widget
5. **Zero Friction**: No authentication required for instant reports

## 🎨 Design System

### Color Palette
```css
Primary Colors:
- Brand Blue: #0066FF (Primary actions, links)
- Dark Blue: #001A3D (Headers, text)
- Success Green: #00C851 (Positive changes, buy signals)
- Danger Red: #FF4444 (Negative changes, sell signals)
- Warning Amber: #FFB700 (Neutral, caution)

Background Colors:
- Pure White: #FFFFFF (Main background)
- Light Gray: #F8F9FA (Cards, sections)
- Medium Gray: #E9ECEF (Borders)
- Dark Background: #0A0E1A (Dark mode primary)
- Card Dark: #1A1F2E (Dark mode cards)

Accent Colors:
- Purple: #7C3AED (Premium features)
- Teal: #14B8A6 (Data highlights)
- Orange: #FB923C (Alerts)
```

### Typography
```css
Font Family: Inter (UI), IBM Plex Mono (Numbers)
- Headings: 600-800 weight
- Body: 400-500 weight
- Numbers: Monospace for alignment
```

### Component Standards
- Border Radius: 12px (cards), 8px (buttons), 16px (modals)
- Shadows: 0 4px 6px rgba(0,0,0,0.07) (subtle lift)
- Spacing: 8px grid system (8, 16, 24, 32, 48, 64)
- Animation: 200ms ease-out transitions

## 🚀 Core Features

### 1. Instant Report Engine
- **Purpose**: Generate comprehensive financial reports without API calls
- **Technology**: Pre-computed data, smart templates, instant rendering
- **Output**: Full HTML reports with charts, metrics, and analysis

### 2. AI Chat Interface
- **Purpose**: Natural language interface for financial queries
- **Modes**: 
  - Instant Mode (local generation)
  - Claude Mode (API-powered)
  - Research Mode (deep analysis)
- **Features**: Auto-complete, smart suggestions, conversation history

### 3. Widget Gallery
- **Purpose**: Showcase and manage generated financial widgets
- **Types**: Stock analysis, portfolio tracking, market comparison, sector analysis
- **Sharing**: Public URLs, embed codes, export options

### 4. Professional Dashboard
- **Purpose**: Central hub for all financial activities
- **Sections**: Market overview, watchlist, recent widgets, AI insights
- **Customization**: Drag-drop layout, theme preferences, data sources

## 📊 Data Architecture

### Instant Data Layer
```typescript
interface AssetData {
  // Core Identifiers
  symbol: string
  name: string
  exchange: string
  
  // Real-time Pricing
  price: number
  change: number
  changePercent: number
  volume: number
  
  // Fundamental Metrics
  marketCap: number
  pe: number
  eps: number
  dividend: number
  
  // Technical Indicators
  rsi: number
  macd: MacdData
  movingAverages: MAData
  
  // Analyst Data
  rating: AnalystRating
  targetPrice: number
  recommendations: Recommendation[]
}
```

### Report Templates
1. **Single Asset Analysis**: Deep dive into one stock/asset
2. **Comparison Report**: Side-by-side analysis of multiple assets
3. **Sector Analysis**: Industry trends and leaders
4. **Portfolio Review**: Holdings performance and recommendations
5. **Market Screener**: Filter and rank assets by criteria

## 🔄 User Journey

### First-Time User
1. Land on homepage → See instant demo
2. Try example query → Get beautiful report
3. Explore features → No signup required
4. Save/share widget → Optional registration

### Power User
1. Quick access via /ai-chat
2. Keyboard shortcuts for speed
3. Saved templates and preferences
4. API access for automation

## 🎯 Success Metrics
- Time to first report: < 2 seconds
- Report quality score: > 90%
- User engagement: > 5 reports per session
- Widget sharing rate: > 30%
- Return user rate: > 60%

## 🚧 Technical Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Framer Motion
- **Charts**: Chart.js, D3.js
- **AI**: Claude API, Local LLM fallback
- **Data**: Static + Real-time feeds
- **Auth**: NextAuth (optional)
- **Database**: PostgreSQL (user data)
- **Hosting**: Vercel Edge Functions