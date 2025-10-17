/**
 * API Key Connection Testing Service
 * Tests API keys for various providers and returns detailed error information
 */

import { decryptApiKey } from '@/lib/utils/encryption';

interface ConnectionTestResult {
  success: boolean;
  status: 'connected' | 'error';
  message: string;
  errorType?: 'auth' | 'network' | 'rate_limit' | 'invalid_format' | 'unknown';
  errorDetails?: string;
  suggestedFix?: string;
  providerDocUrl?: string;
}

export class ApiKeyConnectionTestService {
  /**
   * Test API key connection for any supported provider
   */
  static async testConnection(
    provider: string,
    encryptedKey: string
  ): Promise<ConnectionTestResult> {
    // Decrypt the key first
    const apiKey = await this.decryptKey(encryptedKey);

    switch (provider.toLowerCase()) {
      case 'alpha_vantage':
        return this.testAlphaVantage(apiKey);
      case 'coingecko':
        return this.testCoinGecko(apiKey);
      case 'polygon':
        return this.testPolygon(apiKey);
      case 'openai':
        return this.testOpenAI(apiKey);
      case 'anthropic':
        return this.testAnthropic(apiKey);
      case 'google':
        return this.testGoogle(apiKey);
      default:
        return {
          success: false,
          status: 'error',
          message: 'Unsupported provider',
          errorType: 'unknown',
          errorDetails: `Provider "${provider}" is not supported for connection testing`,
        };
    }
  }

  /**
   * Test Alpha Vantage API key
   */
  private static async testAlphaVantage(apiKey: string): Promise<ConnectionTestResult> {
    try {
      // Validate key format
      if (!apiKey || apiKey.length < 10) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key format',
          errorType: 'invalid_format',
          errorDetails: 'Alpha Vantage API key should be at least 10 characters',
          suggestedFix: 'Get a valid API key from Alpha Vantage',
          providerDocUrl: 'https://www.alphavantage.co/support/#api-key',
        };
      }

      // Test with a simple quote endpoint
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${apiKey}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }
      );

      const data = await response.json();

      // Check for rate limit
      if (data.Note || data['Information']) {
        return {
          success: false,
          status: 'error',
          message: 'API rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: data.Note || data['Information'],
          suggestedFix: 'Wait 60 seconds or upgrade to a premium plan',
          providerDocUrl: 'https://www.alphavantage.co/premium/',
        };
      }

      // Check for authentication error
      if (data['Error Message'] || data['error']) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: data['Error Message'] || data['error'],
          suggestedFix: 'Verify your API key at Alpha Vantage dashboard',
          providerDocUrl: 'https://www.alphavantage.co/support/#api-key',
        };
      }

      // Check for successful response
      if (data['Global Quote']) {
        return {
          success: true,
          status: 'connected',
          message: 'Connection successful',
        };
      }

      return {
        success: false,
        status: 'error',
        message: 'Unexpected response from API',
        errorType: 'unknown',
        errorDetails: JSON.stringify(data),
      };
    } catch (error: any) {
      return this.handleNetworkError('Alpha Vantage', error);
    }
  }

  /**
   * Test CoinGecko API key
   */
  private static async testCoinGecko(apiKey: string): Promise<ConnectionTestResult> {
    try {
      // CoinGecko has both free (no key) and pro (with key) tiers
      const headers: Record<string, string> = {};
      if (apiKey && apiKey !== 'demo') {
        headers['x-cg-pro-api-key'] = apiKey;
      }

      const response = await fetch(
        'https://api.coingecko.com/api/v3/ping',
        {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.status === 401) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: 'API key authentication failed',
          suggestedFix: 'Verify your API key at CoinGecko dashboard',
          providerDocUrl: 'https://www.coingecko.com/en/api/pricing',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          status: 'error',
          message: 'Rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: 'Too many requests. Rate limit reached.',
          suggestedFix: 'Wait a few minutes or upgrade your plan',
          providerDocUrl: 'https://www.coingecko.com/en/api/pricing',
        };
      }

      if (response.ok) {
        const data = await response.json();
        if (data.gecko_says) {
          return {
            success: true,
            status: 'connected',
            message: 'Connection successful',
          };
        }
      }

      return {
        success: false,
        status: 'error',
        message: 'Unexpected response from API',
        errorType: 'unknown',
        errorDetails: `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error: any) {
      return this.handleNetworkError('CoinGecko', error);
    }
  }

  /**
   * Test Polygon.io API key
   */
  private static async testPolygon(apiKey: string): Promise<ConnectionTestResult> {
    try {
      if (!apiKey || apiKey.length < 10) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key format',
          errorType: 'invalid_format',
          errorDetails: 'Polygon API key should be at least 10 characters',
          suggestedFix: 'Get a valid API key from Polygon.io',
          providerDocUrl: 'https://polygon.io/dashboard/api-keys',
        };
      }

      // Test with ticker endpoint
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?apiKey=${apiKey}&limit=1`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: data.error || data.message || 'Authentication failed',
          suggestedFix: 'Verify your API key at Polygon.io dashboard',
          providerDocUrl: 'https://polygon.io/dashboard/api-keys',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          status: 'error',
          message: 'Rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: data.error || 'Too many requests',
          suggestedFix: 'Wait a moment or upgrade your plan',
          providerDocUrl: 'https://polygon.io/pricing',
        };
      }

      if (response.ok && data.results) {
        return {
          success: true,
          status: 'connected',
          message: 'Connection successful',
        };
      }

      return {
        success: false,
        status: 'error',
        message: 'Unexpected response from API',
        errorType: 'unknown',
        errorDetails: data.error || data.message || `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return this.handleNetworkError('Polygon.io', error);
    }
  }

  /**
   * Test OpenAI API key
   */
  private static async testOpenAI(apiKey: string): Promise<ConnectionTestResult> {
    try {
      if (!apiKey || !apiKey.startsWith('sk-')) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key format',
          errorType: 'invalid_format',
          errorDetails: 'OpenAI API keys must start with "sk-"',
          suggestedFix: 'Get a valid API key from OpenAI dashboard',
          providerDocUrl: 'https://platform.openai.com/api-keys',
        };
      }

      const response = await fetch(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.status === 401) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: 'API key authentication failed',
          suggestedFix: 'Verify your API key at OpenAI dashboard',
          providerDocUrl: 'https://platform.openai.com/api-keys',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          status: 'error',
          message: 'Rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: 'Too many requests or quota exceeded',
          suggestedFix: 'Wait a moment or check your quota',
          providerDocUrl: 'https://platform.openai.com/account/limits',
        };
      }

      if (response.ok) {
        return {
          success: true,
          status: 'connected',
          message: 'Connection successful',
        };
      }

      const data = await response.json();
      return {
        success: false,
        status: 'error',
        message: 'API request failed',
        errorType: 'unknown',
        errorDetails: data.error?.message || `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return this.handleNetworkError('OpenAI', error);
    }
  }

  /**
   * Test Anthropic API key
   */
  private static async testAnthropic(apiKey: string): Promise<ConnectionTestResult> {
    try {
      // Skip format validation - let the API tell us what's wrong
      const trimmedKey = apiKey?.trim() || '';

      console.error('[Anthropic Test] Key length:', trimmedKey.length);
      console.error('[Anthropic Test] Key prefix:', trimmedKey.substring(0, 15));

      // Test with a minimal message
      const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': trimmedKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      console.error('[Anthropic Test] Response status:', response.status);

      // Get response data for all non-success cases
      let data: any = null;
      try {
        if (!response.ok) {
          data = await response.json();
          console.error('[Anthropic Test] Error response:', JSON.stringify(data));
        }
      } catch (e) {
        console.error('[Anthropic Test] Could not parse error response');
      }

      if (response.status === 401) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: data?.error?.message || data?.message || 'API key authentication failed',
          suggestedFix: 'Verify your API key at Anthropic Console',
          providerDocUrl: 'https://console.anthropic.com/settings/keys',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          status: 'error',
          message: 'Rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: data?.error?.message || 'Too many requests',
          suggestedFix: 'Wait a moment or check your usage limits',
          providerDocUrl: 'https://console.anthropic.com/settings/limits',
        };
      }

      if (response.ok) {
        return {
          success: true,
          status: 'connected',
          message: 'Connection successful',
        };
      }

      return {
        success: false,
        status: 'error',
        message: 'API request failed',
        errorType: 'unknown',
        errorDetails: data?.error?.message || data?.message || `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return this.handleNetworkError('Anthropic', error);
    }
  }

  /**
   * Test Google AI API key
   */
  private static async testGoogle(apiKey: string): Promise<ConnectionTestResult> {
    try {
      if (!apiKey || apiKey.length < 20) {
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key format',
          errorType: 'invalid_format',
          errorDetails: 'Google AI API key appears to be invalid',
          suggestedFix: 'Get a valid API key from Google AI Studio',
          providerDocUrl: 'https://makersuite.google.com/app/apikey',
        };
      }

      // Test with models list endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        const data = await response.json();
        return {
          success: false,
          status: 'error',
          message: 'Invalid API key',
          errorType: 'auth',
          errorDetails: data.error?.message || 'Authentication failed',
          suggestedFix: 'Verify your API key at Google AI Studio',
          providerDocUrl: 'https://makersuite.google.com/app/apikey',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          status: 'error',
          message: 'Rate limit exceeded',
          errorType: 'rate_limit',
          errorDetails: 'Too many requests',
          suggestedFix: 'Wait a moment or check your quota',
          providerDocUrl: 'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas',
        };
      }

      if (response.ok) {
        return {
          success: true,
          status: 'connected',
          message: 'Connection successful',
        };
      }

      const data = await response.json();
      return {
        success: false,
        status: 'error',
        message: 'API request failed',
        errorType: 'unknown',
        errorDetails: data.error?.message || `HTTP ${response.status}`,
      };
    } catch (error: any) {
      return this.handleNetworkError('Google AI', error);
    }
  }

  /**
   * Handle network errors
   */
  private static handleNetworkError(provider: string, error: any): ConnectionTestResult {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        success: false,
        status: 'error',
        message: 'Connection timeout',
        errorType: 'network',
        errorDetails: `Request to ${provider} API timed out after 10 seconds`,
        suggestedFix: 'Check your internet connection or try again later',
      };
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        success: false,
        status: 'error',
        message: 'Network error',
        errorType: 'network',
        errorDetails: `Could not connect to ${provider} API`,
        suggestedFix: 'Check your internet connection and firewall settings',
      };
    }

    return {
      success: false,
      status: 'error',
      message: 'Connection test failed',
      errorType: 'unknown',
      errorDetails: error.message || 'Unknown error occurred',
      suggestedFix: 'Try again or contact support if the issue persists',
    };
  }

  /**
   * Decrypt encrypted API key
   */
  private static async decryptKey(encryptedKey: string): Promise<string> {
    try {
      if (!encryptedKey || encryptedKey.trim() === '') {
        console.error('[Decryption] Empty or invalid encrypted key provided');
        return '';
      }

      console.error('[Decryption] Starting decryption, encrypted length:', encryptedKey.length);
      const decrypted = decryptApiKey(encryptedKey);

      if (!decrypted || decrypted.trim() === '') {
        console.error('[Decryption] Decryption returned empty string');
        return '';
      }

      console.error('[Decryption] Success! Decrypted key length:', decrypted.length);
      console.error('[Decryption] Decrypted key starts with:', decrypted.substring(0, 10));
      return decrypted.trim();
    } catch (error) {
      console.error('[Decryption] Failed to decrypt API key:', error);
      console.error('[Decryption] Encrypted key length:', encryptedKey?.length);
      console.error('[Decryption] Encrypted key preview:', encryptedKey?.substring(0, 20));
      return '';
    }
  }
}
