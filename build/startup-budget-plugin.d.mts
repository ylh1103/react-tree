/** Vite 配置消费构建预算插件的类型声明，运行时统计逻辑保持在 Node 模块中。 */
import type { Plugin } from 'vite';

export function startupBudgetPlugin(): Plugin;
