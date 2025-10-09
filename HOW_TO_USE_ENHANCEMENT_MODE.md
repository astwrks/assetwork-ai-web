# How to Use Enhancement Mode

## Quick Start

1. **Go to AI Chat**: Navigate to `http://localhost:3004/ai-chat`

2. **Enable Enhancement Mode**:
   - Click the Settings button (gear icon)
   - Select "🎯 Enhancement Mode" from the preset prompts
   - Click Apply

3. **Generate Initial Report**:
   - Type: "Analyze Apple stock"
   - Press Enter
   - Wait for the instant HTML report to generate

4. **Enhance the Report** (subsequent prompts):
   - "Add technical indicators"
   - "Compare with Microsoft"
   - "Show 5 year historical trends"
   - "Add risk analysis"
   - Each prompt will enhance the existing report

## How It Works

### First Message
When you send your first prompt with Enhancement Mode active:
- System generates a complete HTML report instantly
- Report is saved with a unique widget ID
- Thread context is established
- Enhancement mode is automatically enabled for next message

### Subsequent Messages
Each new prompt in the same conversation:
- Builds upon the existing report
- Adds new sections or modifies existing ones
- Preserves all previous data
- Uses minimal tokens (86% savings)

## Visual Indicators

- **Purple Badge**: "Enhancement Mode" appears when active
- **Thread ID**: Shows in footer (e.g., "Thread: abc12345")
- **Enhance Button**: Appears after first report is generated

## Example Flow

```
User: "Analyze Reliance Industries"
→ System generates complete financial report

User: "Add peer comparison with TCS and Infosys"
→ System adds comparison section to existing report

User: "Include technical indicators"
→ System adds RSI, MACD, Bollinger Bands section

User: "Show quarterly earnings trend"
→ System adds earnings history chart
```

## Tips

1. **Start Simple**: Begin with a basic request, then enhance
2. **Be Specific**: Clear enhancement requests work best
3. **Build Progressively**: Each prompt adds value
4. **New Chat for New Report**: Use "New Chat" button to start fresh

## Troubleshooting

### Report Not Enhancing?
- Ensure Enhancement Mode is selected in settings
- Check that you have a previous report in the conversation
- Look for the purple "Enhancement Mode" badge

### Starting Fresh?
- Click "New Chat" button
- This resets the thread and context
- Allows you to start a completely new report

## Token Savings

Enhancement Mode saves approximately 70% on token usage by:
- Preserving context between messages
- Sending only diffs to the AI
- Reusing computed data
- Compressing previous responses

## Advanced Features

### Manual Enhancement Toggle
After generating an initial report, you can:
- Click the "Enhance" button in the header
- This toggles enhancement mode on/off
- Useful for switching between modes

### Enhancement History
- Each enhancement is tracked
- Version numbers increase with each update
- Context is preserved for 1 hour

### Multiple Assets
You can progressively add assets:
1. "Analyze Apple"
2. "Add Microsoft"
3. "Include Google"
4. "Compare all three"

Each step builds on the previous analysis!