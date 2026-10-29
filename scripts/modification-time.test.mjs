/** 修改摘要时间覆盖单位边界、接口时区、旧日期和无效响应回退。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { formatModificationTime } from '../src/pages/SystemApplications/components/modificationTime.ts';

const now = Date.parse('2026-10-29T08:00:00Z');

test('修改时间按完整单位显示，并兼容未来时间', () => {
  for (const [seconds, expected] of [
    [0, '刚刚'],
    [59, '刚刚'],
    [60, '1分钟前'],
    [3060, '51分钟前'],
    [3600, '1小时前'],
    [86400, '1天前'],
    [30 * 86400, '1个月前'],
    [365 * 86400, '1年前'],
    [-300, '5分钟后'],
  ]) {
    assert.equal(
      formatModificationTime(new Date(now - seconds * 1000).toISOString(), '', now).relative,
      expected,
    );
  }
});

test('优先使用带偏移的精确时间，旧日期回退，无效时间不影响展示', () => {
  const result = formatModificationTime('2026-10-29T15:09:00+08:00', '2026-02-03', now);
  assert.equal(result.relative, '51分钟前');
  assert.equal(result.dateTime, '2026-10-29T07:09:00.000Z');
  assert.match(result.absolute, /^2026-10-29 \d{2}:\d{2}:\d{2}$/);
  assert.ok(formatModificationTime('bad', '2026-10-28', now).dateTime);
  assert.deepEqual(formatModificationTime('bad', '', now), {
    relative: '暂无时间',
    absolute: '',
    dateTime: undefined,
  });
});
