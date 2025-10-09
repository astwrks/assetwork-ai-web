// AssetWorks Unified Design System
// Professional Financial Platform Theme

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#0066FF', // Main brand blue
    700: '#0052CC',
    800: '#003D99',
    900: '#001A3D', // Dark blue for text
  },
  
  // Financial Indicators
  market: {
    bull: '#00C851', // Green for positive
    bear: '#FF4444', // Red for negative
    neutral: '#FFB700', // Amber for neutral
    info: '#33B5E5', // Light blue for info
  },
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    dark: '#0A0E1A',
    darkCard: '#1A1F2E',
    darkBorder: '#2A3441',
  },
  
  // Text Colors
  text: {
    primary: '#001A3D',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    muted: '#6B7280',
  },
  
  // Accent Colors
  accent: {
    purple: '#7C3AED',
    teal: '#14B8A6',
    orange: '#FB923C',
    pink: '#EC4899',
    indigo: '#6366F1',
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: '"IBM Plex Mono", "SF Mono", Consolas, monospace',
    display: 'Inter, system-ui, sans-serif',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(0, 102, 255, 0.3)',
};

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Utility function to generate consistent class names
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Financial number formatter
export const formatNumber = (value: number, options?: {
  style?: 'currency' | 'percent' | 'decimal';
  currency?: string;
  decimals?: number;
  compact?: boolean;
}) => {
  const {
    style = 'decimal',
    currency = 'USD',
    decimals = 2,
    compact = false,
  } = options || {};
  
  if (compact && Math.abs(value) >= 1000) {
    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    const scaledValue = value / Math.pow(1000, unitIndex);
    return `${scaledValue.toFixed(1)}${units[unitIndex]}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style,
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Market color utility
export const getMarketColor = (value: number): string => {
  if (value > 0) return colors.market.bull;
  if (value < 0) return colors.market.bear;
  return colors.market.neutral;
};

// Dark mode utility
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
};

// Component variants
export const variants = {
  button: {
    primary: `bg-blue-600 text-primary-foreground hover:bg-blue-700 active:bg-blue-800`,
    secondary: `bg-muted text-foreground hover:bg-accent active:bg-gray-300`,
    danger: `bg-red-600 text-primary-foreground hover:bg-red-700 active:bg-red-800`,
    success: `bg-green-600 text-primary-foreground hover:bg-green-700 active:bg-green-800`,
    ghost: `bg-transparent hover:bg-muted active:bg-accent`,
  },
  
  card: {
    default: `bg-background rounded-xl shadow-md border border-border`,
    elevated: `bg-background rounded-xl shadow-lg border border-gray-100`,
    flat: `bg-muted rounded-xl border border-border`,
    dark: `bg-background rounded-xl shadow-xl border border-border`,
  },
  
  input: {
    default: `border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`,
    error: `border border-red-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500`,
    success: `border border-green-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500`,
  },
};

// Export theme object for use with styled-components or emotion
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  breakpoints,
  variants,
};

export default theme;