/** 兼容官方组件的主题接口，把主题变化限制在模板根节点内。 */
import { useContext } from 'react';
import { TemplateContext } from '../model/templateContext';

export function useTemplateContext() {
  const context = useContext(TemplateContext);
  if (!context) throw new Error('模板组件必须位于 TemplateProvider 中。');
  return context;
}

export function useTemplateRoot() {
  return useTemplateContext().root;
}

export function useColorMode() {
  const { theme, setTheme } = useTemplateContext();
  return {
    theme,
    resolvedTheme: theme,
    colorMode: theme,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  return useTemplateContext().theme === 'light' ? light : dark;
}
