/** 原生 WebGL2 渲染参考站波浪；参数更新不重建上下文，离屏、隐藏和减少动态效果时暂停。 */
import { useEffect, useRef } from 'react';
import { fragmentShader, vertexShader } from '../model/waveShaders';
import type { WaveSettings } from '../model/presets';

function rgb(hex: string) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

export default function GradientWaves({
  settings,
  light,
}: {
  settings: WaveSettings;
  light: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const parameters = useRef({ settings, light });
  useEffect(() => {
    parameters.current = { settings, light };
  }, [settings, light]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // 画布与 Effect 同生命周期，避免 StrictMode 或热更新复用已经释放的 WebGL 上下文。
    const canvas = document.createElement('canvas');
    canvas.className = 'h-full w-full';
    host.appendChild(canvas);
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      canvas.remove();
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      canvas.remove();
      return;
    }
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexShader],
      [gl.FRAGMENT_SHADER, fragmentShader],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) continue;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      shaders.push(shader);
    }
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      canvas.remove();
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uniforms = new Map<string, WebGLUniformLocation | null>();
    function location(name: string) {
      if (!uniforms.has(name)) uniforms.set(name, gl!.getUniformLocation(program!, name));
      return uniforms.get(name)!;
    }
    const one = (name: string, value: number) => gl.uniform1f(location(name), value);
    const three = (name: string, values: number[]) => gl.uniform3fv(location(name), values);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = false;
    let previous = 0;
    let time = 4;
    let clock = 0;
    let dirty = true;
    let lookX = 0;
    let lookY = 0;
    let targetX = 0;
    let targetY = 0;
    function render(now: number) {
      frame = 0;
      if (!visible || document.hidden) {
        previous = 0;
        return;
      }
      const { settings: s, light: isLight } = parameters.current;
      const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      if (!reducedMotion.matches) time += delta * s.speed;
      clock += delta;
      lookX += (targetX - lookX) * 0.045;
      lookY += (targetY - lookY) * 0.045;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(canvas!.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas!.clientHeight * ratio));
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
      }
      gl!.viewport(0, 0, width, height);
      gl!.uniform2f(location('uResolution'), width, height);
      gl!.uniform2f(
        location('uLook'),
        reducedMotion.matches ? 0 : lookX * 0.175,
        reducedMotion.matches ? 0 : lookY * 0.09,
      );
      for (const [name, value] of Object.entries({
        uTime: time,
        uClock: clock,
        uAmplitude: s.amplitude,
        uWaveScale: s.scale,
        uWaveRatio: s.ratio,
        uSwell: s.swell,
        uTurbulence: s.turbulence,
        uHeight: 5.5,
        uTilt: (40 * Math.PI) / 180,
        uZoom: 1,
        uFogDepth: s.fog,
        uBrightness: 1,
        uOpacity: 1,
        uGrain: 0.2,
        uOpaque: 0,
        uLight: isLight ? 1 : 0,
        uRelief: 1,
        uSheen: 0,
        uSteps: 56,
        uSwellWidth: 8,
      }))
        one(name, value);
      three('uHorizon', rgb(s.horizon));
      three('uWave', rgb(s.wave));
      three('uCrest', rgb(s.crest));
      three('uBackground', isLight ? [0.96, 0.96, 0.96] : [0.07, 0.06, 0.09]);
      const angle = (s.lightAngle * Math.PI) / 180 + lookX * 0.6;
      three('uSun', [
        Math.cos(0.52) * Math.cos(angle),
        Math.cos(0.52) * Math.sin(angle),
        Math.sin(0.52),
      ]);
      three('uIntro', [1, 3, 0]);
      gl!.uniform3fv(location('uSwells'), new Float32Array(12));
      const slope =
        s.amplitude *
        ((s.scale / 7) * (1 + Math.abs(s.swell) / 20) +
          ((s.scale * s.ratio) / 3) * (1 + s.turbulence / 23));
      one('uStride', 0.9 / Math.max(1, slope / 1.5));
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      dirty = false;
      if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    }
    function start() {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    const resize = new ResizeObserver(() => {
      dirty = true;
      start();
    });
    resize.observe(canvas);
    function pointer(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      targetX = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
      targetY = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
    }
    // 减少动态效果时仍需响应交互参数；低频检查只唤醒一次静态绘制。
    let lastSettings = parameters.current;
    const timer = window.setInterval(() => {
      if (lastSettings !== parameters.current || dirty) {
        lastSettings = parameters.current;
        start();
      }
    }, 120);
    canvas.addEventListener('pointermove', pointer, { passive: true });
    document.addEventListener('visibilitychange', start);
    reducedMotion.addEventListener('change', start);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      observer.disconnect();
      resize.disconnect();
      canvas.removeEventListener('pointermove', pointer);
      document.removeEventListener('visibilitychange', start);
      reducedMotion.removeEventListener('change', start);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vertexArray);
      gl.deleteProgram(program);
      canvas.remove();
    };
  }, []);
  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
