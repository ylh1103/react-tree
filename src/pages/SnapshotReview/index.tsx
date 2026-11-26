import { Empty } from 'antd';

export default function SnapshotReviewPage() {
  return (
    <section className="mx-auto max-w-960px px-4 py-8 min-[640px]:px-8">
      <h2 className="m-0 mb-5 text-xl font-600">快照检视</h2>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="快照检视服务待接入" />
    </section>
  );
}
