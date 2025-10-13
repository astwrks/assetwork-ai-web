/**
 * AI Model Pricing Calculator
 * Prices are per 1M tokens (as of 2025)
 */

export interface ModelPricing {
  input: number; // Price per 1M input tokens
  output: number; // Price per 1M output tokens
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude
  'claude-3-5-sonnet-20241022': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-5-sonnet-20240620': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-opus-20240229': {
    input: 15.00,
    output: 75.00,
  },
  'claude-3-sonnet-20240229': {
    input: 3.00,
    output: 15.00,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
  },
  
  // OpenAI GPT-4
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-4': {
    input: 30.00,
    output: 60.00,
  },
  'gpt-4-32k': {
    input: 60.00,
    output: 120.00,
  },
  
  // OpenAI GPT-3.5
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },
  'gpt-3.5-turbo-16k': {
    input: 3.00,
    output: 4.00,
  },
};

export interface UsageCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  provider: string;
}

/**
 * Calculate cost for AI model usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): UsageCalculation {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-3-5-sonnet-20241022'];
  
  // Calculate costs (pricing is per 1M tokens)
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  // Determine provider
  let provider = 'anthropic';
  if (model.startsWith('gpt-')) {
    provider = 'openai';
  } else if (model.startsWith('claude-')) {
    provider = 'anthropic';
  }
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    inputCost,
    outputCost,
    totalCost,
    model,
    provider,
  };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}
