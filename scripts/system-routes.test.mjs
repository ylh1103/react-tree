import assert from 'node:assert/strict';
import test from 'node:test';
import { matchRoutes } from 'react-router';
import { routeManifest } from '../src/routeManifest.ts';
import {
  applicationPath,
  databasePath,
  platformHome,
  systemPath,
} from '../src/features/systems/paths.ts';
import { filterSystems, isAccessDenied, roleLabel } from '../src/features/systems/model.ts';
import { mockSystems } from '../src/features/systems/mock.ts';

const match = (path) => matchRoutes(routeManifest, path)?.at(-1);

test('系统首页、默认入口及所有应用菜单匹配实际路由', () => {
  assert.equal(match('/').route.id, 'home');
  assert.equal(match('/systems/CAC').route.id, 'system-index');
  for (const page of [
    'overview',
    'application',
    'params',
    'search',
    'inspect',
    'exception',
    'compare',
    'apps-comparison',
    'setting',
  ]) {
    assert.equal(match(systemPath('CAC', page)).route.id, page);
  }
});

test('数据库设置优先匹配静态路由，不成为参数类型', () => {
  assert.equal(match('/systems/CAC/db').route.id, 'database');
  assert.equal(match('/systems/CAC/db/setting').route.id, 'database-setting');
  assert.equal(match('/systems/CAC/db/setting').params.paramTypeName, undefined);
  assert.equal(match('/systems/CAC/db/customer').params.paramTypeName, 'customer');
});

test('动态路径段正确编码中文、斜杠、空格、百分号与特殊符号', () => {
  const system = '核心 / 100% #?';
  const name = '类型 / 50% #?';
  const database = match(databasePath(system, name));
  const application = match(applicationPath(system, name));
  assert.equal(database.params.systemName, system);
  assert.equal(database.params.paramTypeName, name);
  assert.equal(application.params.appName, name);
});

test('切换入口仅保留系统与平台，不带原应用或类型', () => {
  assert.equal(
    platformHome('公共配置', 'application'),
    '/systems/%E5%85%AC%E5%85%B1%E9%85%8D%E7%BD%AE/overview',
  );
  assert.equal(platformHome('CAC', 'database'), '/systems/CAC/db');
});

test('未知地址进入对应的 404 页面', () => {
  assert.equal(match('/unknown').route.id, 'site-not-found');
  assert.equal(match('/systems/CAC/unknown').route.id, 'system-not-found');
  assert.equal(match('/systems/CAC/db/type/extra').route.id, 'system-not-found');
});

test('搜索覆盖英文名、中文名和编号，同时支持角色筛选', () => {
  assert.equal(filterSystems(mockSystems, ' cac ')[0].systemName, 'CAC');
  assert.equal(filterSystems(mockSystems, 'LL57.CAC')[0].systemName, 'CAC');
  assert.ok(filterSystems(mockSystems, '信用卡核心', 'D').every((system) => system.role === 'D'));
  assert.equal(filterSystems(mockSystems, '不存在').length, 0);
  assert.equal(filterSystems(mockSystems, '', 'V').length, 2);
  assert.equal(roleLabel('R'), '系统负责人');
  assert.equal(roleLabel('D'), '开发者');
  assert.equal(roleLabel('V'), '观察者');
  assert.equal(roleLabel('unknown'), '未知角色');
  assert.equal(roleLabel('toString'), '未知角色');
});

test('识别请求封装后的 403，网络和其他错误保留重试路径', () => {
  assert.equal(
    isAccessDenied(new Error('请求失败', { cause: { response: { status: 403 } } })),
    true,
  );
  assert.equal(isAccessDenied(new Error('网络请求失败')), false);
  assert.equal(isAccessDenied({ response: { status: 500 } }), false);
});
