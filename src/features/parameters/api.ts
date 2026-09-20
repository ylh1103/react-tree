import { mergeParameters } from '../grouped-list/model';
import type { ParameterItem } from '../grouped-list/model';
import { createHttpListApi, createListService } from '../grouped-list/service';
import { createMockListApi } from '../grouped-list/mockApi';

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

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
const api = baseUrl
  ? createHttpListApi<ParameterItem, 'paramDbTypeGroupInfo'>({
      items: `${baseUrl}/parameters`,
      groups: `${baseUrl}/parameters/groups`,
    })
  : createMockListApi('/mock-api/parameters', parameters, 'paramDbTypeGroupInfo');

export const parameterService = createListService(api, 'paramDbTypeGroupInfo', mergeParameters);
