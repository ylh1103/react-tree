/**
 * 封装布局偏好读取和保存，让页面与布局共用 Redux 状态。
 * 保存行为通过 Slice 完成，Hook 不单独持久化数据或维护额外的本地配置副本。
 */
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { saveLayoutMode } from '../store/slices/preferencesSlice';
import type { LayoutMode } from '../types/preferences';

export function useLayoutPreferences() {
  const layoutMode = useAppSelector((state) => state.preferences.layoutMode);
  const layoutGap = useAppSelector(
    (state) => state.preferences.previewLayoutGap ?? state.preferences.layoutGap,
  );
  const dispatch = useAppDispatch();
  const updateLayoutMode = useCallback(
    (mode: LayoutMode) => dispatch(saveLayoutMode(mode)),
    [dispatch],
  );
  return { layoutMode, layoutGap, setLayoutMode: updateLayoutMode };
}
