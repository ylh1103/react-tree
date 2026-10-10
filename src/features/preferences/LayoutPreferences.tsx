import { useMemo, useState, type ReactNode } from 'react';
import { LayoutPreferencesContext, type LayoutMode } from './useLayoutPreferences';

const storageKey = 'react-tree:layout-mode:v1';

function readLayoutMode(): LayoutMode {
  try {
    return localStorage.getItem(storageKey) === 'compact' ? 'compact' : 'default';
  } catch {
    return 'default';
  }
}

export function LayoutPreferencesProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setMode] = useState(readLayoutMode);
  const value = useMemo(
    () => ({
      layoutMode,
      setLayoutMode(mode: LayoutMode) {
        setMode(mode);
        try {
          localStorage.setItem(storageKey, mode);
        } catch {
          // 存储不可用时，当前会话仍可切换布局。
        }
      },
    }),
    [layoutMode],
  );
  return <LayoutPreferencesContext value={value}>{children}</LayoutPreferencesContext>;
}
