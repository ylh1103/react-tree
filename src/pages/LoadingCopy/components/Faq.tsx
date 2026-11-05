/** 常见问题展示及其折叠交互，随首页路由一并懒加载。 */
import Collapse from 'antd/es/collapse';
import { faq } from '../model/faq';

export default function Faq() {
  return (
    <Collapse
      ghost
      expandIconPlacement="end"
      expandIcon={({ isActive }) =>
        isActive ? (
          <span aria-hidden="true" className="i-lucide-minus size-1em align-middle " />
        ) : (
          <span aria-hidden="true" className="i-lucide-plus size-1em align-middle " />
        )
      }
      className="[&_.ant-collapse-item]:mb-8px [&_.ant-collapse-item]:rounded-12px! [&_.ant-collapse-item]:bg-surface [&_.ant-collapse-header]:px-20px! [&_.ant-collapse-header]:py-17px! [&_.ant-collapse-header-text]:text-14px [&_.ant-collapse-body]:text-13px [&_.ant-collapse-body]:leading-[1.65] [&_.ant-collapse-body]:text-text-secondary"
      items={faq.map(({ q, a }, index) => ({
        key: String(index),
        label: q,
        children: <p className="m-0">{a}</p>,
      }))}
    />
  );
}
