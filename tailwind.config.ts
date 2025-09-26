import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // AssetWorks Brand Colors
      colors: {
        // Background colors
        'aw-bg': {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
        
        // Text colors
        'aw-text': {
          primary: '#1a1a1a',
          secondary: '#4b5563',
          tertiary: '#6b7280',
          light: '#9ca3af',
        },
        
        // Brand colors
        'aw-brand': {
          primary: '#000000',
          secondary: '#1e293b',
          accent: '#3b82f6',
        },
        
        // Semantic colors
        'aw-success': '#10b981',
        'aw-warning': '#f59e0b',
        'aw-error': '#ef4444',
        'aw-info': '#3b82f6',
        
        // Border colors
        'aw-border': {
          light: '#f3f4f6',
          DEFAULT: '#e5e7eb',
          medium: '#d1d5db',
          dark: '#9ca3af',
        },
        
        // Interactive colors
        'aw-interactive': {
          hover: '#f9fafb',
          selected: '#eff6ff',
          focus: '#dbeafe',
        },

        // Keep existing shadcn colors for compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      
      // AssetWorks Typography
      fontFamily: {
        'aw-sans': ['Inter', 'system-ui', 'sans-serif'],
        'aw-mono': ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      
      // AssetWorks Spacing
      spacing: {
        'aw-xs': '0.25rem',
        'aw-sm': '0.5rem',
        'aw-md': '0.75rem',
        'aw-lg': '1rem',
        'aw-xl': '1.5rem',
        'aw-2xl': '2rem',
        'aw-3xl': '3rem',
        'aw-4xl': '4rem',
        'aw-5xl': '6rem',
        'aw-6xl': '8rem',
      },
      
      // AssetWorks Border Radius
      borderRadius: {
        'aw-sm': '0.125rem',
        'aw-default': '0.25rem',
        'aw-md': '0.375rem',
        'aw-lg': '0.5rem',
        'aw-xl': '0.75rem',
        'aw-2xl': '1rem',
        'aw-3xl': '1.5rem',
        
        // Keep existing
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // AssetWorks Box Shadows
      boxShadow: {
        'aw-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'aw-default': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'aw-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'aw-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'aw-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // AssetWorks Container
      maxWidth: {
        'aw-container': '1280px',
      },
      
      // AssetWorks Animation
      transitionDuration: {
        'aw-fast': '150ms',
        'aw-normal': '200ms',
        'aw-slow': '300ms',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
export default config;