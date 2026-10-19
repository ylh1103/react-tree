/**
 * 应用共用的异步 thunk 入口：统一推导状态和派发类型，供各 Slice 复用。
 * Store 仅作为类型依赖导入，避免 Slice 加载时反向创建 Store；业务错误类型由各 thunk 自行声明。
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './index.ts';

/** 保留 createAsyncThunk 的原生生命周期、取消和 condition 行为，不封装业务流程。 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();
