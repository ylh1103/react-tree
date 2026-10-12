import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Provider } from 'react-redux';
import { store } from './store';
import { createRoot } from 'react-dom/client';
import {
  StyleProvider,
  legacyLogicalPropertiesTransformer,
  autoPrefixTransformer,
} from '@ant-design/cssinjs';
import { RouterProvider } from 'react-router/dom';
import 'virtual:uno.css';
import './index.css';
import { router } from './router';
import { routes } from './router/routes';
import { RouteLoadingContext } from './router/loading';
import { applyTheme } from './styles/theme';
import { loadUserSettings } from './store/preferencesSlice';
import { AppThemeProvider } from './components/AppThemeProvider';
import { getSystemTheme } from './features/preferences/useResolvedTheme';
import { startThemePersistence } from './features/preferences/themeBootstrap';
import { startUserSettingsSync } from './features/preferences/sync';

const stopThemePersistence = startThemePersistence(store);
import.meta.hot?.dispose(stopThemePersistence);
const stopUserSettingsSync = startUserSettingsSync(store);
import.meta.hot?.dispose(stopUserSettingsSync);

const initialTheme = store.getState().preferences.themeMode;
applyTheme(initialTheme === 'system' ? getSystemTheme() : initialTheme);
// 与路由模块和 loader 同时启动，避免配置读取阻塞数据请求的开始。
void store.dispatch(loadUserSettings());

const legacyStyleTransformers = [legacyLogicalPropertiesTransformer, autoPrefixTransformer];

createRoot(document.getElementById('root')!).render(
  <StyleProvider hashPriority="high" transformers={legacyStyleTransformers}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AppThemeProvider>
          <RouteLoadingContext value={routes}>
            <RouterProvider router={router} />
          </RouteLoadingContext>
        </AppThemeProvider>
      </Provider>
    </QueryClientProvider>
  </StyleProvider>,
);
