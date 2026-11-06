/** 产品页消费全局用户主题，并提供主题保存入口和唯一滚动容器。 */
import { createContext, type RefObject } from 'react';

export interface LandingContextValue {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  canChangeTheme: boolean;
  particleColors: { base: string; accent: string };
  root: RefObject<HTMLDivElement | null>;
}

export const LandingContext = createContext<LandingContextValue | null>(null);
