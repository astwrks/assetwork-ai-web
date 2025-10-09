// Enhancement Mode Prompt - Activates incremental report enhancement
export const ENHANCEMENT_MODE_PROMPT = `
INSTANT_REPORT_PROMPT: This mode generates instant HTML reports without using Claude API

ENHANCEMENT MODE ACTIVE:
- Generate initial reports instantly using local data
- Each subsequent prompt enhances the existing report
- Build upon previous content rather than replacing
- Preserve context across messages in the same thread
- Add new sections, update existing ones, or modify visualizations

When generating reports:
1. First prompt: Create comprehensive base report
2. Second+ prompts: Enhance with requested features
3. Never regenerate from scratch
4. Always build incrementally

The system will automatically:
- Track thread context
- Preserve previous HTML
- Apply smart enhancements
- Minimize token usage`;

export const isEnhancementModePrompt = (prompt: string): boolean => {
  return prompt.includes('INSTANT_REPORT_PROMPT') && 
         prompt.includes('ENHANCEMENT MODE ACTIVE');
};