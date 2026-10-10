import { createContext, useContext } from 'react';

export type LayoutMode = 'default' | 'compact';

export const LayoutPreferencesContext = createContext<{
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
} | null>(null);

export function useLayoutPreferences() {
  const preferences = useContext(LayoutPreferencesContext);
  if (!preferences) throw new Error('布局设置需要 LayoutPreferencesProvider');
  return preferences;
}
