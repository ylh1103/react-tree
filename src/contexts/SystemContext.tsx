/**
 * 向系统工作区子组件提供已经验证可访问的系统信息。
 * 消费 Hook 检查布局上下文，避免在缺少系统时继续发起业务请求。
 */
import { createContext, useContext } from 'react';
import type { SystemInfo } from '../types/systems';
import type { ParameterPlatform } from '../router/paths';

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
