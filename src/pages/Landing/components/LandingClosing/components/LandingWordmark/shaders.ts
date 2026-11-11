/** Shape Waves 原有噪声分布和形状距离函数的 GLSL 移植。 */
export const vertex = `#version 300 es
void main() {
  vec2 point = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(point * 2.0 - 1.0, 0.0, 1.0);
}`;

export const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform ivec2 grid;
uniform float cellSize;
uniform sampler2D wordMask;
uniform float wordOffset;
uniform highp sampler2D waves;
uniform vec3 baseColor;
uniform vec3 hoverColor;
out vec4 color;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fadeCurve(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289v3(Pi0);
  Pi1 = mod289v3(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 f = fadeCurve(Pf0);
  vec4 nz = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), f.z);
  vec2 ny = mix(nz.xy, nz.zw, f.y);
  return 2.2 * mix(ny.x, ny.y, f.x);
}

float fbm(vec3 p) {
  float total = 0.0;
  float amplitude = 1.0;
  float weight = 0.0;
  float frequency = 1.0;
  for (int i = 0; i < 2; i++) {
    total += amplitude * cnoise(p * frequency);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total / weight;
}

float triangleDistance(vec2 point, vec2 q) {
  vec2 p = vec2(abs(point.x), point.y);
  vec2 a = p - q * clamp(dot(p,q) / dot(q,q), 0.0, 1.0);
  vec2 b = p - q * vec2(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  float side = -sign(q.y);
  vec2 d = min(vec2(dot(a,a), side * (p.x*q.y-p.y*q.x)),
               vec2(dot(b,b), side * (p.y-q.y)));
  return -sqrt(d.x) * sign(d.y);
}

void main() {
  vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
  vec2 origin = vec2(0.0, (resolution.y - float(grid.y) * cellSize) * 0.5);
  ivec2 cell = ivec2(floor((pixel - origin) / cellSize));
  color = vec4(0.0);
  if (any(lessThan(cell, ivec2(0))) || any(greaterThanEqual(cell, grid))) return;
  vec2 center = origin + (vec2(cell) + 0.5) * cellSize;
  // 按像素裁切字形，避免滚动时整颗图形突然出现或消失。
  vec2 wordUV = pixel / resolution - vec2(0.0, wordOffset);
  float wordAlpha = wordUV.y >= 0.0 ? texture(wordMask, wordUV).a : 0.0;
  if (wordAlpha >= 1.0) return;

  vec2 local = (pixel - center) / (cellSize * 0.5);
  float tone = clamp((fbm(vec3(center / (38.4 * cellSize) + vec2(12.9898, 78.233), 0.0))
    * 0.5 - 0.04) * 2.8 + 0.5, 0.0, 0.999999);
  float charge = clamp(texelFetch(waves, cell, 0).r, 0.0, 0.999);
  int shape = 2 - ((int(tone * 3.0) + int(charge * 3.0)) % 3);
  float size = 0.72;
  float distance = shape == 0 ? max(abs(local.x), abs(local.y)) - size :
    shape == 1 ? length(local) - size :
    triangleDistance(vec2(local.x, local.y + size), vec2(size, 2.0 * size));
  float aa = 2.0 / cellSize;
  float coverage = (1.0 - smoothstep(-aa, aa, distance)) * (1.0 - wordAlpha);
  vec3 tint = mix(baseColor, hoverColor, smoothstep(0.15, 0.85, charge));
  // WebGL 画布按预乘 Alpha 合成，抗锯齿边缘的颜色也必须乘以覆盖率。
  color = vec4(tint * coverage, coverage);
}`;
