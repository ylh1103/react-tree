import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
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
import { themeVariables } from './styles/theme';

for (const [name, value] of Object.entries(themeVariables)) {
  document.documentElement.style.setProperty(name, value);
}

const legacyStyleTransformers = [legacyLogicalPropertiesTransformer, autoPrefixTransformer];

createRoot(document.getElementById('root')!).render(
  <StyleProvider hashPriority="high" transformers={legacyStyleTransformers}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StyleProvider>,
);
