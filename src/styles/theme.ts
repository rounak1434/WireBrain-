import { ThemeMode } from '../types';

export interface ThemeColors {
  canvasBg: string;
  appBg: string;
  panelBg: string;
  panelHeaderBg: string;
  surfaceBg: string;
  surfaceHover: string;
  surfaceActive: string;
  borderSubtle: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  gridDot: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  'pure-black': {
    canvasBg: '#000000',
    appBg: '#050506',
    panelBg: '#08090c',
    panelHeaderBg: '#0b0c10',
    surfaceBg: '#0e1015',
    surfaceHover: '#141720',
    surfaceActive: '#1c202d',
    borderSubtle: '#181b24',
    borderStrong: '#252936',
    textPrimary: '#f4f5f8',
    textSecondary: '#9da5b4',
    textMuted: '#5d6575',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    accentSubtle: 'rgba(59, 130, 246, 0.15)',
    gridDot: 'rgba(255, 255, 255, 0.08)',
  },
  midnight: {
    canvasBg: '#04070d',
    appBg: '#070b14',
    panelBg: '#0b101a',
    panelHeaderBg: '#0f1523',
    surfaceBg: '#131a29',
    surfaceHover: '#192236',
    surfaceActive: '#202c46',
    borderSubtle: '#1a2438',
    borderStrong: '#283652',
    textPrimary: '#f0f4f8',
    textSecondary: '#94a3b8',
    textMuted: '#55657e',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    accentSubtle: 'rgba(59, 130, 246, 0.16)',
    gridDot: 'rgba(255, 255, 255, 0.09)',
  },
};
