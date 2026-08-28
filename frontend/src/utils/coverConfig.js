// coverConfig.js — Utilidades y valores por defecto para la configuración de carátulas de módulo

export const DEFAULT_COVER_CONFIG = {
  // Panel 1: Capa de Imagen Base
  bgColor: '#0f172a',
  bgPositionX: 50, // %
  bgPositionY: 50, // %
  bgSize: 'cover', // 'cover' | 'contain' | 'auto' | '100% 100%'
  bgRepeat: 'no-repeat', // 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  bgOpacity: 85, // % (0-100)

  // Panel 2: Capa de Superposición (Overlay)
  overlayEnabled: true,
  overlayTopColor: '#000000',
  overlayTopOpacity: 50, // % (0-100)
  overlayBottomColor: '#0f172a',
  overlayBottomOpacity: 70, // % (0-100)

  // Panel Adicional 1: Patrón Geométrico
  patternStyle: 'diamonds', // 'diamonds' | 'dots' | 'grid' | 'none'
  patternOpacity: 20, // % (0-100)

  // Panel Adicional 2: Estilo de Curva SVG Inferior
  curveStyle: 'smooth', // 'smooth' | 'wave' | 'slant' | 'straight' | 'arch'
};

export function getFullCoverConfig(coverConfig = {}) {
  return {
    ...DEFAULT_COVER_CONFIG,
    ...coverConfig,
  };
}

export function hexToRgba(hex = '#000000', alpha = 1) {
  let c = String(hex).replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export function getOverlayStyle(cfg, fallbackColor = '#0f172a') {
  const config = getFullCoverConfig(cfg);
  if (!config.overlayEnabled) {
    return { display: 'none' };
  }
  const topColor = config.overlayTopColor || '#000000';
  const topAlpha = (config.overlayTopOpacity ?? 50) / 100;
  const bottomColor = config.overlayBottomColor || fallbackColor || '#0f172a';
  const bottomAlpha = (config.overlayBottomOpacity ?? 70) / 100;

  return {
    background: `linear-gradient(to bottom, ${hexToRgba(topColor, topAlpha)}, ${hexToRgba(bottomColor, bottomAlpha)})`,
  };
}

export const CURVE_PATHS = {
  smooth: 'M0,0 Q720,130 1440,0 L1440,120 L0,120 Z',
  wave: 'M0,30 Q360,110 720,40 T1440,50 L1440,120 L0,120 Z',
  slant: 'M0,0 L1440,75 L1440,120 L0,120 Z',
  straight: 'M0,0 L1440,0 L1440,120 L0,120 Z',
  arch: 'M0,75 Q720,-35 1440,75 L1440,120 L0,120 Z',
};
