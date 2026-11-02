/** 登录资料的内存副本；持久化由登录事件处理，reducer 不访问浏览器存储。 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoginUser } from '@/types/user.ts';

interface UserState {
  userInfo: LoginUser | null;
}

const initialState: UserState = { userInfo: null };
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo(state, action: PayloadAction<LoginUser | null>) {
      state.userInfo = action.payload;
    },
  },
});

export const { setUserInfo } = userSlice.actions;
export default userSlice.reducer;
