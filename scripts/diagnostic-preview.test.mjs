/** 预览与诊断提取各自限流：逐批显示不删除文本，切换原文或复制可继续使用同一份已提取数据。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { getDiagnosticPreview } from '../src/components/FailureDetails/preview.ts';
import { formatFailureDetails } from '../src/utils/failureDetails.ts';

test('短诊断不裁剪，长调用列表分批追加并最终还原完整文本', () => {
  assert.deepEqual(getDiagnosticPreview('short error', 1), { text: 'short error', hasMore: false });
  const text = Array.from(
    { length: 135 },
    (_, i) => `    at call${i} (/src/view.ts:${i + 1}:2)`,
  ).join('\n');
  const first = getDiagnosticPreview(text, 1);
  assert.equal(first.hasMore, true);
  assert.match(first.text, /call59/);
  assert.doesNotMatch(first.text, /call60/);
  const second = getDiagnosticPreview(text, 2);
  assert.ok(second.text.startsWith(first.text));
  assert.match(second.text, /call119/);
  assert.deepEqual(getDiagnosticPreview(text, 3), { text, hasMore: false });
});

test('长单行按字符批次预览，原始提取文本与尾部原因仍完整保留', () => {
  const original = 'x'.repeat(30000) + '\n根因仍然保留';
  const extracted = formatFailureDetails(original);
  assert.equal(extracted, original);
  const first = getDiagnosticPreview(extracted, 1);
  assert.equal(first.text.length, 16000);
  assert.equal(first.hasMore, true);
  assert.doesNotMatch(first.text, /根因仍然保留/);
  assert.deepEqual(getDiagnosticPreview(extracted, 2), { text: original, hasMore: false });
  assert.match(extracted, /根因仍然保留$/);
});

test('预览不拆开 UTF-16 代理对，下一批仍能恢复原始文本', () => {
  const text = 'x'.repeat(15999) + '😀尾部';
  const first = getDiagnosticPreview(text, 1);
  assert.equal(first.text, 'x'.repeat(15999));
  assert.equal(first.hasMore, true);
  assert.deepEqual(getDiagnosticPreview(text, 2), { text, hasMore: false });
});
