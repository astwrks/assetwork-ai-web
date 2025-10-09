/**
 * AssetWorks PrimeReact Theme Configuration
 * OFFICIAL BRAND COLORS from AssetWorks Brand Guidelines v2.0
 *
 * Source: AssetWorks Brand Guidelines 2025
 * All colors are exact matches from the official guidelines
 */

export const assetworksTheme = {
  // PRIMARY BRAND COLORS - Official from Guidelines
  primary: {
    navy: '#1B2951',      // PRIMARY NAVY - Main brand color ⭐
    selection: '#6C7B95',  // SELECTION BLUE-GRAY - Secondary elements ⭐
    lightGray: '#F8F9FA',  // SECONDARY LIGHT GRAY - Backgrounds ⭐
  },

  // ALERT/SEMANTIC COLORS - Official from Guidelines
  semantic: {
    success: '#28A745',    // SUCCESS GREEN ⭐
    warning: '#FD7E14',    // WARNING ORANGE ⭐
    danger: '#DC3545',     // DANGER RED ⭐
  },

  // TEXT COLORS - Official from Guidelines
  text: {
    heavy: '#2C3E50',      // HEAVY TEXT (Dark) ⭐
    light: '#FFFFFF',      // LIGHT TEXT (White) ⭐
  },

  // BORDER & NEUTRAL COLORS - Official from Guidelines
  borders: {
    gray10: '#E9ECEF',     // BORDER GRAY (10% Opacity equivalent) ⭐
    gray25: '#BDBCC2',     // BORDER GRAY 25% ⭐
    gray40: '#9B9CA3',     // BORDER GRAY 40% ⭐
    gray60: '#6D6E75',     // BORDER GRAY 60% ⭐
    gray80: '#4A4B52',     // BORDER GRAY 80% ⭐
  },

  // EXTENDED PALETTE - Official from Guidelines
  extended: {
    skyBlue: '#6CB4EE',    // SKY BLUE ⭐
    iceBlue: '#E8F4FD',    // ICE BLUE ⭐
    deepBlue: '#405D80',   // DEEP BLUE ⭐
  },

  // WHITE (for reference)
  white: '#FFFFFF',
};

// PrimeReact Design Token Configuration
export const primeReactConfig = {
  ripple: true,
  inputStyle: 'outlined',

  pt: {
    global: {
      css: `
        :root {
          /* PRIMARY BRAND COLORS */
          --primary-navy: ${assetworksTheme.primary.navy};
          --primary-selection: ${assetworksTheme.primary.selection};
          --primary-light-gray: ${assetworksTheme.primary.lightGray};

          /* PrimeReact Primary Scale (using brand navy) */
          --primary-50: #E8F4FD;   /* Ice Blue for very light states */
          --primary-100: #E8F4FD;
          --primary-200: #6CB4EE;  /* Sky Blue for lighter states */
          --primary-300: #6C7B95;  /* Selection Blue */
          --primary-400: #405D80;  /* Deep Blue */
          --primary-500: #1B2951;  /* PRIMARY NAVY - Main */
          --primary-600: #1B2951;  /* PRIMARY NAVY */
          --primary-700: #151F3D;  /* Darker variant */
          --primary-800: #0F1529;  /* Even darker */
          --primary-900: #0A0E1A;  /* Darkest */

          /* SEMANTIC COLORS */
          --success: ${assetworksTheme.semantic.success};
          --warning: ${assetworksTheme.semantic.warning};
          --danger: ${assetworksTheme.semantic.danger};

          /* SURFACE COLORS */
          --surface-0: #FFFFFF;
          --surface-50: ${assetworksTheme.primary.lightGray};
          --surface-100: ${assetworksTheme.borders.gray10};
          --surface-200: ${assetworksTheme.borders.gray25};
          --surface-300: ${assetworksTheme.borders.gray40};
          --surface-400: ${assetworksTheme.borders.gray60};
          --surface-500: ${assetworksTheme.borders.gray80};
          --surface-600: ${assetworksTheme.text.heavy};
          --surface-700: ${assetworksTheme.primary.selection};
          --surface-800: ${assetworksTheme.primary.navy};
          --surface-900: #0A0E1A;

          /* TEXT COLORS */
          --text-color: ${assetworksTheme.text.heavy};
          --text-color-secondary: ${assetworksTheme.primary.selection};
          --text-color-light: ${assetworksTheme.text.light};

          /* BORDER & FOCUS */
          --surface-border: ${assetworksTheme.borders.gray10};
          --focus-ring: 0 0 0 0.2rem rgba(27, 41, 81, 0.2);

          /* SPACING SCALE (from guidelines) */
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          --spacing-xxl: 48px;

          /* BORDER RADIUS (from guidelines) */
          --radius-sm: 4px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;

          /* COMPONENT SPECIFIC */
          --border-radius: 8px;
          --content-padding: 24px;
          --inline-spacing: 8px;
        }

        .dark {
          --surface-0: #0A0E1A;
          --surface-50: #0F1529;
          --surface-100: #151F3D;
          --surface-200: ${assetworksTheme.primary.navy};
          --surface-300: ${assetworksTheme.primary.selection};
          --surface-400: ${assetworksTheme.borders.gray80};
          --surface-500: ${assetworksTheme.borders.gray60};
          --surface-600: ${assetworksTheme.borders.gray40};
          --surface-700: ${assetworksTheme.borders.gray25};
          --surface-800: ${assetworksTheme.borders.gray10};
          --surface-900: ${assetworksTheme.primary.lightGray};

          --text-color: ${assetworksTheme.text.light};
          --text-color-secondary: ${assetworksTheme.borders.gray25};
          --surface-border: ${assetworksTheme.primary.selection};
        }
      `
    }
  }
};

// Semantic color mapping for financial context
export const semanticColors = {
  // Financial states
  profit: assetworksTheme.semantic.success,
  loss: assetworksTheme.semantic.danger,
  neutral: assetworksTheme.primary.selection,

  // Status indicators (from guidelines)
  success: assetworksTheme.semantic.success,
  warning: assetworksTheme.semantic.warning,
  error: assetworksTheme.semantic.danger,
  info: assetworksTheme.primary.navy,

  // Brand gradients (using official colors)
  gradients: {
    primary: `linear-gradient(135deg, ${assetworksTheme.primary.navy} 0%, ${assetworksTheme.primary.selection} 100%)`,
    accent: `linear-gradient(135deg, ${assetworksTheme.primary.navy} 0%, ${assetworksTheme.extended.deepBlue} 100%)`,
    premium: `linear-gradient(135deg, ${assetworksTheme.extended.deepBlue} 0%, ${assetworksTheme.primary.navy} 100%)`,
  }
};

// Typography configuration (from guidelines)
export const typography = {
  fontFamily: {
    primary: '"Euclid Circular A", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    h1: { size: '48px', lineHeight: '56px', weight: 700 },
    h2: { size: '36px', lineHeight: '44px', weight: 600 },
    h3: { size: '28px', lineHeight: '36px', weight: 500 },
    h4: { size: '24px', lineHeight: '32px', weight: 500 },
    h5: { size: '18px', lineHeight: '24px', weight: 600 },
    h6: { size: '16px', lineHeight: '22px', weight: 500 },
    bodyLarge: { size: '18px', lineHeight: '28px', weight: 400 },
    bodyMedium: { size: '16px', lineHeight: '24px', weight: 400 },
    bodySmall: { size: '14px', lineHeight: '20px', weight: 400 },
    caption: { size: '12px', lineHeight: '16px', weight: 400 },
  },
};

// Spacing scale (from guidelines)
export const spacing = {
  micro: '4px',    // Between related elements
  small: '8px',    // Component padding
  medium: '16px',  // Section padding
  large: '24px',   // Component margins
  xl: '32px',      // Section margins
  xxl: '48px',     // Page margins
};

// Border radius (from guidelines)
export const borderRadius = {
  small: '4px',   // Buttons, small elements
  medium: '8px',  // Cards, inputs
  large: '12px',  // Modals, large cards
  xl: '16px',     // Major containers
};
