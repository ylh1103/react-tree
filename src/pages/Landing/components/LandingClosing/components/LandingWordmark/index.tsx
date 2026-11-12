import { useEffect, useRef } from 'react';
import { theme } from 'antd';
import { useScroll, useSpring } from 'motion/react';
import { useLandingTheme } from '../../../../hooks/useLandingTheme';
import { createRenderer } from './renderer';

const word = 'Ling Dong';
const fontFamily = 'Geist, "Geist Sans", system-ui, sans-serif';

function toWebGLColor(hex: string): [number, number, number] {
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return [channel(1), channel(3), channel(5)];
}

/** 复用原页尾的字形比例和裁切，静态图案也用于无 WebGL2 的设备。 */
export default function LandingWordmark() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start end', 'end end'] });
  const revealProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001,
  });
  const staticRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);
  const { token } = theme.useToken();
  const { theme: mode } = useLandingTheme();
  // 浅色点阵用低饱和蓝色，避免主题边框的青色在浅灰底上偏绿。
  const base = mode === 'light' ? '#99bde0' : token.colorPrimaryBorder;
  const hover = mode === 'light' ? '#60a0d3' : token.colorPrimary;
  const tone = mode === 'dark' ? 'saturate-40 brightness-85' : '';

  useEffect(() => {
    const root = rootRef.current;
    const staticCanvas = staticRef.current;
    const live = liveRef.current;
    const context = staticCanvas?.getContext('2d');
    const pattern = document.createElement('canvas');
    pattern.width = 0;
    const patternContext = pattern.getContext('2d');
    const mask = document.createElement('canvas');
    const maskContext = mask.getContext('2d');
    if (!root || !staticCanvas || !live || !context || !patternContext || !maskContext) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let renderer: ReturnType<typeof createRenderer>;
    let attempted = false;
    let visible = false;
    let disposed = false;
    let frame = 0;
    let lastFrame = 0;
    let lastPointer: { x: number; y: number; at: number } | undefined;
    let scale = 1;
    let cellSize = 9;
    let revealDistance = 0;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      lastPointer = undefined;
      renderer?.reset();
    }

    // 滚动只移动镂空字形。静态路径复用已经绘好的点阵。
    function redrawWord() {
      if (!root || !live || !staticCanvas || !context || !pattern.width) return;
      // 字形在可见区域下方起步，滚动较快时也保留一段平滑的升起过程。
      const progress = Math.max(0, Math.min(1, revealProgress.get()));
      const offset = motion.matches ? 0 : (1 - progress) * revealDistance * scale;
      if (renderer && live.style.visibility === 'visible') {
        renderer.moveWord(offset / staticCanvas.height);
        return;
      }
      context.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
      context.globalCompositeOperation = 'source-over';
      context.drawImage(pattern, 0, 0);
      context.globalCompositeOperation = 'destination-out';
      context.drawImage(mask, 0, offset, staticCanvas.width, staticCanvas.height);
    }

    function syncRenderer() {
      if (!live || !staticCanvas) return;
      const active = visible && !document.hidden && !motion.matches && pointer.matches;
      if (active && !attempted) {
        attempted = true;
        renderer = createRenderer(live, toWebGLColor(base), toWebGLColor(hover));
      }
      live.style.visibility = active && renderer ? 'visible' : 'hidden';
      staticCanvas.style.visibility = active && renderer ? 'hidden' : 'visible';
      if (active && renderer && mask.width && mask.height) {
        renderer.resize(mask, cellSize * scale, staticCanvas.width, staticCanvas.height);
      } else {
        stop();
      }
      redrawWord();
    }

    function resize() {
      if (
        disposed ||
        !root ||
        !staticCanvas ||
        !live ||
        !context ||
        !patternContext ||
        !maskContext
      )
        return;
      const width = root.clientWidth;
      if (!width) return;
      stop();
      context.font = `600 100px ${fontFamily}`;
      const metrics = context.measureText(word);
      const padding =
        parseFloat(getComputedStyle(root.previousElementSibling ?? root).paddingLeft) || 0;
      const font = Math.max(
        24,
        ((width - padding * 2) * 100) /
          (metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight),
      );
      const glyph =
        (font * (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) / 100;
      const above = Math.max(20, glyph * 0.24);
      const boxWidth = (font * metrics.width) / 90;
      const boxHeight = above * 2 + glyph;
      // 沿用原版的缓入缓出遮罩，点阵从底色中逐渐显现。
      const fadeEnd = above + glyph * 0.4;
      const fade = `linear-gradient(to bottom, transparent 0,
        rgb(0 0 0 / 0.009) ${fadeEnd * 0.1}px,
        rgb(0 0 0 / 0.058) ${fadeEnd * 0.2}px,
        rgb(0 0 0 / 0.163) ${fadeEnd * 0.3}px,
        rgb(0 0 0 / 0.317) ${fadeEnd * 0.4}px,
        rgb(0 0 0 / 0.5) ${fadeEnd * 0.5}px,
        rgb(0 0 0 / 0.683) ${fadeEnd * 0.6}px,
        rgb(0 0 0 / 0.837) ${fadeEnd * 0.7}px,
        rgb(0 0 0 / 0.942) ${fadeEnd * 0.8}px,
        rgb(0 0 0 / 0.991) ${fadeEnd * 0.9}px,
        #000 ${fadeEnd}px)`;
      const visibleHeight = above + glyph * 0.6;
      revealDistance = visibleHeight * 0.72;
      root.style.height = `${visibleHeight}px`;
      root.style.maskImage = fade;
      root.style.webkitMaskImage = fade;
      for (const canvas of [staticCanvas, live]) {
        canvas.style.left = `${(width - boxWidth) / 2}px`;
        canvas.style.width = `${boxWidth}px`;
        canvas.style.height = `${boxHeight}px`;
      }

      cellSize = Math.min(9, Math.max(3, Math.round(width / 135)));
      scale = Math.min(window.devicePixelRatio || 1, 2);
      staticCanvas.width = Math.round(boxWidth * scale);
      staticCanvas.height = Math.round(boxHeight * scale);
      const maskScale = Math.min(1, 1024 / Math.max(boxWidth, boxHeight));
      mask.width = Math.round(boxWidth * maskScale);
      mask.height = Math.round(boxHeight * maskScale);
      maskContext.scale(maskScale, maskScale);
      maskContext.font = `600 ${font}px ${fontFamily}`;
      maskContext.textAlign = 'center';
      const wordBounds = maskContext.measureText(word);
      maskContext.fillText(
        word,
        (boxWidth + wordBounds.actualBoundingBoxLeft - wordBounds.actualBoundingBoxRight) / 2,
        (boxHeight + wordBounds.actualBoundingBoxAscent - wordBounds.actualBoundingBoxDescent) / 2,
      );

      pattern.width = staticCanvas.width;
      pattern.height = staticCanvas.height;
      patternContext.scale(scale, scale);
      patternContext.fillStyle = base;
      for (let row = 0; row * cellSize < boxHeight; row++) {
        for (let col = 0; col * cellSize < boxWidth; col++) {
          const x = (col + 0.5) * cellSize;
          const y = (row + 0.5) * cellSize;
          const radius = cellSize * 0.3;
          patternContext.globalAlpha = 0.48 + ((col * 7 + row) % 5) * 0.11;
          patternContext.beginPath();
          const shape = (row + col) % 3;
          if (shape === 0) patternContext.arc(x, y, radius, 0, Math.PI * 2);
          else if (shape === 1) patternContext.rect(x - radius, y - radius, radius * 2, radius * 2);
          else {
            patternContext.moveTo(x, y - radius);
            patternContext.lineTo(x + radius, y + radius);
            patternContext.lineTo(x - radius, y + radius);
          }
          patternContext.fill();
        }
      }
      syncRenderer();
    }

    function tick(time: number) {
      const active = renderer?.render(lastFrame ? (time - lastFrame) / 1000 : 0);
      lastFrame = active ? time : 0;
      frame = active ? requestAnimationFrame(tick) : 0;
    }

    function onPointerMove(event: PointerEvent) {
      if (
        !renderer ||
        !live ||
        live.style.visibility !== 'visible' ||
        event.pointerType !== 'mouse'
      )
        return;
      const bounds = live.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const at = performance.now();
      const speed = lastPointer
        ? (Math.hypot(x - lastPointer.x, y - lastPointer.y) * 1000) /
          Math.max(8, at - lastPointer.at)
        : 0;
      lastPointer = { x, y, at };
      renderer.splash(x * scale, y * scale, 40 * scale, Math.min(1, 0.22 + speed * 0.0006) * 0.4);
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function onPointerLeave() {
      lastPointer = undefined;
    }

    function onContextLost() {
      stop();
      renderer?.dispose();
      renderer = undefined;
      syncRenderer();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncRenderer();
    });
    visibilityObserver.observe(root);
    resize();
    const unsubscribeScroll = revealProgress.on('change', redrawWord);
    void document.fonts.ready.then(resize);
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', onPointerLeave);
    motion.addEventListener('change', syncRenderer);
    pointer.addEventListener('change', syncRenderer);
    document.addEventListener('visibilitychange', syncRenderer);
    live.addEventListener('webglcontextlost', onContextLost);
    return () => {
      disposed = true;
      stop();
      renderer?.dispose();
      unsubscribeScroll();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      motion.removeEventListener('change', syncRenderer);
      pointer.removeEventListener('change', syncRenderer);
      document.removeEventListener('visibilitychange', syncRenderer);
      live.removeEventListener('webglcontextlost', onContextLost);
    };
  }, [base, hover, revealProgress]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`relative mx-[-6px] h-[clamp(58px,13vw,188px)] overflow-hidden ${tone}`}
    >
      <canvas ref={staticRef} className="pointer-events-none absolute top-0 block" />
      <canvas ref={liveRef} className="pointer-events-none invisible absolute top-0 block" />
    </div>
  );
}
