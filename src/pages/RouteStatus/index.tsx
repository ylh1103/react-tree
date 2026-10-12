import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';

export default function RouteStatusPage({ forbidden = false }: { forbidden?: boolean }) {
  const navigate = useNavigate();
  return (
    <Result
      status={forbidden ? '403' : '404'}
      title={forbidden ? '无权访问此系统' : '页面或系统不存在'}
      subTitle="请返回我的系统，选择可访问的系统。"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回我的系统
        </Button>
      }
    />
  );
}
