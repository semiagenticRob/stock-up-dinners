// Stock Up Dinners brand palette
// Primary: deep green (warehouse/fresh food feel)
// Accent: warm amber (appetite/warmth)

const brand = {
  green900: '#1B5E20',
  green700: '#2E7D32',
  green500: '#4CAF50',
  green100: '#E8F5E9',
  amber700: '#FF8F00',
  amber500: '#FFC107',
  amber100: '#FFF8E1',
  red600: '#E53935',
  red100: '#FFEBEE',
  yellow600: '#FDD835',
  yellow100: '#FFFDE7',
};

export default {
  brand,
  light: {
    text: '#1A1A1A',
    textSecondary: '#666666',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    border: '#E0E0E0',
    tint: brand.green700,
    tabIconDefault: '#9E9E9E',
    tabIconSelected: brand.green700,
    perishableRed: brand.red600,
    perishableYellow: brand.yellow600,
    perishableGreen: brand.green500,
  },
  dark: {
    text: '#FAFAFA',
    textSecondary: '#BDBDBD',
    background: '#121212',
    surface: '#1E1E1E',
    border: '#333333',
    tint: brand.green500,
    tabIconDefault: '#757575',
    tabIconSelected: brand.green500,
    perishableRed: brand.red600,
    perishableYellow: brand.yellow600,
    perishableGreen: brand.green500,
  },
};
