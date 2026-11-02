/** 临时登录页：独立选择平台角色和网络环境，持久化完整资料并写入 Redux，再回到原目标页面。 */
import { useState, type SubmitEvent } from 'react';
import { Alert, Button, Radio } from 'antd';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppDispatch } from '@/store/hooks';
import { setUserInfo } from '@/store/slices/userSlice';
import { createDemoLoginUser } from '@/mocks/login';
import { queryClient } from '@/queries/client';
import { writeLoginUser } from '@/utils/loginStorage';
import { loginReturnTo } from '@/router/login';
import type { LoginUser } from '@/types/user';

export default function Login() {
  const [role, setRole] = useState<LoginUser['userType']>('1');
  const [netEnv, setNetEnv] = useState<LoginUser['netEnv']>('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = createDemoLoginUser(role, netEnv);
      writeLoginUser(user);
      // 主动重新登录也会切换角色；释放旧身份业务缓存及在途查询。
      queryClient.clear();
      dispatch(setUserInfo(user));
      await navigate(loginReturnTo(searchParams.get('redirect')), { replace: true });
    } catch {
      setError('登录失败，请确认浏览器允许本地存储后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-canvas p-8 text-text">
      <section className="w-400px rounded-ui border border-solid border-border-subtle bg-surface p-8">
        <h1 className="m-0 text-24px font-600">登录灵动参数管家</h1>
        <p className="mb-6 text-text-secondary">选择角色和网络环境后继续访问</p>
        <form onSubmit={(event) => void handleLogin(event)} className="flex flex-col gap-5">
          <div>
            <div id="login-role-label" className="mb-3 font-500">
              登录角色
            </div>
            <Radio.Group
              aria-labelledby="login-role-label"
              name="login-role"
              value={role}
              disabled={submitting}
              onChange={(event) => setRole(event.target.value as LoginUser['userType'])}
              options={[
                { label: '平台人员', value: '0' },
                { label: '普通用户', value: '1' },
              ]}
            />
          </div>
          <div>
            <div id="login-network-label" className="mb-3 font-500">
              网络环境
            </div>
            <Radio.Group
              aria-labelledby="login-network-label"
              name="login-network"
              value={netEnv}
              disabled={submitting}
              onChange={(event) => setNetEnv(event.target.value as LoginUser['netEnv'])}
              options={[
                { label: '办公网', value: '0' },
                { label: '互联网', value: '1' },
                { label: '业务网', value: '2' },
              ]}
            />
          </div>
          {error && <Alert type="error" showIcon title={error} />}
          <Button type="primary" htmlType="submit" block loading={submitting}>
            登录
          </Button>
        </form>
      </section>
    </main>
  );
}
