import type { CSSProperties } from 'react';

type Point = readonly [number, number];
type Segment = Point | { control: Point; end: Point };

// These contours match the SVG faces. Sampling only happens once at module load.
const contours: Record<'red' | 'blue', Segment[]> = {
  red: [
    [88, 48],
    [36, 63],
    { control: [18, 68], end: [18, 86] },
    [18, 143],
    { control: [18, 166], end: [41, 161] },
    [91, 148],
    { control: [101, 146], end: [109, 153] },
    [120, 165],
    [120, 70],
    { control: [120, 42], end: [99, 45] },
  ],
  blue: [
    [88, 16],
    [101, 28],
    { control: [109, 35], end: [123, 31] },
    [153, 23],
    { control: [178, 17], end: [178, 43] },
    [178, 107],
    { control: [178, 122], end: [163, 126] },
    [113, 140],
    { control: [88, 146], end: [88, 121] },
  ],
};

function sideWalls(segments: Segment[]) {
  const points: Point[] = [];
  for (const segment of segments) {
    if ('control' in segment) {
      const [startX, startY] = points[points.length - 1];
      for (let step = 1; step <= 8; step++) {
        const t = step / 8;
        points.push([
          (1 - t) ** 2 * startX + 2 * (1 - t) * t * segment.control[0] + t * t * segment.end[0],
          (1 - t) ** 2 * startY + 2 * (1 - t) * t * segment.control[1] + t * t * segment.end[1],
        ]);
      }
    } else points.push(segment);
  }
  return points.map(([x, y], index) => {
    const end = points[(index + 1) % points.length];
    const dx = end[0] - x,
      dy = end[1] - y;
    const angle = Math.atan2(dy, dx);
    return {
      shade: Math.sin(angle) < -0.4 ? 0 : Math.sin(angle) > 0.4 ? 2 : 1,
      style: {
        '--edge-x': `${x / 196}em`,
        '--edge-y': `${(y + 6) / 196}em`,
        '--edge-width': `${(Math.hypot(dx, dy) + 0.4) / 196}em`,
        '--edge-angle': `${angle}rad`,
      } as CSSProperties,
    };
  });
}

export const panelSides = { red: sideWalls(contours.red), blue: sideWalls(contours.blue) };
