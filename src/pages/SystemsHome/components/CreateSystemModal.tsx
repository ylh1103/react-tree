/** 新增系统表单：人员/组织结构在界面内输入，提交时转换为现有字符串契约。 */
import { Alert, Button, Form, Input, Modal, Select } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSystem } from '@/api/systems';
import type { CreateSystemInput } from '@/types/systems';
interface FormValues extends CreateSystemInput {
  roomId?: string;
  roomName?: string;
  groupId?: string;
  groupName?: string;
  approvers?: { name: string; id: string }[];
}
export default function CreateSystemModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form] = Form.useForm<FormValues>();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: createSystem,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['systems'] });
      onCreated();
    },
  });
  return (
    <Modal
      open
      title="新增系统"
      okText="创建"
      cancelText="取消"
      onCancel={onClose}
      mask={{ closable: !mutation.isPending }}
      closable={!mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
    >
      {mutation.error && (
        <Alert className="mb-4" type="error" showIcon title={mutation.error.message} />
      )}
      <Form
        form={form}
        layout="vertical"
        disabled={mutation.isPending}
        onFinish={(value) => {
          const { roomId, roomName, groupId, groupName, approvers, ...input } = value;
          mutation.mutate({
            ...input,
            ownRoom: roomId && roomName ? `${roomId}/${roomName}` : '',
            ownGroup: groupId && groupName ? `${groupId}/${groupName}` : '',
            approverCharge:
              approvers?.map((person) => `${person.name.trim()}/${person.id.trim()}`).join(',') ??
              '',
          });
        }}
      >
        <Form.Item
          name="systemName"
          label="系统英文名"
          rules={[{ required: true, whitespace: true, message: '请输入系统英文名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="systemChineseName"
          label="系统中文名"
          rules={[{ required: true, whitespace: true, message: '请输入系统中文名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="systemArchNo"
          label="架构编码"
          rules={[{ required: true, whitespace: true, message: '请输入架构编码' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="systemDesc" label="系统描述">
          <Input.TextArea rows={3} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-3">
          <Form.Item name="roomId" label="所属科室编号">
            <Input />
          </Form.Item>
          <Form.Item name="roomName" label="所属科室名称">
            <Input />
          </Form.Item>
          <Form.Item name="groupId" label="所属室组编号">
            <Input />
          </Form.Item>
          <Form.Item name="groupName" label="所属室组名称">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="sysRiskLevel" label="重要性等级">
          <Select
            allowClear
            placeholder="未配置"
            options={['A', 'B', 'C', 'D'].map((value) => ({ value, label: value }))}
          />
        </Form.Item>
        <Form.List name="approvers">
          {(fields, { add, remove }) => (
            <>
              <div className="mb-2">指定审批人（可选）</div>
              {fields.map(({ key, name }) => (
                <div key={key} className="flex gap-2">
                  <Form.Item
                    name={[name, 'name']}
                    rules={[{ required: true, whitespace: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="姓名" />
                  </Form.Item>
                  <Form.Item
                    name={[name, 'id']}
                    rules={[{ required: true, whitespace: true, message: '请输入编号' }]}
                  >
                    <Input placeholder="员工编号" />
                  </Form.Item>
                  <Button onClick={() => remove(name)}>移除</Button>
                </div>
              ))}
              <Button type="dashed" onClick={() => add()}>
                添加审批人
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
