/** 新增与编辑共用一个按需加载入口，等待期间保留关闭操作。 */
import { lazy, Suspense, type ComponentProps } from 'react';
import { Modal, Spin } from 'antd';

const SystemManagementModal = lazy(() => import('./SystemManagementModal'));

export default function LazySystemManagementModal(
  props: ComponentProps<typeof SystemManagementModal>,
) {
  return (
    <Suspense
      fallback={
        <Modal
          open
          title={props.system ? '系统管理' : '新增系统'}
          footer={null}
          onCancel={props.onClose}
        >
          <div className="flex justify-center py-8" role="status" aria-label="正在加载">
            <Spin />
          </div>
        </Modal>
      }
    >
      <SystemManagementModal {...props} />
    </Suspense>
  );
}
