// lib/design-system.ts - AssetWorks Design System
// Based on official AssetWorks website analysis

export const AssetWorksDesign = {
  // Color Palette - Exact matches from AssetWorks website
  colors: {
    // Background colors
    background: {
      primary: '#ffffff',      // Main background
      secondary: '#f8fafc',    // Light gray sections
      tertiary: '#f1f5f9',     // Subtle background variations
    },
    
    // Text colors
    text: {
      primary: '#1a1a1a',      // Main headlines and primary text
      secondary: '#4b5563',    // Secondary text and descriptions
      tertiary: '#6b7280',     // Muted text and labels
      light: '#9ca3af',        // Light text and placeholders
    },
    
    // Brand colors
    brand: {
      primary: '#000000',      // AssetWorks primary black
      secondary: '#1e293b',    // Dark navy (footer)
      accent: '#3b82f6',       // Blue highlights
    },
    
    // Semantic colors
    success: '#10b981',        // Green for positive metrics
    warning: '#f59e0b',        // Amber for warnings
    error: '#ef4444',          // Red for errors
    info: '#3b82f6',           // Blue for info
    
    // Border colors
    border: {
      light: '#f3f4f6',        // Very light borders
      default: '#e5e7eb',      // Default border color
      medium: '#d1d5db',       // Medium borders
      dark: '#9ca3af',         // Dark borders
    },
    
    // Interactive colors
    interactive: {
      hover: '#f9fafb',        // Hover background
      selected: '#eff6ff',     // Selected state
      focus: '#dbeafe',        // Focus state
    }
  },
  
  // Typography - Based on AssetWorks hierarchy
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '4rem',     // 64px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
    }
  },
  
  // Spacing system - Based on AssetWorks layout
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    '5xl': '6rem',    // 96px
    '6xl': '8rem',    // 128px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    default: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows - AssetWorks card shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Grid and Layout
  layout: {
    container: {
      maxWidth: '1280px',     // Main container max-width
      padding: '1rem',        // Mobile padding
      paddingLg: '2rem',      // Desktop padding
    },
    
    grid: {
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
      },
      gap: {
        mobile: '1rem',
        desktop: '1.5rem',
      }
    }
  },
  
  // Component variants
  components: {
    button: {
      primary: {
        bg: '#000000',
        text: '#ffffff',
        hover: '#1f2937',
        focus: '#374151',
      },
      secondary: {
        bg: '#ffffff',
        text: '#374151',
        border: '#d1d5db',
        hover: '#f9fafb',
      },
      ghost: {
        bg: 'transparent',
        text: '#374151',
        hover: '#f3f4f6',
      }
    },
    
    card: {
      default: {
        bg: '#ffffff',
        border: '#e5e7eb',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        borderRadius: '0.5rem',
        padding: '1.5rem',
      },
      hover: {
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transform: 'translateY(-2px)',
      }
    },
    
    input: {
      default: {
        bg: '#ffffff',
        border: '#d1d5db',
        text: '#374151',
        placeholder: '#9ca3af',
        focus: {
          border: '#3b82f6',
          ring: '0 0 0 3px rgba(59, 130, 246, 0.1)',
        }
      }
    }
  },
  
  // Animation and transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
} as const;

// CSS Custom Properties for use in components
export const assetWorksCSSVars = `
  :root {
    /* Colors */
    --aw-bg-primary: ${AssetWorksDesign.colors.background.primary};
    --aw-bg-secondary: ${AssetWorksDesign.colors.background.secondary};
    --aw-text-primary: ${AssetWorksDesign.colors.text.primary};
    --aw-text-secondary: ${AssetWorksDesign.colors.text.secondary};
    --aw-brand-primary: ${AssetWorksDesign.colors.brand.primary};
    --aw-success: ${AssetWorksDesign.colors.success};
    --aw-border: ${AssetWorksDesign.colors.border.default};
    
    /* Typography */
    --aw-font-sans: ${AssetWorksDesign.typography.fontFamily.sans.join(', ')};
    
    /* Spacing */
    --aw-container-max-width: ${AssetWorksDesign.layout.container.maxWidth};
    
    /* Shadows */
    --aw-shadow-sm: ${AssetWorksDesign.boxShadow.sm};
    --aw-shadow: ${AssetWorksDesign.boxShadow.default};
    --aw-shadow-lg: ${AssetWorksDesign.boxShadow.lg};
    
    /* Animation */
    --aw-transition: all ${AssetWorksDesign.animation.duration.normal} ${AssetWorksDesign.animation.easing.default};
  }
`;

export default AssetWorksDesign;