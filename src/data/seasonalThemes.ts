import { useState, useEffect } from 'react';
import { MAIN_THEME_URL } from './audioConfig';

export type SeasonalThemeId = 'default' | 'christmas' | 'halloween';
export type SeasonalOverride = 'auto' | SeasonalThemeId;

export interface SeasonalThemeConfig {
  id: SeasonalThemeId;
  label: string;
  musicUrl: string;
  hasGameHats: boolean;
  hasUserHat: boolean;
}

const STORAGE_KEY = 'udo_seasonal_theme_override';
const EVENT_NAME = 'udo_seasonal_theme_change';

// registro escalable de festividades (agregar nuevas entradas aqui)
export const SEASONAL_THEMES: Record<SeasonalThemeId, SeasonalThemeConfig> = {
  default: {
    id: 'default',
    label: 'Normal (Morado)',
    musicUrl: MAIN_THEME_URL,
    hasGameHats: false,
    hasUserHat: false,
  },
  christmas: {
    id: 'christmas',
    label: 'Navidad',
    musicUrl: '/assets/audio/gamesUDONE-Christmas.ogg',
    hasGameHats: true,
    hasUserHat: true,
  },
  halloween: {
    id: 'halloween',
    label: 'Halloween',
    musicUrl: '/assets/audio/gamesUDONE-Halloween.ogg',
    hasGameHats: false,
    hasUserHat: false,
  },
};

// detecta la festividad segun la fecha actual del sistema
export function detectSeasonalThemeByDate(now = new Date()): SeasonalThemeId {
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // navidad: 1 de diciembre al 6 de enero
  if (month === 12 || (month === 1 && day <= 6)) {
    return 'christmas';
  }

  // halloween: 15 de octubre al 2 de noviembre
  if ((month === 10 && day >= 15) || (month === 11 && day <= 2)) {
    return 'halloween';
  }

  return 'default';
}

export function getSeasonalOverride(): SeasonalOverride {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'default' || saved === 'christmas' || saved === 'halloween' || saved === 'auto') {
    return saved;
  }
  return 'auto';
}

export function setSeasonalOverride(override: SeasonalOverride): void {
  localStorage.setItem(STORAGE_KEY, override);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { override } }));
}

export function resolveActiveTheme(override: SeasonalOverride): SeasonalThemeConfig {
  const activeId: SeasonalThemeId =
    override === 'auto' ? detectSeasonalThemeByDate() : override;
  return SEASONAL_THEMES[activeId] || SEASONAL_THEMES.default;
}

// decide de forma fija que juegos llevan gorrito para que no sean todos ni parpadee
export function shouldGameWearFestiveHat(gameId: number, themeId: SeasonalThemeId): boolean {
  if (themeId !== 'christmas') return false;
  return gameId % 3 === 0 || gameId === 1 || gameId === 8;
}

// hook reactivo para leer y cambiar el tema festivo desde cualquier componente
export function useSeasonalTheme() {
  const [override, setOverrideState] = useState<SeasonalOverride>(() => getSeasonalOverride());

  useEffect(() => {
    const handleThemeChange = () => {
      setOverrideState(getSeasonalOverride());
    };
    window.addEventListener(EVENT_NAME, handleThemeChange);
    return () => window.removeEventListener(EVENT_NAME, handleThemeChange);
  }, []);

  const theme = resolveActiveTheme(override);

  const updateOverride = (next: SeasonalOverride) => {
    setSeasonalOverride(next);
    setOverrideState(next);
  };

  return {
    theme,
    override,
    setOverride: updateOverride,
  };
}