/** 应用资料独立编辑；保存只刷新对应系统清单及本应用环境，表单错误保留输入。 */
import { Alert, Button, Checkbox, Form, Input, Radio, Select, Space, Spin } from 'antd';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saveApplication } from '@/api/applications';
import type { ListNode } from '@/components/GroupedList/types';
import { applicationEnvironmentsOptions } from '@/queries/applicationEnvironments';
import { applicationDetailsOptions } from '@/queries/applications';
import { applicationListId, groupedListKeys } from '@/queries/groupedList';
import {
  applicationEnvironmentTags,
  defaultApplicationEnvironmentTags,
  type ApplicationDetails,
  type ApplicationItem,
} from '@/types/applications';

interface ApplicationFormProps {
  systemName: string;
  appName?: string;
  title: string;
  applications: ListNode[];
  onClose: () => void;
}

export default function ApplicationForm({
  systemName,
  appName,
  title,
  applications,
  onClose,
}: ApplicationFormProps) {
  const client = useQueryClient();
  const details = useQuery({
    ...applicationDetailsOptions(systemName, appName ?? ''),
    enabled: appName !== undefined,
  });
  const listKey = groupedListKeys.list(applicationListId(systemName));
  const mutationKey = groupedListKeys.write(applicationListId(systemName));
  const writing = useIsMutating({ mutationKey }) > 0;
  const save = useMutation({
    mutationKey,
    mutationFn: async (values: ApplicationDetails) => {
      const name = appName ?? values.appName.trim();
      const environmentKey = applicationEnvironmentsOptions(systemName, name).queryKey;
      await client.cancelQueries({ queryKey: listKey, exact: true });
      const item = await saveApplication(
        systemName,
        {
          ...values,
          appName: name,
          appDesc: values.appDesc.trim(),
          releaseUnit: values.releaseUnit.trim(),
        },
        appName !== undefined,
      );
      // 提交后取消旧读取并更新清单快照，现有分组和当前应用始终可用。
      await client.cancelQueries({ queryKey: listKey, exact: true });
      client.setQueryData<ListNode[]>(listKey, (nodes) => {
        if (!nodes) return nodes;
        const leaf = {
          key: item.appName,
          title: item.appName,
          desc: item.appDesc,
          appType: item.appType,
        };
        return appName ? updateLeaf(nodes, item) : [...nodes, leaf];
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: listKey, exact: true }),
        client.invalidateQueries({
          queryKey: applicationDetailsOptions(systemName, name).queryKey,
          exact: true,
        }),
        client.invalidateQueries({ queryKey: environmentKey, exact: true }),
      ]);
    },
    onSuccess: onClose,
  });

  const editing = appName !== undefined;
  return (
    <section className="min-h-full bg-surface p-4 sm:p-6" aria-label={title}>
      <div className="max-w-960px">
        {editing && details.isPending ? (
          <div
            className="grid min-h-160px place-items-center"
            role="status"
            aria-label="正在加载应用资料"
          >
            <Spin />
          </div>
        ) : editing && !details.data ? (
          <Alert
            type="error"
            showIcon
            title="应用资料加载失败"
            description={details.error?.message}
            action={
              <Space>
                <Button loading={details.isFetching} onClick={() => void details.refetch()}>
                  重试
                </Button>
                <Button onClick={onClose}>取消</Button>
              </Space>
            }
          />
        ) : (
          <>
            {save.error && (
              <Alert
                className="mb-4"
                type="error"
                showIcon
                title="保存应用失败"
                description={save.error.message}
              />
            )}
            <Form<ApplicationDetails>
              layout="vertical"
              requiredMark
              initialValues={
                details.data ?? {
                  appType: '0',
                  envTags: defaultApplicationEnvironmentTags,
                  sharedModules: [],
                }
              }
              disabled={writing}
              onFinish={(values) => {
                // 在 React 提交按钮状态前也能拦截连续提交和其他分组写入。
                if (!client.isMutating({ mutationKey })) save.mutate(values);
              }}
            >
              <Form.Item name="appType" label="应用类型" rules={[{ required: true }]}>
                <Radio.Group
                  disabled={editing || writing}
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { value: '0', label: '业务应用' },
                    { value: '1', label: '公共模块' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="appName"
                label="应用名称"
                rules={
                  editing
                    ? []
                    : [
                        { required: true, message: '请输入应用名称' },
                        {
                          pattern: /^[a-z0-9_-]+$/i,
                          message: '仅支持英文字母、数字、下划线和连字符',
                        },
                      ]
                }
              >
                <Input disabled={editing || writing} placeholder="请输入应用名称" />
              </Form.Item>
              <Form.Item
                name="releaseUnit"
                label="发布单元"
                rules={[{ required: true, whitespace: true, message: '请输入发布单元' }]}
              >
                <Input placeholder="请输入发布单元" />
              </Form.Item>
              <Form.Item
                name="appDesc"
                label="应用描述"
                rules={[{ required: true, whitespace: true, message: '请输入应用描述' }]}
              >
                <Input placeholder="请输入应用描述" />
              </Form.Item>
              <Form.Item
                name="envTags"
                label="环境标识"
                rules={[{ required: true, type: 'array', min: 1, message: '至少选择一个环境' }]}
              >
                <Checkbox.Group
                  className="gap-x-3 gap-y-2"
                  options={[
                    ...new Set([...applicationEnvironmentTags, ...(details.data?.envTags ?? [])]),
                  ]}
                />
              </Form.Item>
              <Form.Item name="sharedModules" label="关联公共模块">
                <Select
                  mode="multiple"
                  placeholder="请选择公共模块"
                  options={applications
                    .filter((item) => item.appType === '1' && item.key !== appName)
                    .map((item) => ({ value: item.key, label: item.title }))}
                />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={save.isPending}>
                  保存
                </Button>
                <Button onClick={onClose}>取消</Button>
              </Space>
            </Form>
          </>
        )}
        {editing && details.isPending && <Button onClick={onClose}>取消</Button>}
      </div>
    </section>
  );
}

function updateLeaf(nodes: ListNode[], item: ApplicationItem): ListNode[] {
  return nodes.map((node) => {
    if (node.children) return { ...node, children: updateLeaf(node.children, item) };
    return node.key === item.appName
      ? { ...node, desc: item.appDesc, appType: item.appType }
      : node;
  });
}
