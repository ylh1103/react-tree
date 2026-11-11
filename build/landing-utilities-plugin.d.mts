import type { Plugin } from 'vite';

export function landingUtilitiesPlugin(options: {
  publicId: string;
  sourceDirectory: string;
  selector: string;
  useProjectConfig?: boolean;
}): Plugin;
