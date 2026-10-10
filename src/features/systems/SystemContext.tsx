import { createContext, useContext } from 'react';
import type { SystemInfo } from './types';
import type { ParameterPlatform } from './paths';

export interface SystemWorkspace {
  system: SystemInfo;
  systems: SystemInfo[];
  platform: ParameterPlatform;
}

export const SystemContext = createContext<SystemWorkspace | null>(null);

export function useSystemWorkspace() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('系统工作区必须位于 SystemContext 内');
  return context;
}
