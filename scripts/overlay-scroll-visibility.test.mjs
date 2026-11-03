/** 验证实际生成的 UnoCSS 选择器：嵌套容器只显示自己的覆盖条，鼠标焦点不会造成常显。 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createGenerator, presetWind3 } from 'unocss';

test('覆盖条悬停限定直接子节点，键盘使用 focus-visible 显示', async () => {
  const source = await readFile(
    new URL('../src/components/OverlayScroll/index.tsx', import.meta.url),
    'utf8',
  );
  const generator = await createGenerator({ presets: [presetWind3()] });
  const { css } = await generator.generate(source);
  // 后代 group 规则会让外层工作区的悬停/焦点激活所有环境工具栏；必须限定到当前容器。
  const hoverRules = css
    .split('}')
    .filter((rule) => rule.includes(':hover') && rule.includes('opacity:1'));
  assert.ok(hoverRules.length > 0, '悬停时仍须显示覆盖条');
  for (const rule of hoverRules) assert.match(rule, /:hover>\[data-overlay-scrollbar\]/);
  assert.doesNotMatch(css, /:focus-within/);
  assert.match(css, /:focus-visible~[^{}]+\{[^{}]*opacity:1/);
  assert.match(css, /:focus-visible\{[^{}]*opacity:1/);
  assert.match(source, /data-overlay-scrollbar=""/);
});

test('内容区建立独立层叠上下文，参数底栏渐隐不能盖住外层滚动条', async () => {
  const source = await readFile(
    new URL('../src/components/OverlayScroll/index.tsx', import.meta.url),
    'utf8',
  );
  const viewport = source.match(/<section\b[\s\S]*?className=\{`([\s\S]*?)`\}/)?.[1];
  assert.ok(viewport, '必须检查实际内容视口的样式');
  const generator = await createGenerator({ presets: [presetWind3()] });
  const { css } = await generator.generate(viewport);
  // 渐隐为 z-10，覆盖条为 z-1；内容必须作为整体参与层叠，不能让内部层级越过覆盖条。
  assert.match(css, /isolation:isolate/);
});
