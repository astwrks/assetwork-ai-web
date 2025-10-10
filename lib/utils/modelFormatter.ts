/**
 * Format model names by removing date suffixes and version numbers
 * to make them more user-friendly
 *
 * Examples:
 * - "claude-3-5-sonnet-20241022" → "claude-3-5-sonnet"
 * - "claude-3-opus-20240229" → "claude-3-opus"
 * - "gpt-4-turbo-2024-04-09" → "gpt-4-turbo"
 * - "gemini-1.5-pro-20240514" → "gemini-1.5-pro"
 */
export function formatModelName(modelName: string | undefined): string {
  if (!modelName) return '';

  // Remove date suffixes in format: -YYYYMMDD or -YYYY-MM-DD
  return modelName.replace(/-\d{8}$/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

/**
 * Format model name to a more human-readable display name
 *
 * Examples:
 * - "claude-3-5-sonnet" → "Claude 3.5 Sonnet"
 * - "gpt-4-turbo" → "GPT-4 Turbo"
 * - "gemini-1.5-pro" → "Gemini 1.5 Pro"
 */
export function formatModelNamePretty(modelName: string | undefined): string {
  if (!modelName) return '';

  // First remove date suffixes
  const cleaned = formatModelName(modelName);

  // Split by hyphens and capitalize each word
  const words = cleaned.split('-');

  return words
    .map((word) => {
      // Handle special cases
      if (word.toLowerCase() === 'gpt') return 'GPT';
      if (word.match(/^\d/)) return word; // Keep numbers as-is

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
