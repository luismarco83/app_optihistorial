import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isTablet = width >= 768 || height >= 768;

export const scale = (size) => {
  const baseWidth = 375; // iPhone reference
  return Math.round((width / baseWidth) * size);
};

export const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

export const spacing = {
  xs: isTablet ? 8 : 4,
  sm: isTablet ? 12 : 8,
  md: isTablet ? 20 : 16,
  lg: isTablet ? 28 : 24,
  xl: isTablet ? 40 : 32,
};

export const fontSize = {
  sm: isTablet ? 15 : 13,
  md: isTablet ? 17 : 15,
  lg: isTablet ? 20 : 17,
  xl: isTablet ? 26 : 22,
  title: isTablet ? 28 : 22,
};
