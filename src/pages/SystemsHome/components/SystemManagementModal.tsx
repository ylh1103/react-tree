/** 新增与编辑共享表单；目录结果随当前输入派生，避免切换类型或快速输入时使用旧响应。 */
import { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'ahooks';
import { createSystem, updateSystem } from '@/api/systems';
import { ftcSubsystemOptions, subsystemMetadataOptions } from '@/queries/systems';
import { useAppSelector } from '@/store/hooks';
import type { SystemInfo } from '@/types/systems';

interface FormValues {
  isFtc: boolean;
  systemName: string;
  systemArchNo: string;
}

const ftcNamePattern = /^[a-z0-9]{3}$/i;
const systemNamePattern = /^[a-z0-9_-]{1,10}$/i;
const fieldClassName = 'mb-2.5!';

export default function SystemManagementModal({
  system,
  onClose,
  onSaved,
}: {
  system?: SystemInfo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<FormValues>();
  const [descriptionDraft, setDescriptionDraft] = useState<string>();
  const isFtc = Form.useWatch('isFtc', form) ?? system?.isFtc ?? false;
  const systemName = Form.useWatch('systemName', form) ?? system?.systemName ?? '';
  const typedCode = (Form.useWatch('systemArchNo', form) ?? system?.systemArchNo ?? '').trim();
  const userName = useAppSelector((state) => state.user.userInfo?.userName);
  const employeeId = useAppSelector((state) => state.user.userInfo?.employeeId);

  const lookupName =
    !system && isFtc && ftcNamePattern.test(systemName) ? systemName.toUpperCase() : '';
  const delayedName = useDebounce(lookupName, { wait: 300 });
  const nameKey = lookupName === delayedName ? lookupName : '';
  const ftc = useQuery({ ...ftcSubsystemOptions(nameKey), enabled: !!nameKey });
  const code = !system && isFtc ? (ftc.data?.systemArchNo ?? '') : typedCode;
  const savedCode = !!system && code === system.systemArchNo;
  const lookupCode = savedCode ? '' : code;
  const delayedCode = useDebounce(lookupCode, { wait: 300 });
  const codeKey = lookupCode === delayedCode ? lookupCode : '';
  const metadata = useQuery({ ...subsystemMetadataOptions(codeKey), enabled: !!codeKey });
  const record = savedCode ? system : metadata.data;
  // 手动输入优先于在途查询；切换查询来源时重新使用对应目录描述。
  const systemDesc = descriptionDraft ?? record?.systemDesc ?? '';
  const lookupError = ftc.error ?? metadata.error;
  const waiting =
    (!!lookupName && (!nameKey || ftc.isPending)) ||
    (!!lookupCode && (!codeKey || metadata.isPending));
  const missingProduct = !!nameKey && ftc.isSuccess && !ftc.data;
  const missingCode = !!codeKey && metadata.isSuccess && !metadata.data;
  const canSubmit =
    !waiting && !lookupError && (!lookupCode || !!metadata.data) && (!!system || !isFtc || !!code);

  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input = { systemArchNo: code, systemDesc };
      return system
        ? updateSystem(system.systemName, input)
        : createSystem({ ...input, systemName: values.systemName, isFtc: values.isFtc });
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['systems'] }),
        ...(system
          ? [client.invalidateQueries({ queryKey: ['system-access', system.systemName] })]
          : []),
      ]);
      onSaved();
    },
  });

  return (
    <Modal
      open
      width={700}
      title={system ? '系统管理' : '新增系统'}
      okText={system ? '保存' : '提交新系统创建申请'}
      cancelText="取消"
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
      mask={{ closable: !mutation.isPending }}
      closable={!mutation.isPending}
      keyboard={!mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      okButtonProps={{ disabled: !canSubmit }}
      confirmLoading={mutation.isPending}
      onOk={() => form.submit()}
    >
      {mutation.error && (
        <Alert className="mb-3" type="error" showIcon title={mutation.error.message} />
      )}
      {lookupError && (
        <Alert
          className="mb-3"
          type="error"
          showIcon
          title={lookupError.message}
          action={
            <Button
              size="small"
              onClick={() => void (ftc.error ? ftc.refetch() : metadata.refetch())}
            >
              重试
            </Button>
          }
        />
      )}
      <Form
        form={form}
        initialValues={{
          isFtc: system?.isFtc ?? false,
          systemName: system?.systemName ?? '',
          systemArchNo: system?.systemArchNo ?? '',
        }}
        labelCol={{ xs: { span: 24 }, sm: { flex: '136px' } }}
        wrapperCol={{ xs: { span: 24 }, sm: { flex: 'auto' } }}
        disabled={mutation.isPending}
        onValuesChange={(changed: Partial<FormValues>) => {
          if (changed.isFtc !== undefined) form.setFieldValue('systemArchNo', '');
          if (
            changed.isFtc !== undefined ||
            (changed.systemArchNo !== undefined && changed.systemArchNo.trim() !== typedCode) ||
            (isFtc &&
              changed.systemName !== undefined &&
              changed.systemName.toUpperCase() !== systemName.toUpperCase())
          ) {
            setDescriptionDraft(undefined);
          }
          if (mutation.isError) mutation.reset();
        }}
        onFinish={(values) => {
          if (canSubmit && !mutation.isPending) mutation.mutate(values);
        }}
      >
        <Form.Item className={fieldClassName} name="isFtc" label="系统类型" valuePropName="checked">
          <Checkbox disabled={!!system}>FTC 金融交易云的产品请勾选我</Checkbox>
        </Form.Item>
        <Form.Item
          className={fieldClassName}
          name="systemName"
          label="系统名称"
          extra={
            system
              ? undefined
              : isFtc
                ? '请填写 3 位产品代码，如 CAC'
                : '请输入 10 个字符以内的系统英文名'
          }
          rules={
            system
              ? []
              : [
                  { required: true, message: '请输入系统名称' },
                  {
                    pattern: isFtc ? ftcNamePattern : systemNamePattern,
                    message: isFtc
                      ? '请输入 3 位字母或数字'
                      : '仅支持 10 位以内的字母、数字、下划线和短横线',
                  },
                ]
          }
        >
          <Input disabled={!!system} placeholder="支持英文、数字、下划线、短横线" />
        </Form.Item>
        {!system && isFtc ? (
          <Form.Item
            className={fieldClassName}
            label="架构办子系统编码"
            htmlFor="ftc-subsystem-code"
            help={missingProduct ? '未找到该 FTC 产品' : undefined}
            validateStatus={missingProduct ? 'error' : undefined}
          >
            <Input id="ftc-subsystem-code" disabled value={code} placeholder="按系统名称查询" />
          </Form.Item>
        ) : (
          <Form.Item
            className={fieldClassName}
            name="systemArchNo"
            label="架构办子系统编码"
            help={missingCode ? '未找到该子系统编码' : undefined}
            validateStatus={missingCode ? 'error' : undefined}
          >
            <Input disabled={isFtc} placeholder="如 LL57.CAC" />
          </Form.Item>
        )}
        <div className="sr-only" role="status">
          {waiting ? '正在查询子系统资料' : ''}
        </div>
        <Form.Item className={fieldClassName} label="系统重要性等级" htmlFor="system-risk-level">
          <Input id="system-risk-level" disabled value={record?.sysRiskLevel ?? ''} />
        </Form.Item>
        <Form.Item className={fieldClassName} label="系统中文名" htmlFor="system-chinese-name">
          <Input id="system-chinese-name" disabled value={record?.systemChineseName ?? ''} />
        </Form.Item>
        <Form.Item className={fieldClassName} label="系统描述" htmlFor="system-description">
          <Input.TextArea
            id="system-description"
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={systemDesc}
            onChange={(event) => {
              setDescriptionDraft(event.target.value);
              if (mutation.isError) mutation.reset();
            }}
          />
        </Form.Item>
        <Form.Item className={fieldClassName} label="科室" htmlFor="system-room">
          <Input id="system-room" disabled value={record?.ownRoom ?? ''} />
        </Form.Item>
        <Form.Item className={fieldClassName} label="室组" htmlFor="system-group">
          <Input id="system-group" disabled value={record?.ownGroup ?? ''} />
        </Form.Item>
        <Form.Item className={fieldClassName} label="系统负责人">
          {(system ? system.systemCharges : [userName, employeeId].filter(Boolean).join('/')) ||
            '—'}
        </Form.Item>
        <Form.Item
          className="mb-0!"
          label="指定审批人"
          tooltip="低风险提权场景可指定审批人，未指定时默认由组长审批。如需修改，请联系平台人员。"
        >
          {system?.approverCharge || '—'}
        </Form.Item>
      </Form>
    </Modal>
  );
}
