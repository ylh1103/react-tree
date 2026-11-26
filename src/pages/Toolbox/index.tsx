import { Empty } from 'antd';

export default function ToolboxPage() {
  return (
    <section className="mx-auto max-w-960px px-4 py-8 min-[640px]:px-8">
      <h2 className="m-0 mb-5 text-xl font-600">小工具</h2>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用工具" />
    </section>
  );
}
