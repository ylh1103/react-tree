import { Alert, Button } from 'antd';
import { useRevalidator, useRouteError } from 'react-router';

export default function ListErrorPage() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  return (
    <main className="list-error-page">
      <Alert
        type="error"
        showIcon
        title="列表加载失败"
        description={error instanceof Error ? error.message : '请稍后重试'}
      />
      <Button onClick={() => revalidator.revalidate()} loading={revalidator.state === 'loading'}>
        重试
      </Button>
    </main>
  );
}
