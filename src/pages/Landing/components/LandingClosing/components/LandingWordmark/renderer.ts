import { fragment, vertex } from './shaders';

type RGB = [number, number, number];
const stepSeconds = 1 / 60;

/** 将原版波场上传为浮点纹理，使用原生 WebGL2 渲染字形遮罩与图案。 */
export function createRenderer(canvas: HTMLCanvasElement, base: RGB, hover: RGB) {
  const context = canvas.getContext('webgl2', { premultipliedAlpha: true });
  if (!context) return;
  const gl = context;
  const program = gl.createProgram();
  if (!program) return;
  const mask = gl.createTexture();
  const wave = gl.createTexture();
  const shaders: WebGLShader[] = [];

  function dispose() {
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteProgram(program);
    gl.deleteTexture(mask);
    gl.deleteTexture(wave);
  }

  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) {
      dispose();
      return;
    }
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) || !mask || !wave) {
    dispose();
    return;
  }

  gl.useProgram(program);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform3fv(uniform('baseColor'), base);
  gl.uniform3fv(uniform('hoverColor'), hover);
  gl.uniform1i(uniform('wordMask'), 0);
  gl.uniform1i(uniform('waves'), 1);
  const resolution = uniform('resolution');
  const grid = uniform('grid');
  const cellSize = uniform('cellSize');
  const wordOffset = uniform('wordOffset');

  for (const [unit, texture, filter] of [
    [gl.TEXTURE0, mask, gl.LINEAR],
    [gl.TEXTURE1, wave, gl.NEAREST],
  ] as const) {
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  let cols = 1;
  let rows = 1;
  let cell = 1;
  let originY = 0;
  let heights = new Float32Array(1);
  let previous = new Float32Array(1);
  let backlog = 0;

  function draw() {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RED, gl.FLOAT, heights);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return {
    resize(source: HTMLCanvasElement, targetCell: number, width: number, height: number) {
      canvas.width = width;
      canvas.height = height;
      cols = Math.max(1, Math.round(width / targetCell));
      cell = width / cols;
      rows = Math.max(1, Math.floor(height / cell));
      originY = (height - rows * cell) / 2;
      heights = new Float32Array(cols * rows);
      previous = new Float32Array(cols * rows);
      backlog = 0;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
      gl.uniform2i(grid, cols, rows);
      gl.uniform1f(cellSize, cell);
      gl.activeTexture(gl.TEXTURE0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.activeTexture(gl.TEXTURE1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, cols, rows, 0, gl.RED, gl.FLOAT, heights);
      draw();
    },
    moveWord(offset: number) {
      gl.uniform1f(wordOffset, offset);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    splash(x: number, y: number, radius: number, strength: number) {
      const sigma = Math.max(0.5, radius / cell / 2);
      const reach = Math.ceil(sigma * 2.5);
      const cx = x / cell - 0.5;
      const cy = (y - originY) / cell - 0.5;
      for (
        let row = Math.max(0, Math.ceil(cy - reach));
        row <= Math.min(rows - 1, cy + reach);
        row++
      ) {
        for (
          let col = Math.max(0, Math.ceil(cx - reach));
          col <= Math.min(cols - 1, cx + reach);
          col++
        ) {
          const distanceSquared = (row - cy) ** 2 + (col - cx) ** 2;
          const index = row * cols + col;
          heights[index] = Math.min(
            1.2,
            heights[index] + strength * Math.exp(-distanceSquared / (2 * sigma ** 2)),
          );
        }
      }
    },
    render(delta: number) {
      backlog = Math.min(backlog + delta, stepSeconds * 4);
      let peak = 1;
      while (backlog >= stepSeconds) {
        backlog -= stepSeconds;
        peak = 0;
        for (let row = 0; row < rows; row++) {
          const above = Math.max(0, row - 1) * cols;
          const below = Math.min(rows - 1, row + 1) * cols;
          const offset = row * cols;
          for (let col = 0; col < cols; col++) {
            const index = offset + col;
            const height = heights[index];
            const laplacian =
              heights[offset + Math.max(0, col - 1)] +
              heights[offset + Math.min(cols - 1, col + 1)] +
              heights[above + col] +
              heights[below + col] -
              4 * height;
            const next = (height + (height - previous[index]) * 0.94 + 0.42 * laplacian) * 0.972;
            previous[index] = next;
            peak = Math.max(peak, next);
          }
        }
        [heights, previous] = [previous, heights];
      }
      if (peak < 0.01) {
        this.reset();
        return false;
      }
      draw();
      return true;
    },
    reset() {
      heights.fill(0);
      previous.fill(0);
      backlog = 0;
      draw();
    },
    dispose,
  };
}
