/** 页面预览分批展示，与诊断提取和复制独立；只返回原文前缀，不向原始文本写入省略提示。 */
export function getDiagnosticPreview(text: string, batches: number) {
  // 首批最多 60 行/16,000 字符，用户每次继续显示都增加同等额度，不生成内部滚动区。
  const count = Math.max(1, Math.floor(batches));
  let end = Math.min(text.length, count * 16000);
  let cursor = 0;
  for (let line = 0; line < count * 60; line++) {
    const newline = text.indexOf('\n', cursor);
    if (newline < 0 || newline >= end) break;
    cursor = newline + 1;
    if (line === count * 60 - 1) end = newline;
  }
  // 不把 UTF-16 代理对截成两个残缺字符；复制始终读取未经过预览切片的 text。
  if (
    end < text.length &&
    /[\uD800-\uDBFF]/.test(text[end - 1]) &&
    /[\uDC00-\uDFFF]/.test(text[end])
  )
    end--;
  return { text: text.slice(0, end), hasMore: end < text.length };
}
