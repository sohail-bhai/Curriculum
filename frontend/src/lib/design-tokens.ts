/**
 * Design Tokens — centralized design system definitions
 * Used across all components for consistency
 */

export const DesignTokens = {
  // ── Color Palette ────────────────────────────────────────────────
  colors: {
    // Primary
    primary: '#2563eb',
    primary_50: '#eff6ff',
    primary_100: '#dbeafe',
    primary_600: '#1d4ed8',
    primary_700: '#1e40af',
    primary_900: '#1e3a8a',

    // Status
    success: '#16a34a',
    success_50: '#f0fdf4',
    success_100: '#dcfce7',
    success_700: '#15803d',

    warning: '#d97706',
    warning_50: '#fffbeb',
    warning_100: '#fef3c7',
    warning_700: '#a16207',

    error: '#dc2626',
    error_50: '#fef2f2',
    error_100: '#fee2e2',
    error_700: '#b91c1c',

    info: '#0369a1',
    info_50: '#f0f9ff',
    info_100: '#e0f2fe',
    info_700: '#0c4a6e',

    // Neutral
    navy: '#0f172a',
    navy_50: '#f8fafc',
    navy_100: '#f1f5f9',
    navy_200: '#e2e8f0',
    navy_500: '#64748b',
    navy_600: '#475569',
    navy_700: '#334155',
    navy_900: '#111827',

    white: '#ffffff',
    black: '#000000',

    // Semantic variants
    gray_50: '#f9fafb',
    gray_100: '#f3f4f6',
    gray_200: '#e5e7eb',
    gray_300: '#d1d5db',
    gray_400: '#9ca3af',
    gray_500: '#6b7280',
    gray_600: '#4b5563',
    gray_700: '#374151',
    gray_800: '#1f2937',
    gray_900: '#111827',
  },

  // ── Typography ──────────────────────────────────────────────────
  typography: {
    // Font families
    fontFamily: {
      base: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Source Code Pro", "Monaco", "Courier New", monospace',
    },

    // Font sizes
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },

    // Font weights
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.625,
      loose: 1.75,
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.02em',
      wider: '0.05em',
    },
  },

  // ── Spacing Scale ────────────────────────────────────────────────
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    '4xl': '48px',
    '5xl': '64px',
  },

  // ── Border Radius ───────────────────────────────────────────────
  borderRadius: {
    none: '0',
    sm: '2px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '999px',
  },

  // ── Shadows ──────────────────────────────────────────────────────
  shadow: {
    none: 'none',
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
    base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },

  // ── Z-Index Scale ───────────────────────────────────────────────
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    backdrop: '1040',
    offcanvas: '1050',
    modal: '1060',
    popover: '1070',
    tooltip: '1080',
  },

  // ── Layout Dimensions ───────────────────────────────────────────
  layout: {
    sidebarWidth: '260px',
    sidebarWidthCollapsed: '80px',
    headerHeight: '64px',
    headerHeightMobile: '56px',
  },

  // ── Transitions ──────────────────────────────────────────────────
  transition: {
    fast: '0.08s ease-in-out',
    base: '0.15s ease-in-out',
    slow: '0.2s ease-in-out',
    slower: '0.3s ease-in-out',
  },

  // ── Button Styles ────────────────────────────────────────────────
  button: {
    sizes: {
      sm: {
        padding: '5px 10px',
        fontSize: '12px',
        lineHeight: 1.4,
      },
      md: {
        padding: '8px 16px',
        fontSize: '14px',
        lineHeight: 1.5,
      },
      lg: {
        padding: '12px 24px',
        fontSize: '15px',
        lineHeight: 1.5,
      },
    },
  },

  // ── Form Styles ──────────────────────────────────────────────────
  form: {
    input: {
      padding: '10px 12px',
      fontSize: '14px',
      borderRadius: '6px',
      borderColor: '#e5e7eb',
      focusBorderColor: '#2563eb',
      focusRingColor: 'rgba(37, 99, 235, 0.1)',
    },
    label: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#334155',
      marginBottom: '6px',
    },
  },

  // ── Breakpoints ──────────────────────────────────────────────────
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export default DesignTokens;
