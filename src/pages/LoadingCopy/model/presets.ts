/** 原站 GradientWaves 的五组参数，同时驱动画布、代码示例和 Studio 跳转地址。 */
export interface WaveSettings {
  name: string;
  horizon: string;
  wave: string;
  crest: string;
  amplitude: number;
  swell: number;
  speed: number;
  lightAngle: number;
  scale: number;
  turbulence: number;
  ratio: number;
  fog: number;
}

export const presets: WaveSettings[] = [
  {
    name: 'Ocean',
    horizon: '#1e3a8a',
    wave: '#38bdf8',
    crest: '#e0f2fe',
    amplitude: 1.8,
    swell: 25,
    speed: 0.5,
    lightAngle: 150,
    scale: 0.9,
    turbulence: 28,
    ratio: 0.9,
    fog: 15,
  },
  {
    name: 'Dune',
    horizon: '#7c2d12',
    wave: '#fb923c',
    crest: '#fef3c7',
    amplitude: 3.2,
    swell: 40,
    speed: 0.2,
    lightAngle: 60,
    scale: 0.45,
    turbulence: 12,
    ratio: 0.6,
    fog: 15,
  },
  {
    name: 'Dusk',
    horizon: '#5227ff',
    wave: '#ff9ffc',
    crest: '#ffffff',
    amplitude: 2.5,
    swell: 35,
    speed: 0.4,
    lightAngle: 120,
    scale: 0.6,
    turbulence: 20,
    ratio: 0.9,
    fog: 15,
  },
  {
    name: 'Silk',
    horizon: '#27272a',
    wave: '#a1a1aa',
    crest: '#ffffff',
    amplitude: 2.2,
    swell: 30,
    speed: 0.25,
    lightAngle: 130,
    scale: 0.5,
    turbulence: 16,
    ratio: 0.9,
    fog: 15,
  },
  {
    name: 'Aurora',
    horizon: '#064e3b',
    wave: '#34d399',
    crest: '#d1fae5',
    amplitude: 2.6,
    swell: 38,
    speed: 0.35,
    lightAngle: 170,
    scale: 0.7,
    turbulence: 24,
    ratio: 0.9,
    fog: 12,
  },
];

export const source = 'https://www.reactbits.dev';
export const github = 'https://github.com/DavidHDev/react-bits';
export const pro = 'https://pro.reactbits.dev/';
export const installCommand = 'npx shadcn@latest add @react-bits/GradientWaves-TS-TW';
