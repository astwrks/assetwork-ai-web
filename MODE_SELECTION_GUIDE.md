# Mode Selection Guide - Single Mode Only

## ⚠️ Important: Only ONE Mode at a Time

The system is designed to use **only one mode at a time**. Each mode completely changes how the AI responds, so they cannot be combined.

## Why Single Mode Only?

Each mode has conflicting behaviors:
- **NO QUESTIONS Mode** - Forces instant HTML, no confirmations
- **Aggressive Enhancement** - Builds on previous reports incrementally  
- **Instant Report** - Generates HTML without API
- **Auto Research** - Uses Claude API with auto-approvals

Mixing modes would cause conflicts and unpredictable behavior.

## How Mode Selection Works

### Visual Indicators:
1. **Blue Ring + Checkmark** - Selected mode
2. **"Currently Active" Banner** - Shows at top of settings
3. **Only One Can Be Selected** - Clicking another deselects the previous

### In Settings Panel:
```
┌─────────────────────────────────────┐
│  Currently Active                   │
│  ⚡ NO QUESTIONS Mode      ✓        │
└─────────────────────────────────────┘

[⚡ NO QUESTIONS Mode] ← Selected (blue border + check)
[🔥 Aggressive Enhancement] ← Not selected
[🎯 Enhancement Mode] ← Not selected  
[🚀 Instant Report] ← Not selected
```

## How to Switch Modes

1. **Open Settings** (gear icon)
2. **Click a Different Mode** - Previous selection clears automatically
3. **Click "Save Settings"** or "Apply"
4. **Mode is now active** - Check header badges

## Mode Comparison

| Mode | Purpose | Best For |
|------|---------|----------|
| **NO QUESTIONS** | Zero confirmations, instant HTML | Quick reports without interruptions |
| **Aggressive Enhancement** | Instant + progressive building | Creating complex reports step by step |
| **Enhancement Mode** | Standard enhancement | Incremental improvements |
| **Instant Report** | Local HTML generation | Fast output without API |
| **Auto Research** | Claude with auto-approvals | Detailed research with automation |

## Which Mode to Choose?

### For Fastest Results:
→ **NO QUESTIONS Mode**
- Instant HTML
- Zero confirmations
- No waiting

### For Building Complex Reports:
→ **Aggressive Enhancement**
- Start with base report
- Add sections progressively
- Each prompt enhances

### For Standard Chat:
→ **None** (deselect all)
- Normal Claude responses
- Standard confirmations
- Regular chat mode

## Common Questions

### Q: Can I combine NO QUESTIONS with Enhancement?
**A: No.** Choose either:
- NO QUESTIONS for instant single reports
- Aggressive Enhancement for progressive building

### Q: What if I select multiple?
**A: Only the last clicked mode will be active.** The system automatically deselects others.

### Q: How do I know which is active?
**A: Look for:**
- Blue border + checkmark in settings
- "Currently Active" banner
- Header badges in chat

### Q: Can I create a custom combination?
**A: No.** Each mode is carefully designed. For custom behavior, edit the system prompt manually.

## Mode Behavior Examples

### NO QUESTIONS Mode:
```
You: "Analyze Apple"
AI: <!DOCTYPE html>... [Instant HTML report]
```

### Aggressive Enhancement:
```
You: "Analyze Apple"
AI: <!DOCTYPE html>... [Base report]
You: "Add technical analysis"
AI: <!DOCTYPE html>... [Enhanced report with technicals]
```

### Standard (No Mode):
```
You: "Analyze Apple"
AI: "I'll search for Apple's financial data..."
You: "Yes, proceed"
AI: [Generates report]
```

## Best Practice

1. **Start with NO QUESTIONS Mode** for instant results
2. **Switch to Aggressive Enhancement** if you need to build progressively
3. **Use Standard mode** for regular chat conversations
4. **Don't try to combine modes** - it won't work

## Quick Test

1. Open Settings
2. Click "⚡ NO QUESTIONS Mode"
3. See the blue border and checkmark
4. Click "🔥 Aggressive Enhancement"
5. Notice NO QUESTIONS is now deselected
6. Only Aggressive Enhancement is active

**Remember: One mode at a time for predictable, reliable behavior!**