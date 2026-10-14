/** 会话状态仅保存可序列化身份；请求编号防止失效后迟到的登录结果重新授权。 */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { loadSession } from '../../api/session.ts';
import type { SessionUser } from '../../types/session.ts';
import { settingsFromDocument } from '../../types/userSettings.ts';
import { initializePreferences, resetPreferences, invalidPreferences } from './preferencesSlice.ts';

interface SessionState {
  user: SessionUser | null;
  status: 'idle' | 'loading' | 'ready' | 'error' | 'expired';
  requestId: string | null;
  error: string | null;
}
const initialState: SessionState = { user: null, status: 'idle', requestId: null, error: null };
export const initializeSession = createAsyncThunk(
  'session/initialize',
  async (_, { dispatch, signal }) => {
    const user = await loadSession(signal);
    signal.throwIfAborted();
    dispatch(resetPreferences());
    try {
      dispatch(initializePreferences(settingsFromDocument(user.userSetting)));
    } catch {
      dispatch(invalidPreferences('用户设置 JSON 无效，请重新读取后再保存'));
    }
    return user;
  },
);
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    expireSession(state) {
      state.user = null;
      state.status = 'expired';
      state.requestId = null;
      state.error = '登录状态已失效';
    },
    updateSessionSettings(state, action: PayloadAction<string>) {
      if (state.user) state.user.userSetting = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.pending, (state, action) => {
        state.user = null;
        state.status = 'loading';
        state.requestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.user = action.payload;
        state.status = 'ready';
        state.requestId = null;
      })
      .addCase(initializeSession.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = 'error';
        state.error = action.error.message ?? '登录信息读取失败';
        state.requestId = null;
      });
  },
});
export const { expireSession, updateSessionSettings } = sessionSlice.actions;
export default sessionSlice.reducer;
