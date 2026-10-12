/**
 * 数据库类型清单示例，仅供未配置真实接口时按需加载。
 * 类型名称、描述和维护方式沿用真实接口字段，UI 转换在查询层完成。
 */
import type { ParameterItem } from '../types/parameters';

export function createMockParameters() {
  const parameters: ParameterItem[] = [
    {
      paramTypeName: '数据库连接',
      paramTypeDesc: '数据库地址、连接池大小和连接超时',
      maintType: '1',
    },
    { paramTypeName: '缓存配置', paramTypeDesc: 'Redis 连接与缓存过期策略', maintType: '1' },
    { paramTypeName: '日志配置', paramTypeDesc: '日志级别、归档和保留周期', maintType: '1' },
    { paramTypeName: '消息队列', paramTypeDesc: '消息主题、消费者和重试策略', maintType: '0' },
    { paramTypeName: '业务开关', paramTypeDesc: '功能启停与灰度发布参数', maintType: '0' },
    { paramTypeName: '接口超时', paramTypeDesc: '外部接口调用超时和重试次数', maintType: '0' },
  ];

  return parameters;
}
