/** 新增与编辑共享表单；目录结果随当前输入派生，避免切换类型或快速输入时使用旧响应。 */
import { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal, Tooltip } from 'antd';
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
const fieldClassName = 'min-w-0 mb-0!';
const detailLabelClassName = 'text-13px leading-5 text-text-secondary';
const detailValueClassName = 'm-0 min-w-0 break-words text-sm leading-5';

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
  const owner = system ? system.systemCharges : [userName, employeeId].filter(Boolean).join('/');
  const approver = system?.approverCharge;

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
      centered
      width={660}
      classNames={{
        container: 'flex flex-col max-h-[calc(100dvh-32px)]',
        header: 'shrink-0 border-b border-b-solid border-divider pb-3',
        body: 'min-h-0 overflow-y-auto overscroll-contain py-2',
        footer: 'shrink-0 pt-1',
      }}
      title={system ? '编辑系统信息' : '新增系统'}
      okText={system ? '保存修改' : '提交申请'}
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
        labelAlign="left"
        labelCol={{ xs: { span: 24 }, sm: { flex: '148px' } }}
        wrapperCol={{ xs: { span: 24 }, sm: { flex: '1 1 0' } }}
        colon={false}
        className="grid gap-5"
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
        <section aria-label="系统信息" className="grid gap-3">
          {system ? (
            <Form.Item className={fieldClassName} label="系统名称">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="break-words font-semibold">{system.systemName}</span>
                <span className="text-13px text-text-secondary">
                  {isFtc ? 'FTC 金融交易云产品' : '普通系统'}
                </span>
              </div>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                className={fieldClassName}
                name="isFtc"
                label="系统类型"
                valuePropName="checked"
              >
                <Checkbox>FTC 金融交易云产品</Checkbox>
              </Form.Item>
              <Form.Item
                className={fieldClassName}
                name="systemName"
                label="系统名称"
                extra={isFtc ? '请填写 3 位产品代码' : '最多 10 个字符'}
                rules={[
                  { required: true, message: '请输入系统名称' },
                  {
                    pattern: isFtc ? ftcNamePattern : systemNamePattern,
                    message: isFtc
                      ? '请输入 3 位字母或数字'
                      : '仅支持 10 位以内的字母、数字、下划线和短横线',
                  },
                ]}
              >
                <Input placeholder={isFtc ? '如 CAC' : '字母、数字、下划线或短横线'} />
              </Form.Item>
            </>
          )}
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
          <Form.Item className={fieldClassName} label="系统描述" htmlFor="system-description">
            <Input.TextArea
              id="system-description"
              autoSize={{ minRows: 3, maxRows: 5 }}
              value={systemDesc}
              onChange={(event) => {
                setDescriptionDraft(event.target.value);
                if (mutation.isError) mutation.reset();
              }}
            />
          </Form.Item>
        </section>
        <section aria-label="目录与人员" className="min-w-0 rounded-control bg-sidebar px-4 py-3">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2">
            <h3 className="m-0 text-sm font-semibold">目录与人员</h3>
            <span className="text-13px text-text-secondary" role="status">
              {waiting ? '正在查询目录…' : ''}
            </span>
          </div>
          <dl className="m-0 grid gap-x-5 gap-y-2.5 min-[540px]:grid-cols-2">
            {[
              ['系统中文名', record?.systemChineseName],
              ['系统重要性等级', record?.sysRiskLevel],
              ['科室', record?.ownRoom],
              ['室组', record?.ownGroup],
            ].map(([label, value]) => (
              <div key={label} className="grid min-w-0 grid-cols-[106px_minmax(0,1fr)] gap-x-2">
                <dt className={detailLabelClassName}>{label}</dt>
                <dd className={detailValueClassName}>{value || '—'}</dd>
              </div>
            ))}
            <div className="grid min-w-0 grid-cols-[106px_minmax(0,1fr)] gap-x-2 border-t border-t-solid border-divider pt-2.5 min-[540px]:col-span-2">
              <dt className={detailLabelClassName}>系统负责人</dt>
              <dd className={detailValueClassName}>
                {owner
                  ? owner
                      .split(',')
                      .map((person) => person.trim())
                      .join('、')
                  : '—'}
              </dd>
            </div>
            <div className="grid min-w-0 grid-cols-[106px_minmax(0,1fr)] gap-x-2 min-[540px]:col-span-2">
              <dt className={`flex items-center self-start gap-1 ${detailLabelClassName}`}>
                指定审批人
                <Tooltip
                  title="低风险提权场景可指定审批人，未指定时默认由组长审批。如需修改，请联系平台人员。"
                  trigger={['hover', 'focus']}
                >
                  <Button
                    type="text"
                    size="small"
                    className="size-5! min-w-0! text-text-secondary!"
                    aria-label="审批人规则"
                    icon={<span className="i-lucide-circle-help size-3.5" aria-hidden="true" />}
                  />
                </Tooltip>
              </dt>
              <dd className={detailValueClassName}>{approver || '—'}</dd>
            </div>
          </dl>
        </section>
      </Form>
    </Modal>
  );
}
