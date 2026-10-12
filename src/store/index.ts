import { configureStore } from '@reduxjs/toolkit';
import preferencesReducer from './preferencesSlice.ts';
import { userSettingsApi } from '../features/preferences/api.ts';
import { readBootstrapTheme } from '../features/preferences/themeBootstrap.ts';
import type { ThemeMode, UserSettingsApi } from '../features/preferences/types.ts';

export function createAppStore(
  api: UserSettingsApi = userSettingsApi,
  themeMode: ThemeMode = 'light',
) {
  return configureStore({
    reducer: { preferences: preferencesReducer },
    preloadedState: {
      preferences: {
        ...preferencesReducer(undefined, { type: 'preferences/init' }),
        themeMode,
        savedThemeMode: themeMode,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: { userSettingsApi: api } } }),
  });
}
export const store = createAppStore(userSettingsApi, readBootstrapTheme());
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
