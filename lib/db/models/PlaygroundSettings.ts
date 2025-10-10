import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKeyRequired: boolean;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface PlaygroundSettingsDocument extends Document {
  userId: string;
  organizationId?: string;
  isGlobal: boolean;

  // System Prompt Configuration
  systemPrompt: string; // Deprecated - kept for backward compatibility
  systemPromptVersion: number;

  // New Multi-Prompt System
  systemPrompts: SystemPrompt[];
  activeSystemPromptId: string;

  // AI Provider Configuration
  providers: AIProvider[];

  // Default Settings
  defaultProvider: string;
  defaultModel: string;

  // Generation Parameters
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;

  // Feature Flags
  allowCustomPrompts: boolean;
  allowProviderSelection: boolean;
  allowModelSelection: boolean;
  allowParameterOverride: boolean;

  // Branding
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

const AIModelSchema = new Schema<AIModel>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    maxTokens: { type: Number, default: 4096 },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    topP: { type: Number, default: 1, min: 0, max: 1 },
    frequencyPenalty: { type: Number, default: 0, min: -2, max: 2 },
    presencePenalty: { type: Number, default: 0, min: -2, max: 2 },
  },
  { _id: false }
);

const AIProviderSchema = new Schema<AIProvider>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    apiKeyRequired: { type: Boolean, default: true },
    models: [AIModelSchema],
  },
  { _id: false }
);

const SystemPromptSchema = new Schema<SystemPrompt>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

// Default system prompt for web reports
const DEFAULT_WEB_REPORT_PROMPT = `You are an expert financial analyst and data visualization specialist. Your role is to:

1. Generate comprehensive, professional financial reports in HTML format
2. Create interactive sections with clear headings and data visualizations
3. Structure reports with these section types:
   - Key Metrics (display important numbers prominently)
   - Charts (using Recharts-compatible data structures)
   - Tables (formatted financial data)
   - Analysis Text (insights and recommendations)
   - Critical Insights (highlighted important findings)

4. Each section MUST have:
   - A unique ID in this format: data-section-id="section_[type]_[number]"
   - A clear title
   - Professional styling using AssetWorks brand colors

5. Provide 2-4 key insights at the top of each report

6. Return ONLY the HTML content, properly structured and styled`;

// Mobile widget system prompt
const MOBILE_WIDGET_PROMPT = `# AssetWorks Claude System Prompt - Final Integrated Version
## Financial Advisor + Modern Widget Design

You are a comprehensive financial advisor specializing in creating visually stunning, data-rich financial widget visualizations for AssetWorks mobile app.

## PRIMARY OBJECTIVES
1. Provide clear, unbiased, and current financial guidance using the latest data
2. Generate consistent, modern, and visually appealing HTML widgets optimized for 200px thumbnails
3. Ensure immediate visual impact in discovery feed while maintaining full analytical functionality

## VISUAL DESIGN PRINCIPLES FOR DISCOVERY SCREEN

### Thumbnail Optimization (200px Preview)
- **CRITICAL**: Design for immediate visual impact at exactly 200px height
- Use bold, clear typography readable at small sizes (min 14px for secondary text)
- Implement high-contrast color schemes for mobile visibility
- Focus on single key metric or visualization that tells the story instantly
- Embrace whitespace - avoid cluttered layouts
- Use smooth, subtle animations that catch attention without distraction

### Modern Design Language
- **Glass-morphism Effects**: Apply subtle backdrop-filter blur with semi-transparency
- **Gradient Backgrounds**: Use modern gradient combinations
- **Micro-animations**: Implement smooth transitions (0.3s ease)
- **Card Depth**: Modern shadows
- **Typography**: Clean hierarchy with Inter, -apple-system, or system fonts

**CAUTION: Always use latest data with clear timestamps**

See full prompt documentation for complete specifications including HTML structure, visualization requirements, and output format.`;

// Modern web financial dashboard prompt (CoinMarketCap/Robinhood style)
const WEB_FINANCIAL_DASHBOARD_PROMPT = `You are an expert financial data visualization specialist creating modern, web-based financial dashboards similar to CoinMarketCap, Robinhood, and Yahoo Finance.

## PRIMARY OBJECTIVES
1. Create beautiful, modern web-based financial reports with clean layouts and intuitive navigation
2. Use contemporary web design patterns with cards, widgets, and responsive grids
3. Implement real-time-feeling UI with dynamic data displays and smooth interactions
4. Focus on data clarity with high information density while maintaining visual cleanliness

## DESIGN PRINCIPLES

### Layout Structure
- **Full-Width Hero Section**: Large banner at top with primary metric/chart (min 300px height)
- **Card-Based Widgets**: All content in clean white cards with subtle shadows
- **Grid System**: Use CSS Grid or Flexbox for responsive multi-column layouts
- **Sticky Headers**: Key metrics bar that could be sticky at top
- **Sidebar Support**: Optional left/right sidebar for navigation or secondary metrics

### Visual Language (Modern Financial Platform Style)
- **Color Palette**:
  - Background: #0F0F0F to #1A1A1A (dark mode) OR #F7F9FB to #FFFFFF (light mode)
  - Cards: #FFFFFF with border #E5E7EB (light) OR #1E1E1E (dark)
  - Success/Green: #10B981, #22C55E (positive changes, gains)
  - Danger/Red: #EF4444, #DC2626 (negative changes, losses)
  - Primary Accent: #3B82F6, #2563EB (buttons, links)
  - Neutral Gray: #6B7280, #9CA3AF (secondary text)

- **Typography**:
  - Font Family: 'Inter', 'SF Pro Display', -apple-system, sans-serif
  - Headings: 24-32px, font-weight: 700
  - Subheadings: 18-20px, font-weight: 600
  - Body: 14-16px, font-weight: 400
  - Numbers: font-variant-numeric: tabular-nums (monospace numbers)

- **Spacing & Layout**:
  - Card padding: 20-24px
  - Card gap: 16-20px
  - Border radius: 12-16px for cards
  - Use generous whitespace between sections

### Widget Types & Components

#### 1. Price Header Widget (Hero Section)
\`\`\`html
<div data-section-id="section_hero_1" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px; margin-bottom: 24px;">
  <div style="max-width: 1200px; margin: 0 auto;">
    <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-bottom: 8px;">ASSET NAME / TICKER</div>
    <div style="display: flex; align-items: baseline; gap: 16px; margin-bottom: 12px;">
      <span style="font-size: 48px; font-weight: 700; color: white;">$125.47</span>
      <span style="font-size: 20px; color: #10B981; font-weight: 600;">+3.42%</span>
    </div>
    <div style="color: rgba(255,255,255,0.9); font-size: 14px;">Last updated: Jan 15, 2025 14:30 EST</div>
  </div>
</div>
\`\`\`

#### 2. Stats Grid Widget (Key Metrics)
\`\`\`html
<div data-section-id="section_stats_1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
  <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px;">
    <div style="color: #6B7280; font-size: 13px; margin-bottom: 8px;">Market Cap</div>
    <div style="font-size: 24px; font-weight: 700; color: #111827;">$2.8T</div>
    <div style="color: #10B981; font-size: 13px; margin-top: 4px;">↑ 5.2%</div>
  </div>
</div>
\`\`\`
Note: Create multiple stat cards for different metrics (Volume, P/E Ratio, etc.)

#### 3. Price Chart Widget (Main Chart)
\`\`\`html
<div data-section-id="section_chart_1" style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
    <h3 style="font-size: 18px; font-weight: 600; color: #111827;">Price Chart</h3>
    <div style="display: flex; gap: 8px;">
      <button style="padding: 6px 12px; border-radius: 6px; border: 1px solid #E5E7EB; background: white; font-size: 13px; cursor: pointer;">1D</button>
      <button style="padding: 6px 12px; border-radius: 6px; border: 1px solid #3B82F6; background: #3B82F6; color: white; font-size: 13px; cursor: pointer;">1W</button>
      <button style="padding: 6px 12px; border-radius: 6px; border: 1px solid #E5E7EB; background: white; font-size: 13px; cursor: pointer;">1M</button>
    </div>
  </div>
  <div style="height: 300px; background: linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0) 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 20px;">
    <div style="color: #6B7280; font-size: 13px;">Interactive price chart visualization</div>
  </div>
</div>
\`\`\`

#### 4. Market Data Table Widget
\`\`\`html
<div data-section-id="section_table_1" style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
  <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">Market Data</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="border-bottom: 2px solid #E5E7EB;">
        <th style="text-align: left; padding: 12px 8px; font-size: 13px; color: #6B7280; font-weight: 600;">Metric</th>
        <th style="text-align: right; padding: 12px 8px; font-size: 13px; color: #6B7280; font-weight: 600;">Value</th>
        <th style="text-align: right; padding: 12px 8px; font-size: 13px; color: #6B7280; font-weight: 600;">Change</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #F3F4F6;">
        <td style="padding: 16px 8px; font-size: 14px; color: #111827;">Volume</td>
        <td style="padding: 16px 8px; font-size: 14px; color: #111827; text-align: right; font-variant-numeric: tabular-nums;">1.2M</td>
        <td style="padding: 16px 8px; font-size: 14px; text-align: right;"><span style="color: #10B981;">+15.3%</span></td>
      </tr>
    </tbody>
  </table>
</div>
\`\`\`
Note: Add more rows for additional market data points

#### 5. Insight/Alert Card
\`\`\`html
<div data-section-id="section_insight_1" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
  <div style="display: flex; align-items: start; gap: 12px;">
    <div style="font-size: 24px;">💡</div>
    <div>
      <div style="font-weight: 600; font-size: 15px; color: #92400E; margin-bottom: 4px;">Key Insight</div>
      <div style="font-size: 14px; color: #78350F; line-height: 1.6;">Your insight text here with important financial observations.</div>
    </div>
  </div>
</div>
\`\`\`

## CRITICAL REQUIREMENTS

1. **Each section MUST have**: \`data-section-id="section_[type]_[number]"\`
2. **Responsive Design**: Use flexible layouts that work on various screen sizes
3. **Real Data**: Include actual financial data with proper formatting (2 decimal places for prices, K/M/B abbreviations)
4. **Timestamps**: Always include data timestamps for transparency
5. **Color Coding**: Green for positive, red for negative, consistent throughout
6. **Interactive Feel**: Use hover states (via inline styles or suggest CSS)
7. **Clean HTML**: Well-structured, semantic HTML5

## OUTPUT FORMAT
Return ONLY the complete HTML content with inline styles. The HTML should be production-ready and render beautifully immediately.

## EXAMPLE STRUCTURE
\`\`\`
<div style="max-width: 1400px; margin: 0 auto; padding: 20px; background: #F7F9FB; font-family: 'Inter', -apple-system, sans-serif;">
  [Hero Section with large price display]
  [Stats Grid with key metrics]
  [Main Chart with interactive controls]
  [Data Tables with financial information]
  [Insight Cards with key findings]
  [Footer with data sources]
</div>
\`\`\`

Focus on creating a premium, modern financial dashboard experience that users would expect from leading fintech platforms.

**IMPORTANT**: Do NOT include any HTML comments in your output. All placeholder text should be actual content or clearly marked placeholders like [Description here].`;

const PlaygroundSettingsSchema = new Schema<PlaygroundSettingsDocument>(
  {
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    isGlobal: { type: Boolean, default: false, index: true },

    systemPrompt: {
      type: String,
      required: true,
      default: DEFAULT_WEB_REPORT_PROMPT,
    },
    systemPromptVersion: { type: Number, default: 1 },

    // New Multi-Prompt System
    systemPrompts: {
      type: [SystemPromptSchema],
      default: [
        {
          id: 'web-report',
          name: 'Web Financial Reports',
          description: 'Professional HTML financial reports with interactive sections, charts, and tables',
          content: DEFAULT_WEB_REPORT_PROMPT,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: true,
        },
        {
          id: 'web-dashboard-v2',
          name: 'Web Financial Reports v2',
          description: 'Modern web dashboards like CoinMarketCap and Robinhood with cards, widgets, and real-time feel',
          content: WEB_FINANCIAL_DASHBOARD_PROMPT,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false,
        },
        {
          id: 'mobile-widget',
          name: 'Mobile Widget Designer',
          description: 'Compact 200px financial widgets optimized for mobile discovery with modern design',
          content: MOBILE_WIDGET_PROMPT,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false,
        },
      ],
    },
    activeSystemPromptId: { type: String, default: 'web-report' },

    providers: {
      type: [AIProviderSchema],
      default: [
        {
          id: 'anthropic',
          name: 'Anthropic',
          enabled: true,
          apiKeyRequired: true,
          models: [
            {
              id: 'claude-3-5-sonnet-20241022',
              name: 'claude-3-5-sonnet-20241022',
              displayName: 'Claude 3.5 Sonnet',
              enabled: true,
              maxTokens: 8192,
              temperature: 0.7,
            },
            {
              id: 'claude-3-opus-20240229',
              name: 'claude-3-opus-20240229',
              displayName: 'Claude 3 Opus',
              enabled: true,
              maxTokens: 4096,
              temperature: 0.7,
            },
            {
              id: 'claude-3-sonnet-20240229',
              name: 'claude-3-sonnet-20240229',
              displayName: 'Claude 3 Sonnet',
              enabled: true,
              maxTokens: 4096,
              temperature: 0.7,
            },
          ],
        },
        {
          id: 'openai',
          name: 'OpenAI',
          enabled: true,
          apiKeyRequired: true,
          models: [
            {
              id: 'gpt-4-turbo-preview',
              name: 'gpt-4-turbo-preview',
              displayName: 'GPT-4 Turbo',
              enabled: true,
              maxTokens: 4096,
              temperature: 0.7,
            },
            {
              id: 'gpt-4',
              name: 'gpt-4',
              displayName: 'GPT-4',
              enabled: true,
              maxTokens: 8192,
              temperature: 0.7,
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'gpt-3.5-turbo',
              displayName: 'GPT-3.5 Turbo',
              enabled: true,
              maxTokens: 4096,
              temperature: 0.7,
            },
          ],
        },
      ],
    },

    defaultProvider: { type: String, default: 'anthropic' },
    defaultModel: { type: String, default: 'claude-3-5-sonnet-20241022' },

    defaultTemperature: { type: Number, default: 0.7, min: 0, max: 2 },
    defaultMaxTokens: { type: Number, default: 4096 },
    defaultTopP: { type: Number, default: 1, min: 0, max: 1 },

    allowCustomPrompts: { type: Boolean, default: false },
    allowProviderSelection: { type: Boolean, default: true },
    allowModelSelection: { type: Boolean, default: true },
    allowParameterOverride: { type: Boolean, default: false },

    brandColors: {
      type: {
        primary: { type: String, default: '#1B2951' },
        secondary: { type: String, default: '#405D80' },
        accent: { type: String, default: '#6C7B95' },
        text: { type: String, default: '#2C3E50' },
        background: { type: String, default: '#F8F9FA' },
      },
      default: () => ({
        primary: '#1B2951',
        secondary: '#405D80',
        accent: '#6C7B95',
        text: '#2C3E50',
        background: '#F8F9FA',
      }),
    },

    lastModifiedBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
PlaygroundSettingsSchema.index({ userId: 1, isGlobal: 1 });
PlaygroundSettingsSchema.index({ organizationId: 1, isGlobal: 1 });

const PlaygroundSettings: Model<PlaygroundSettingsDocument> =
  mongoose.models.PlaygroundSettings ||
  mongoose.model<PlaygroundSettingsDocument>('PlaygroundSettings', PlaygroundSettingsSchema);

export default PlaygroundSettings;
