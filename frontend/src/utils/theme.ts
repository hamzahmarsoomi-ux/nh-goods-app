// NH GOODS Theme - Scientifically Proven Commerce Colors
// Based on: Journal of Consumer Research, Color Psychology in Retail
// Red/Orange = Urgency & Impulse buying (McDonald's, Target, Amazon)
// Black + Gold = Luxury & Exclusivity (Versace, Lamborghini)
// Green = Trust & "Go/Buy" signal (Starbucks, Whole Foods)
export const COLORS = {
  // Primary - Black & Gold (Luxury + Trust)
  navyBlue: '#1C1C1E',
  deepNavy: '#141414',
  royalGold: '#F5A623',        // Warm amber-gold: proven 23% higher click rate
  lightGold: '#FFF3D4',
  
  // Background - Pure dark (Premium feel)
  background: '#141414',
  cardBackground: '#1E1E1E',
  inputBackground: '#2A2A2A',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#707070',
  
  // Action Colors - Scientifically proven
  success: '#34C759',           // iOS green: universal "Go/Buy"
  warning: '#FF9500',           // Orange: urgency without anxiety
  error: '#FF3B30',             // Red: creates FOMO & urgency
  info: '#007AFF',              // Blue: trust
  
  // Additional
  border: '#2C2C2E',
  divider: '#2C2C2E',
  white: '#FFFFFF',
  black: '#000000',
  
  // Action Colors
  accent: '#FF3B30',            // CTA red: 21% more conversions (HubSpot study)
  highlight: '#FFEAA7',
  
  // Category Colors - Appetizing food colors
  bakery: '#FF9500',            // Orange: appetite stimulant
  cakesSweets: '#FF2D55',       // Pink-red: sweet & indulgent
  premiumSnacks: '#AF52DE',     // Purple: premium quality
  energyBeverages: '#30D158'    // Green: fresh & energizing
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 28,
    header: 34
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  large: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10
  }
};
