/** 底栏修改时间：优先使用精确维护时间，兼容仅有日期的旧响应；无效时间不展示为 NaN。 */
const relativeTime = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'always' });
const absoluteTime = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** 相对时间按完整单位显示；日期缺少时区时沿用本地时间，ISO 时间按接口偏移转换。 */
export function formatModificationTime(techMntTime: string, maintDate: string, now: number) {
  const timestamp = [techMntTime, maintDate]
    .map((value) => {
      const text = value.trim();
      return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);
    })
    .find(Number.isFinite);
  if (timestamp === undefined) return { relative: '暂无时间', absolute: '', dateTime: undefined };

  const seconds = (timestamp - now) / 1000;
  const units = [
    [365 * 86400, 'year'],
    [30 * 86400, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ] as const;
  const unit = units.find(([size]) => Math.abs(seconds) >= size);
  return {
    relative: unit ? relativeTime.format(Math.trunc(seconds / unit[0]), unit[1]) : '刚刚',
    absolute: absoluteTime.format(timestamp).replace(/\//g, '-'),
    dateTime: new Date(timestamp).toISOString(),
  };
}
