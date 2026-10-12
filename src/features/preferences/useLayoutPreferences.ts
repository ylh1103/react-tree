import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { saveLayoutMode } from '../../store/preferencesSlice';
import type { LayoutMode } from './types';

export function useLayoutPreferences() {
  const layoutMode = useAppSelector((state) => state.preferences.layoutMode);
  const dispatch = useAppDispatch();
  const updateLayoutMode = useCallback(
    (mode: LayoutMode) => dispatch(saveLayoutMode(mode)),
    [dispatch],
  );
  return { layoutMode, setLayoutMode: updateLayoutMode };
}
