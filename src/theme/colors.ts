export type ColorScheme = 'light' | 'dark';

export interface Palette {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceTint: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  accentText: string;
  sage: string;
  sageSoft: string;
  gold: string;
  goldSoft: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
  overlay: string;
  tabBar: string;
  placeholder: string;
  micIdle: string;
  micActive: string;
  waveform: string;
  waveformMuted: string;
}

const light: Palette = {
  background: '#F5EFE4',
  backgroundAlt: '#EFE6D7',
  surface: '#FFFBF3',
  surfaceRaised: '#FFFDF8',
  surfaceMuted: '#EEE5D6',
  surfaceTint: '#F7E4DA',
  text: '#2D2A24',
  textSecondary: '#6E675C',
  textTertiary: '#978E7F',
  border: '#E4D9C8',
  borderStrong: '#D0C1AA',
  accent: '#C25E46',
  accentPressed: '#A94B36',
  accentSoft: '#F4DCD2',
  accentText: '#FFF9F3',
  sage: '#718467',
  sageSoft: '#E3EADB',
  gold: '#B3833B',
  goldSoft: '#F3E4C5',
  danger: '#B34E4E',
  dangerSoft: '#F3DADA',
  shadow: '#3B3024',
  overlay: 'rgba(34, 28, 21, 0.38)',
  tabBar: 'rgba(255, 251, 243, 0.97)',
  placeholder: '#A79C8C',
  micIdle: '#C25E46',
  micActive: '#B34E4E',
  waveform: '#C25E46',
  waveformMuted: '#C9B6A5',
};

const dark: Palette = {
  background: '#181511',
  backgroundAlt: '#1F1B16',
  surface: '#241F19',
  surfaceRaised: '#2B251E',
  surfaceMuted: '#30291F',
  surfaceTint: '#38251F',
  text: '#F2E9DA',
  textSecondary: '#B8AD9B',
  textTertiary: '#8B8172',
  border: '#393228',
  borderStrong: '#4D4336',
  accent: '#E58A6A',
  accentPressed: '#F0A085',
  accentSoft: '#3B2822',
  accentText: '#24100B',
  sage: '#A7B996',
  sageSoft: '#2D3528',
  gold: '#E0B56F',
  goldSoft: '#3A3020',
  danger: '#E58A8A',
  dangerSoft: '#3C2525',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.64)',
  tabBar: 'rgba(36, 31, 25, 0.98)',
  placeholder: '#7D7364',
  micIdle: '#E58A6A',
  micActive: '#E58A8A',
  waveform: '#E58A6A',
  waveformMuted: '#6B5D50',
};

export const palettes = { light, dark } as const;

export const FONTS = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  serif: 'Fraunces_400Regular',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const RADII = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const MAX_CONTENT_WIDTH = 1120;
export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_INSET = 104;
