import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FestivalTheme =
  | 'default'
  | 'premium-dark'
  | 'sustainable'
  | 'diwali'
  | 'holi'
  | 'dussehra'
  | 'ganesh'
  | 'navratri'
  | 'karva-chauth'
  | 'onam'
  | 'eid'
  | 'christmas';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

const festivalThemes: Record<FestivalTheme, ThemeColors> = {
  default: {
    primary: '#18181B', // Zinc 900
    secondary: '#F4F4F5', // Zinc 100
    accent: '#E4E4E7', // Zinc 200
    background: '#FAFAFA', // Ultra light gray/off-white
    foreground: '#09090B' // Zinc 950
  },
  'premium-dark': {
    primary: '#FAFAFA', // Off-white text on dark
    secondary: '#27272A', // Zinc 800
    accent: '#3F3F46', // Zinc 700
    background: '#09090B', // Zinc 950
    foreground: '#FAFAFA' // Off-white
  },
  sustainable: {
    primary: '#16a34a', // Forest green
    secondary: '#84cc16', // Lime green
    accent: '#22c55e', // Green
    background: '#f0fdf4', // Very light green
    foreground: '#14532d' // Dark green
  },
  diwali: {
    primary: '#dc2626', // Deep red
    secondary: '#fbbf24', // Golden yellow
    accent: '#f59e0b',
    background: '#fef3c7',
    foreground: '#7c2d12'
  },
  holi: {
    primary: '#ec4899', // Vibrant pink
    secondary: '#06d6a0', // Bright green
    accent: '#ffbe0b',
    background: '#fdf4ff',
    foreground: '#831843'
  },
  dussehra: {
    primary: '#dc2626', // Victory red
    secondary: '#fbbf24', // Royal gold
    accent: '#059669',
    background: '#fff7ed',
    foreground: '#7c2d12'
  },
  ganesh: {
    primary: '#f59e0b', // Saffron
    secondary: '#dc2626', // Sacred red
    accent: '#10b981',
    background: '#fffbeb',
    foreground: '#78350f'
  },
  navratri: {
    primary: '#7c3aed', // Royal purple
    secondary: '#ec4899', // Bright pink
    accent: '#fbbf24',
    background: '#faf5ff',
    foreground: '#581c87'
  },
  'karva-chauth': {
    primary: '#dc2626', // Married red
    secondary: '#fbbf24', // Prosperity gold
    accent: '#f97316',
    background: '#fff1f2',
    foreground: '#7f1d1d'
  },
  onam: {
    primary: '#059669', // Kerala green
    secondary: '#fbbf24', // Prosperity gold
    accent: '#dc2626',
    background: '#f0fdf4',
    foreground: '#14532d'
  },
  eid: {
    primary: '#059669', // Islamic green
    secondary: '#fbbf24', // Crescent gold
    accent: '#0ea5e9',
    background: '#f0fdf4',
    foreground: '#14532d'
  },
  christmas: {
    primary: '#dc2626', // Christmas red
    secondary: '#059669', // Christmas green
    accent: '#fbbf24',
    background: '#fefefe',
    foreground: '#0f172a'
  }
};

const festivalNames = {
  default: { en: 'Sleek Light', hi: 'स्लीक लाइट', ml: 'സ്ലീക് ലൈറ്റ്' },
  'premium-dark': { en: 'Sleek Dark', hi: 'स्लीक डार्क', ml: 'സ്ലീക് ഡാർക്ക്' },
  sustainable: { en: 'Sustainable', hi: 'संरक्षण', ml: 'സാന്തോഷം' },
  diwali: { en: 'Diwali', hi: 'दिवाली', ml: 'ദീപാവലി' },
  holi: { en: 'Holi', hi: 'होली', ml: 'ഹോളി' },
  dussehra: { en: 'Dussehra', hi: 'दशहरा', ml: 'ദശഹര' },
  ganesh: { en: 'Ganesh Chaturthi', hi: 'गणेश चतुर्थी', ml: 'ഗണേശ് ചതുർത്ഥി' },
  navratri: { en: 'Navratri', hi: 'नवरात्रि', ml: 'നവരാത്രി' },
  'karva-chauth': { en: 'Karva Chauth', hi: 'करवा चौथ', ml: 'കർവ ചൗത്ത്' },
  onam: { en: 'Onam', hi: 'ओणम', ml: 'ഓണം' },
  eid: { en: 'Eid', hi: 'ईद', ml: 'ഈദ്' },
  christmas: { en: 'Christmas', hi: 'क्रिसमस', ml: 'ക്രിസ്മസ്' }
};

interface ThemeContextType {
  theme: FestivalTheme;
  setTheme: (theme: FestivalTheme) => void;
  colors: ThemeColors;
  getFestivalName: (theme: FestivalTheme, language: string) => string;
  availableThemes: FestivalTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<FestivalTheme>('default');
  const colors = festivalThemes[theme];

  const getFestivalName = (theme: FestivalTheme, language: string = 'en') => {
    const names = festivalNames[theme];
    return names[language as keyof typeof names] || names.en;
  };

  const availableThemes: FestivalTheme[] = Object.keys(festivalThemes) as FestivalTheme[];

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Convert hex to oklch for better color management
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgbToOklch = (r: number, g: number, b: number) => {
      // Simple approximation - in production you'd use a proper color conversion library
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;

      const lightness = Math.sqrt(0.299 * rNorm * rNorm + 0.587 * gNorm * gNorm + 0.114 * bNorm * bNorm);
      return `${lightness.toFixed(3)} 0.1 ${Math.atan2(gNorm - rNorm, bNorm - gNorm) * 180 / Math.PI}`;
    };

    // Apply primary color
    const primaryRgb = hexToRgb(colors.primary);
    if (primaryRgb) {
      const primaryOklch = rgbToOklch(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      root.style.setProperty('--primary', `oklch(${primaryOklch})`);
    }

    // Apply secondary color
    const secondaryRgb = hexToRgb(colors.secondary);
    if (secondaryRgb) {
      const secondaryOklch = rgbToOklch(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      root.style.setProperty('--secondary', `oklch(${secondaryOklch})`);
    }

    // Apply background
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);

  }, [theme, colors]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      colors,
      getFestivalName,
      availableThemes
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
