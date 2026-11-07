import { useWindowDimensions } from 'react-native';

export type ScreenSize = 'compact' | 'medium' | 'expanded';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const size: ScreenSize = width >= 1000 ? 'expanded' : width >= 700 ? 'medium' : 'compact';
  const isTablet = width >= 700;
  const isExpanded = width >= 1000;
  const isLandscape = width > height;

  return {
    width,
    height,
    size,
    isTablet,
    isExpanded,
    isLandscape,
    gutters: isExpanded ? 40 : isTablet ? 32 : 20,
    contentWidth: Math.min(width - (isExpanded ? 80 : isTablet ? 64 : 40), 1120),
  };
}
