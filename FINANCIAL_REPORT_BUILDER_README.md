# 🏦 AssetWorks AI - Financial Report Builder

> **Enterprise-grade AI-powered financial reporting platform for professional financial institutions**

## 🚀 Overview

AssetWorks AI Financial Report Builder is a comprehensive platform that transforms natural language prompts into interactive, professional financial reports. Built with enterprise-grade architecture, it provides multi-agent AI orchestration, advanced data visualization, and seamless collaboration features.

## ✨ Key Features

### 🎯 **Multi-Section Interface (Cursor-like Layout)**
- **Resizable 4-panel layout**: Left sidebar, center canvas, right chat, bottom panel
- **Drag-to-resize panels** with smooth transitions
- **Professional navigation** with clear visual hierarchy
- **Responsive design** for desktop and mobile

### 🤖 **AI-Powered Report Generation**
- **Natural language prompts** → structured HTML reports
- **Section-based architecture**: intro, analysis, charts, tables, conclusions
- **Real-time preview** as sections generate
- **Inline editing**: Select any section → modify via chat
- **Multi-agent orchestration** with specialized AI agents

### 📊 **Advanced Data Visualization**
- **Apache ECharts integration** with financial chart types
- **Interactive charts**: Line, bar, candlestick, heatmap, treemap, pie, scatter
- **Theme synchronization** (dark/light mode support)
- **Chart builder** with dynamic configuration
- **Export capabilities** for charts and reports

### 🔗 **Multi-Agent AI System**
- **Data Agent**: Fetches/processes financial data from sources
- **Analysis Agent**: Performs calculations, trends, insights
- **Visualization Agent**: Generates chart configurations
- **Writer Agent**: Composes report narrative text
- **Review Agent**: Validates data accuracy and compliance
- **Real-time status monitoring** in bottom panel

### 📈 **Data Source Management**
- **Multiple connector types**: Database, REST API, File upload, WebSocket
- **Connection testing** and status monitoring
- **Credential management** with secure storage
- **Data source analytics** and usage tracking

### 🔗 **Report Sharing System**
- **Shareable links** with unique URLs
- **Access control**: Password protection, expiration dates
- **QR code generation** for easy sharing
- **Analytics tracking**: View counts, geographic data, referrers
- **Public report viewer** for shared reports

### 🎨 **Dark/Light Theme System**
- **Theme provider** with system preference detection
- **Consistent theming** across all components and charts
- **Theme toggle** in header
- **CSS variables** for dynamic theming
- **Accessibility compliance** (WCAG AA)

### ⚙️ **Comprehensive Settings**
- **User preferences**: Profile, timezone, language
- **AI model configuration**: Model selection, temperature, tokens
- **Data source credentials** management
- **Notification settings**: Email, push, alerts
- **Security settings**: 2FA, session timeout, password expiry
- **Appearance customization**: Font size, density, theme

## 🏗️ Technical Architecture

### **Frontend Stack**
- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety
- **Tailwind CSS** with custom design system
- **Radix UI** components for accessibility
- **Zustand** for state management
- **Apache ECharts** for data visualization

### **Key Dependencies**
```json
{
  "echarts": "^5.5.0",
  "echarts-for-react": "^3.0.2",
  "react-resizable-panels": "^2.0.0",
  "@monaco-editor/react": "^4.6.0",
  "react-markdown": "^9.0.1",
  "uuid": "^9.0.1",
  "file-saver": "^2.0.5"
}
```

### **Component Architecture**
```
src/
├── components/
│   ├── layouts/
│   │   ├── ResizablePanels.tsx      # 4-panel resizable layout
│   │   └── ReportLayout.tsx         # Main layout orchestrator
│   ├── navigation/
│   │   └── MainSidebar.tsx          # Left sidebar navigation
│   ├── report/
│   │   ├── ReportCanvas.tsx         # Main report editor
│   │   ├── ReportEditor.tsx         # Section editor
│   │   ├── ReportPreview.tsx        # HTML preview
│   │   └── SectionSelector.tsx      # Section management
│   ├── chat/
│   │   └── ChatPanel.tsx            # AI chat interface
│   ├── agents/
│   │   └── AgentStatusPanel.tsx     # Agent status monitoring
│   ├── charts/
│   │   ├── ChartBuilder.tsx         # Dynamic chart generator
│   │   └── ChartTypes/
│   │       └── FinancialChart.tsx   # Financial chart components
│   ├── data/
│   │   └── DataSourceManager.tsx    # Data source connections
│   ├── sharing/
│   │   └── ShareDialog.tsx          # Report sharing interface
│   └── ui/                          # Reusable UI components
├── lib/
│   ├── agents/
│   │   ├── AgentOrchestrator.ts     # Multi-agent coordination
│   │   └── types.ts                 # Agent interfaces
│   ├── theme/
│   │   └── ThemeProvider.tsx        # Theme management
│   ├── chartConfig.ts               # ECharts configuration
│   └── sharing/
│       └── shareManager.ts          # Share link management
├── types/
│   └── report.types.ts              # TypeScript interfaces
└── app/
    ├── reports/
    │   └── page.tsx                 # Main reports page
    ├── settings/
    │   └── page.tsx                 # Settings page
    └── layout.tsx                   # Root layout with theme
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- AssetWorks backend running (for authentication)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/astwrks/assetwork-ai-web.git
   cd assetwork-ai-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Create .env.local
   NEXT_PUBLIC_ASSETWORKS_API_URL=http://localhost:8080/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### **Authentication Flow**
1. Navigate to the application
2. Use OTP login, Google OAuth, or Apple OAuth
3. Upon successful authentication, redirect to `/reports`
4. Start building reports with AI assistance

## 📖 Usage Guide

### **Creating Your First Report**

1. **Navigate to Reports**
   - Click "Reports" in the left sidebar
   - Select "Create New Report" or use a template

2. **Generate Content with AI**
   - Use the chat panel (right sidebar) to prompt AI
   - Example: "Create a financial analysis report for Q4 2024"
   - AI agents will generate sections automatically

3. **Edit Sections**
   - Click any section in the left panel to select it
   - Use the chat to modify: "Make this section more detailed"
   - Toggle between edit and preview modes

4. **Add Data Visualizations**
   - Prompt: "Add a revenue trend chart"
   - Visualization agent will generate interactive charts
   - Charts automatically sync with theme (dark/light)

5. **Share Your Report**
   - Click "Share" button in the header
   - Configure access settings (password, expiration)
   - Copy shareable link or download QR code

### **AI Agent Workflow**

The platform uses 5 specialized AI agents:

1. **Data Agent** - Fetches and processes data from connected sources
2. **Analysis Agent** - Performs financial calculations and trend analysis
3. **Visualization Agent** - Generates chart configurations and visualizations
4. **Writer Agent** - Composes narrative text and report content
5. **Review Agent** - Validates accuracy and compliance

### **Data Source Management**

1. **Navigate to Data Sources**
   - Click "Data Sources" in the left sidebar
   - Click "Add Source" to connect new data

2. **Supported Sources**
   - **Database**: PostgreSQL, MySQL, SQLite
   - **REST API**: HTTP/HTTPS endpoints
   - **File Upload**: CSV, Excel, JSON files
   - **WebSocket**: Real-time data streams

3. **Test Connections**
   - Click the test button for each source
   - Monitor connection status in real-time

### **Settings Configuration**

1. **Navigate to Settings**
   - Click "Settings" in the left sidebar
   - Or visit `/settings` directly

2. **Configure AI Models**
   - Select default AI model (GPT-4, Claude, etc.)
   - Adjust temperature and token limits
   - Customize system prompts

3. **Data Preferences**
   - Set auto-sync intervals
   - Configure cache settings
   - Manage data retention

## 🎨 Customization

### **Theme Customization**
- Toggle between light/dark themes
- System preference detection
- Custom color schemes for charts
- Accessibility-compliant design

### **AI Model Configuration**
- Multiple model support (OpenAI, Anthropic, etc.)
- Custom system prompts
- Temperature and token tuning
- Agent-specific configurations

### **Report Templates**
- Pre-built templates for common report types
- Custom template creation
- Template sharing across teams
- Version control for templates

## 🔒 Security Features

### **Access Control**
- Password-protected share links
- Expiration dates for links
- Role-based permissions
- Audit logging

### **Data Security**
- Encrypted credential storage
- Secure API connections
- GDPR compliance
- Data retention policies

### **Authentication**
- Multi-factor authentication
- Session management
- OAuth integration
- Single sign-on (SSO) support

## 📊 Analytics & Monitoring

### **Report Analytics**
- View count tracking
- Geographic distribution
- Referrer analysis
- Engagement metrics

### **Agent Performance**
- Task completion rates
- Response times
- Error tracking
- Resource utilization

### **System Monitoring**
- Connection health
- Data source status
- Performance metrics
- Error logging

## 🚀 Deployment

### **Production Build**
```bash
npm run build
npm start
```

### **Environment Variables**
```bash
# Required
NEXT_PUBLIC_ASSETWORKS_API_URL=https://api.assetworks.com
NEXT_PUBLIC_APP_URL=https://reports.assetworks.com

# Optional
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.assetworks.ai](https://docs.assetworks.ai)
- **Issues**: [GitHub Issues](https://github.com/astwrks/assetwork-ai-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/astwrks/assetwork-ai-web/discussions)
- **Email**: support@assetworks.ai

## 🎯 Roadmap

### **Phase 1: Core Features** ✅
- [x] Multi-panel layout system
- [x] AI agent orchestration
- [x] Report generation
- [x] Data visualization
- [x] Theme system

### **Phase 2: Advanced Features** 🚧
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] API integrations

### **Phase 3: Enterprise Features** 📋
- [ ] Multi-tenant support
- [ ] Advanced security
- [ ] Compliance tools
- [ ] Enterprise SSO

---

**Built with ❤️ for financial professionals by the AssetWorks team**
