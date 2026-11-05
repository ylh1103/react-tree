/** 页面私有主题和唯一滚动容器，不读写项目全局主题或官方站点偏好存储。 */
import { createContext, type RefObject } from 'react';

export interface TemplateContextValue {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  root: RefObject<HTMLDivElement | null>;
}

export const TemplateContext = createContext<TemplateContextValue | null>(null);
