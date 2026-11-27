/** 新增与编辑共享表单；目录结果随当前输入派生，避免切换类型或快速输入时使用旧响应。 */
import { useState, type ReactNode } from 'react';
import { Alert, Avatar, Button, Checkbox, Form, Input, Modal, Skeleton, Tag, Tooltip } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'ahooks';
import { createSystem, updateSystem } from '@/api/systems';
import { ftcSubsystemOptions, subsystemMetadataOptions } from '@/queries/systems';
import { useAppSelector } from '@/store/hooks';
import type { SystemInfo } from '@/types/systems';
import { peopleList } from '@/utils/systemPeople';
import { riskLevelAppearance, systemAvatarTone } from '../systemAppearance';

interface FormValues {
  isFtc: boolean;
  systemName: string;
  systemArchNo: string;
}

// 新增名称随系统类型限制长度；编辑名称不可改，仅校验历史数据格式（允许小数点）。
const ftcNamePattern = /^[a-z0-9_-]{1,3}$/i;
const editNamePattern = /^[a-z0-9_.-]+$/i;
const archCodePattern = /^[a-z0-9_.]{1,100}$/i;
const ownerPreviewLimit = 3;

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
  const watchedFtc = Form.useWatch('isFtc', form) ?? true;
  const isFtc = system ? (system.isFtc ?? false) : watchedFtc;
  const systemName = Form.useWatch('systemName', form) ?? system?.systemName ?? '';
  const typedCode = (Form.useWatch('systemArchNo', form) ?? system?.systemArchNo ?? '').trim();
  const userName = useAppSelector((state) => state.user.userInfo?.userName);
  const employeeId = useAppSelector((state) => state.user.userInfo?.employeeId);

  const lookupName =
    !system && isFtc && ftcNamePattern.test(systemName.trim())
      ? systemName.trim().toUpperCase()
      : '';
  const delayedName = useDebounce(lookupName, { wait: 300 });
  const nameKey = lookupName === delayedName ? lookupName : '';
  const ftc = useQuery({ ...ftcSubsystemOptions(nameKey), enabled: !!nameKey });
  const code = !system && isFtc ? (ftc.data?.systemArchNo ?? '') : typedCode;
  const savedCode = !!system && code === system.systemArchNo;
  const lookupCode = savedCode || !archCodePattern.test(code) ? '' : code;
  const delayedCode = useDebounce(lookupCode, { wait: 300 });
  const codeKey = lookupCode === delayedCode ? lookupCode : '';
  const metadata = useQuery({ ...subsystemMetadataOptions(codeKey), enabled: !!codeKey });
  const record = savedCode ? system : metadata.data;
  const directoryMatched = Boolean(code && (savedCode || metadata.data));
  // 查询为空时清空目录资料，不沿用旧响应。
  const shownRecord = directoryMatched ? record : undefined;
  // 手动输入优先于在途查询；切换查询来源时重新使用对应目录描述。
  const systemDesc = descriptionDraft ?? shownRecord?.systemDesc ?? '';
  const lookupError = ftc.error ?? metadata.error;
  const waiting =
    (!!lookupName && (!nameKey || ftc.isPending)) ||
    (!!lookupCode && (!codeKey || metadata.isPending));
  const missingProduct = !!nameKey && ftc.isSuccess && !ftc.data;
  const missingCode = !!codeKey && metadata.isSuccess && !metadata.data;
  // 架构办编码必须查询到目录资料；为空、格式不合法或查询为空均不可提交。
  const canSubmit = !waiting && !lookupError && directoryMatched && archCodePattern.test(code);

  const owners = uniquePeople(
    system ? system.systemCharges : [userName, employeeId].filter(Boolean).join('/'),
  );
  const approvers = uniquePeople(system?.approverCharge);

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

  const codeStatusSuffix = waiting ? (
    <span
      className="i-lucide-loader-circle size-14px text-accent-text animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  ) : missingProduct || missingCode ? (
    <span className="i-lucide-circle-alert size-14px text-danger" aria-hidden="true" />
  ) : directoryMatched ? (
    <span className="i-lucide-circle-check size-14px text-success" aria-hidden="true" />
  ) : null;

  return (
    <Modal
      open
      centered
      width="min(600px, calc(100vw - 32px))"
      title={<span className="text-18px font-600">{system ? '系统管理' : '新增系统'}</span>}
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
      classNames={{ body: 'pt-2!' }}
    >
      {mutation.error && (
        <Alert className="mb-4!" type="error" showIcon title={mutation.error.message} />
      )}
      {lookupError && (
        <Alert
          className="mb-4!"
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
        layout="vertical"
        requiredMark
        className="[&_.ant-form-item-label]:pb-1.5! [&_.ant-form-item-extra]:mt-1! [&_.ant-form-item-extra]:text-12px! [&_.ant-form-item-extra]:leading-18px! [&_.ant-form-item-explain-error]:text-12px! [&_.ant-form-item-explain-error]:leading-18px!"
        initialValues={{
          isFtc: true,
          systemName: system?.systemName ?? '',
          systemArchNo: system?.systemArchNo ?? '',
        }}
        disabled={mutation.isPending}
        onValuesChange={(changed: Partial<FormValues>) => {
          // 切换系统类型时重置名称与编码，避免沿用另一类型的输入。
          if (changed.isFtc !== undefined) form.resetFields(['systemName', 'systemArchNo']);
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
        <div>
          {!system && (
            <Form.Item className="mb-3!" name="isFtc" valuePropName="checked">
              <Checkbox>
                <span className="text-14px font-500 text-text">FTC 金融交易云产品</span>
                <span className="ml-2 text-12px text-text-secondary">
                  勾选后按 3 位产品代码自动匹配编码
                </span>
              </Checkbox>
            </Form.Item>
          )}

          <div className="grid grid-cols-1 gap-x-4 min-[520px]:grid-cols-2">
            <Form.Item
              className="mb-4!"
              name="systemName"
              label="系统名称"
              validateFirst
              extra={
                system
                  ? '系统名称创建后不可修改'
                  : isFtc
                    ? '请填写3位产品代码，如CAC'
                    : '请输入10字符以内有意义的系统英文名'
              }
              rules={[
                { required: true, whitespace: true, message: '请输入系统名称' },
                system
                  ? {
                      pattern: editNamePattern,
                      message: '仅支持英文、数字、下划线、短横线和小数点',
                    }
                  : {
                      pattern: /^[a-z0-9_-]+$/i,
                      message: '仅支持英文、数字、下划线和短横线',
                    },
                ...(system ? [] : [{ max: isFtc ? 3 : 10, message: `最多 ${isFtc ? 3 : 10} 位` }]),
              ]}
            >
              <Input
                allowClear={!system}
                disabled={!!system}
                maxLength={system ? undefined : isFtc ? 3 : 10}
                showCount={!system}
                placeholder={isFtc ? '如 CAC' : '如 ParamPlat'}
              />
            </Form.Item>

            {!system && isFtc ? (
              <Form.Item
                className="mb-4!"
                label="架构办子系统编码"
                required
                htmlFor="ftc-subsystem-code"
                extra={missingProduct ? undefined : '由有效的系统名称自动查询，不可编辑'}
                help={missingProduct ? '未找到该 FTC 产品，请检查产品代码' : undefined}
                validateStatus={missingProduct ? 'error' : undefined}
              >
                <Input
                  id="ftc-subsystem-code"
                  disabled
                  value={code}
                  placeholder="输入有效系统名称后自动填入"
                  suffix={codeStatusSuffix}
                />
              </Form.Item>
            ) : (
              <Form.Item
                className="mb-4!"
                name="systemArchNo"
                label="架构办子系统编码"
                validateFirst
                extra={
                  missingCode
                    ? undefined
                    : isFtc
                      ? 'FTC 金融交易云产品编码由架构目录绑定，不可编辑'
                      : '填写后自动查询并同步下方目录信息'
                }
                help={missingCode ? '未找到该子系统编码，请检查后重试' : undefined}
                validateStatus={missingCode ? 'error' : undefined}
                rules={[
                  { required: true, whitespace: true, message: '请输入架构办子系统编码' },
                  { max: 100, message: '最多 100 位' },
                  { pattern: /^[a-z0-9_.]+$/i, message: '仅支持英文、数字、下划线和小数点' },
                ]}
              >
                <Input
                  disabled={isFtc}
                  allowClear={!isFtc}
                  maxLength={100}
                  placeholder="如 LL57.CAC"
                  suffix={
                    isFtc ? (
                      <span
                        className="i-lucide-lock size-14px text-text-muted"
                        aria-hidden="true"
                      />
                    ) : (
                      codeStatusSuffix
                    )
                  }
                />
              </Form.Item>
            )}
          </div>
        </div>

        <div className="sr-only" role="status">
          {waiting ? '正在查询子系统资料' : ''}
        </div>
        <Form.Item className="mb-4!" label="系统描述" htmlFor="system-description">
          <Input.TextArea
            id="system-description"
            autoSize={{ minRows: 2, maxRows: 4 }}
            value={systemDesc}
            disabled={!directoryMatched}
            placeholder={
              directoryMatched ? '可补充系统用途、核心业务范围等' : '查询到子系统资料后可编辑'
            }
            onChange={(event) => {
              setDescriptionDraft(event.target.value);
              if (mutation.isError) mutation.reset();
            }}
          />
        </Form.Item>

        <section
          aria-label="目录与人员信息"
          className="rounded-ui border border-solid border-border-subtle bg-sidebar px-4 py-3"
        >
          <div className="mb-2.5 flex min-h-20px items-center justify-between gap-2">
            <span className="text-12px font-600 text-text-secondary">系统资料（只读）</span>
            <DirectoryStatus
              waiting={waiting}
              missing={missingProduct || missingCode}
              matched={directoryMatched}
            />
          </div>
          <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-2.5">
            <DirectoryField label="系统中文名" loading={waiting}>
              {shownRecord?.systemChineseName ? (
                <span className="break-words font-500 text-text">
                  {shownRecord.systemChineseName}
                </span>
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </DirectoryField>
            <DirectoryField label="系统重要性等级" loading={waiting}>
              {shownRecord?.sysRiskLevel ? (
                <RiskBadge level={shownRecord.sysRiskLevel} />
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </DirectoryField>
            <DirectoryField label="科室" loading={waiting}>
              <OrganizationValue value={shownRecord?.ownRoom} />
            </DirectoryField>
            <DirectoryField label="室组" loading={waiting}>
              <OrganizationValue value={shownRecord?.ownGroup} />
            </DirectoryField>
            <div
              className={`min-w-0 border-t border-t-solid border-divider pt-2.5 ${system ? '' : 'col-span-2'}`}
            >
              <dt className="text-12px leading-18px text-text-secondary">系统负责人</dt>
              <dd className="m-0 mt-1">
                <PeopleChips people={owners} emptyText="—" collapsible />
              </dd>
            </div>
            {system && (
              <div className="min-w-0 border-t border-t-solid border-divider pt-2.5">
                <dt className="flex items-center gap-1 text-12px leading-18px text-text-secondary">
                  <span>指定审批人</span>
                  <Tooltip title="低风险提权场景可指定审批人，未指定时默认由组长审批。如需修改，请联系平台人员。">
                    <button
                      type="button"
                      aria-label="指定审批人说明"
                      className="inline-flex cursor-help items-center justify-center rounded-full border-0 bg-transparent p-0 text-text-muted transition-colors hover:text-text layout-focus"
                    >
                      <span className="i-lucide-circle-help size-13px" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </dt>
                <dd className="m-0 mt-1">
                  <PeopleChips people={approvers} emptyText="默认由组长审批" />
                </dd>
              </div>
            )}
          </dl>
        </section>
      </Form>
    </Modal>
  );
}

function DirectoryStatus({
  waiting,
  missing,
  matched,
}: {
  waiting: boolean;
  missing: boolean;
  matched: boolean;
}) {
  if (waiting) {
    return (
      <span className="inline-flex items-center gap-1 text-12px text-accent-text">
        <span
          className="i-lucide-loader-circle size-13px animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        正在查询…
      </span>
    );
  }
  if (missing) {
    return (
      <span className="inline-flex items-center gap-1 text-12px text-danger">
        <span className="i-lucide-circle-alert size-13px" aria-hidden="true" />
        未找到匹配记录
      </span>
    );
  }
  if (matched) {
    return (
      <span className="inline-flex items-center gap-1 text-12px text-success">
        <span className="i-lucide-circle-check size-13px" aria-hidden="true" />
        已同步目录资料
      </span>
    );
  }
  return <span className="text-12px text-text-muted">按编码自动查询</span>;
}

function DirectoryField({
  label,
  loading,
  children,
}: {
  label: string;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-12px leading-18px text-text-secondary">{label}</dt>
      <dd className="m-0 mt-0.5 flex min-h-22px items-center text-13px leading-20px">
        {loading ? (
          <Skeleton.Input
            active
            block
            size="small"
            className="w-3/4! [&_.ant-skeleton-input]:h-18px! [&_.ant-skeleton-input]:min-w-0! [&_.ant-skeleton-input]:rounded-control!"
          />
        ) : (
          children
        )}
      </dd>
    </div>
  );
}

/** 复用系统列表的重要性等级配色，空值由调用方兜底。 */
function RiskBadge({ level }: { level: string }) {
  const grade = level.trim().toUpperCase();
  const color = riskLevelAppearance[grade.charAt(0)]?.color;
  return (
    <Tag
      variant="filled"
      color={color}
      className="m-0! inline-flex! h-20px! shrink-0! items-center rounded-full! px-2! text-12px! leading-none! font-600!"
    >
      {grade} 级
    </Tag>
  );
}

/** 将“编号/名称”拆成名称在前、编号随后，保持列表与详情一致的可读性。 */
function OrganizationValue({ value }: { value?: string | null }) {
  const trimmed = value?.trim();
  if (!trimmed) return <span className="text-text-muted">—</span>;
  const separator = trimmed.indexOf('/');
  if (separator <= 0) return <span className="break-words text-text">{trimmed}</span>;
  const orgCode = trimmed.slice(0, separator).trim();
  const orgName = trimmed.slice(separator + 1).trim();
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 break-words">
      <span className="text-text">{orgName}</span>
      <span className="text-12px text-text-muted tabular-nums">{orgCode}</span>
    </span>
  );
}

type PersonItem = ReturnType<typeof peopleList>[number];

function uniquePeople(value: string | undefined): PersonItem[] {
  return [...new Map(peopleList(value).map((person) => [person.key, person])).values()];
}

/** 负责人较多时默认折叠展示，避免编辑弹层纵向撑高。 */
function PeopleChips({
  people,
  emptyText,
  collapsible = false,
}: {
  people: PersonItem[];
  emptyText: string;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (people.length === 0) {
    return (
      <span className="inline-flex min-h-24px items-center text-13px text-text-muted">
        {emptyText}
      </span>
    );
  }
  const canCollapse = collapsible && people.length > ownerPreviewLimit;
  const visible = canCollapse && !expanded ? people.slice(0, ownerPreviewLimit) : people;

  return (
    <div className="min-w-0">
      <ul
        className={`m-0 flex list-none flex-wrap gap-1.5 p-0 ${
          expanded ? 'max-h-104px overflow-y-auto overscroll-contain pr-1' : ''
        }`}
      >
        {visible.map((person) => (
          <li
            key={person.key}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sidebar py-0.5 pl-0.5 pr-2 text-12px leading-20px"
          >
            <Avatar
              size={20}
              className={`${systemAvatarTone} shrink-0 text-11px!`}
              aria-hidden="true"
            >
              {person.initial}
            </Avatar>
            <span className="truncate font-500 text-text">{person.name}</span>
            {person.id && (
              <span className="shrink-0 text-11px text-text-muted tabular-nums">{person.id}</span>
            )}
          </li>
        ))}
        {canCollapse && (
          <li>
            <Button
              type="link"
              size="small"
              aria-expanded={expanded}
              className="h-24px! px-1.5! text-12px!"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? '收起' : `+${people.length - ownerPreviewLimit} 人`}
            </Button>
          </li>
        )}
      </ul>
    </div>
  );
}
