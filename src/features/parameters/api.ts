import { mergeParameters } from '../grouped-list/model';
import type { ParameterItem } from '../grouped-list/types';
import { createHttpListApi, createListService } from '../grouped-list/service';
import { createLazyListApi } from '../grouped-list/lazyApi';

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
const api = baseUrl
  ? createHttpListApi<ParameterItem, 'paramDbTypeGroupInfo'>({
      items: `${baseUrl}/parameters`,
      groups: `${baseUrl}/parameters/groups`,
    })
  : createLazyListApi(() => import('./mock').then((module) => module.createApi()));

export const parameterService = createListService(api, 'paramDbTypeGroupInfo', mergeParameters);

export const deleteParameter = (key: string) => api.deleteItem(key);
