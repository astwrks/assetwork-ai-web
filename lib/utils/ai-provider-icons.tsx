import React from 'react';
import * as SimpleIcons from 'simple-icons';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

// Custom SVG Icon component for Simple Icons
interface SVGIconProps {
  path: string;
  className?: string;
  fill?: string;
}

const SVGIcon: React.FC<SVGIconProps> = ({ path, className, fill = 'currentColor' }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill={fill}
  >
    <path d={path} />
  </svg>
);

// Brand icon components using official SVG paths
export const OpenAIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon path={SimpleIcons.siOpenai.path} className={className} />
);

export const AnthropicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon path={SimpleIcons.siAnthropic.path} className={className} />
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <SVGIcon path={SimpleIcons.siGoogle.path} className={className} />
);

export const GroqIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    {/* Groq-style chip/circuit icon */}
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.82 8 12 11.82 5.18 8 12 4.18zM5 9.82l6 3.35v6.65l-6-3.35V9.82zm8 10v-6.65l6-3.35v6.65l-6 3.35z" />
  </svg>
);

export interface ProviderConfig {
  name: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  displayName: string;
  brandColor: string; // Official brand color
}

export const AI_PROVIDER_CONFIG: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    displayName: 'OpenAI',
    icon: OpenAIIcon,
    color: 'text-[#10A37F]',
    bgColor: 'bg-[#10A37F]/10',
    brandColor: '#10A37F', // OpenAI green
  },
  anthropic: {
    name: 'Anthropic',
    displayName: 'Claude (Anthropic)',
    icon: AnthropicIcon,
    color: 'text-[#D4A574]',
    bgColor: 'bg-[#D4A574]/10',
    brandColor: '#D4A574', // Anthropic sand/beige
  },
  google: {
    name: 'Google',
    displayName: 'Google Gemini',
    icon: GoogleIcon,
    color: 'text-[#4285F4]',
    bgColor: 'bg-[#4285F4]/10',
    brandColor: '#4285F4', // Google blue
  },
  groq: {
    name: 'Groq',
    displayName: 'Groq',
    icon: GroqIcon,
    color: 'text-[#F55036]',
    bgColor: 'bg-[#F55036]/10',
    brandColor: '#F55036', // Groq orange-red
  },
};

// Fallback icon component
const FallbackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function getProviderIcon(provider: string): ProviderConfig {
  const config = AI_PROVIDER_CONFIG[provider as AIProvider];
  return config || {
    name: provider,
    displayName: provider.charAt(0).toUpperCase() + provider.slice(1),
    icon: FallbackIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10',
    brandColor: '#6B7280',
  };
}
