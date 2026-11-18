import assert from 'node:assert/strict';
import test from 'node:test';
import { loginPath, loginReturnTo } from '../src/router/login.ts';
import { readSystemJoinLink, systemJoinRequestPath } from '../src/utils/systemJoinLink.ts';

test('申请链接跨设备传递申请信息，登录回跳保留经过编码的值', () => {
  const request = {
    ystId: '工号+123',
    userName: '陈 & 李',
    systemName: 'PAY_01',
    systemChineseName: '支付/结算 & 对账',
    role: 'D',
  };
  const sharePath = systemJoinRequestPath(request);
  const loginUrl = new URL(loginPath(sharePath), 'https://example.test');
  const returnTo = loginReturnTo(loginUrl.searchParams.get('redirect'));
  assert.equal(returnTo, sharePath);
  assert.deepEqual(
    readSystemJoinLink(new URL(returnTo, 'https://example.test').searchParams),
    request,
  );
});

test('申请详情拒绝缺失字段及无效角色', () => {
  for (const query of [
    'systemName=CAC&role=V',
    'ystId=123&systemName=+&role=V',
    'ystId=123&systemName=CAC&role=toString',
  ]) {
    assert.equal(readSystemJoinLink(new URLSearchParams(query)), null);
  }
});

test('旧版申请链接没有姓名和系统中文名时仍可读取', () => {
  assert.deepEqual(readSystemJoinLink(new URLSearchParams('ystId=123&systemName=CAC&role=V')), {
    ystId: '123',
    userName: '',
    systemName: 'CAC',
    systemChineseName: '',
    role: 'V',
  });
});
