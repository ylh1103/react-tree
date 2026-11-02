/** 只读个人名片：柔和封面与跨面板圆形头像建立层级，角色和网络独立呈现，保留遮罩及 Esc 关闭。 */
import { Avatar, Modal, Tag } from 'antd';
import profileCover from '@/assets/profile-cover.jpg';
import { useAppSelector } from '@/store/hooks';

// 展示标签仅描述用户资料，此处不执行授权；工作区按平台角色和接口成员关系控制访问，登录网络不参与。
const networkTags = {
  '0': { label: '办公网', color: 'cyan', icon: 'i-lucide-building-2' },
  '1': { label: '互联网', color: 'geekblue', icon: 'i-lucide-globe-2' },
  '2': { label: '业务网', color: undefined, icon: 'i-lucide-network' },
} as const;

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const userName = useAppSelector((state) => state.user.userInfo?.userName);
  const ystId = useAppSelector((state) => state.user.userInfo?.ystId);
  const employeeId = useAppSelector((state) => state.user.userInfo?.employeeId);
  const userType = useAppSelector((state) => state.user.userInfo?.userType);
  const netEnv = useAppSelector((state) => state.user.userInfo?.netEnv);
  const department = useAppSelector((state) => state.user.userInfo?.department);
  if (!userName) return null;

  // 直属部门作为主信息；祖先路径保留原始顺序，过滤空片段并允许长名称完整换行。
  const departmentSegments =
    department
      ?.split('/')
      .map((part) => part.trim())
      .filter(Boolean) ?? [];
  const currentDepartment = departmentSegments.at(-1);
  const parentDepartments = departmentSegments.slice(0, -1).join(' / ');
  const roleLabel = userType === '0' ? '平台人员' : userType === '1' ? '普通用户' : '未提供角色';
  const networkTag = netEnv ? networkTags[netEnv] : undefined;

  return (
    <Modal
      aria-label="个人资料"
      open={open}
      onCancel={onClose}
      width={500}
      centered
      closable={false}
      classNames={{
        container:
          'relative isolate overflow-hidden p-3! rounded-[calc(var(--ui-radius)_+_16px)]! border border-solid border-white/40 bg-transparent! backdrop-blur-3px',
        body: 'p-0!',
      }}
      footer={null}
    >
      {/* 底色仅保留 20% 不透明度并轻度模糊背景，避免玻璃留缝被高不透明度和强模糊抹成实心边框。 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-1 bg-settings-surface opacity-20"
      />
      {/* 浅色滤色呈现柔和亮纹理；暗色反转明暗并正片叠底，让主题色形成清晰光晕，避免低透明度滤色泛灰。 */}
      <div className="isolate h-160px overflow-hidden rounded-[calc(var(--ui-radius)_+_8px)] bg-accent shadow-sm">
        <img
          src={profileCover}
          alt=""
          className="block h-full w-full object-cover mix-blend-screen grayscale [html[data-theme=dark]_&]:mix-blend-multiply [html[data-theme=dark]_&]:[filter:grayscale(1)_invert(1)_brightness(3)] [html[data-theme=dark]_&]:opacity-85"
        />
      </div>
      <div className="mt-2.5 flow-root rounded-[calc(var(--ui-radius)_+_8px)] bg-settings-surface px-6 pb-5">
        <div className="relative -mt-22 mb-4 w-fit">
          <Avatar
            size={144}
            shape="circle"
            className="bg-hover! text-accent-text! text-44px! font-500"
          >
            {Array.from(userName)[0]}
          </Avatar>
        </div>
        <h2 className="m-0 break-all text-26px font-600 leading-36px text-text">{userName}</h2>
        {/* 身份和网络统一柔和填色；业务网使用主题色避免暗色预设紫色偏暗，图标和文案仍独立区分类别。 */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Tag
            aria-label={`平台角色：${roleLabel}`}
            variant="filled"
            icon={
              <span
                className={`${userType === '0' ? 'i-lucide-badge-check' : 'i-lucide-user-round'} h-14px w-14px shrink-0`}
                aria-hidden="true"
              />
            }
            className={`m-0! inline-flex! items-center! gap-1.5! rounded-control! px-2.5! py-1! text-12px! leading-20px! ${userType === '0' ? 'bg-hover! text-accent-text! font-500' : 'bg-sidebar! text-text-secondary!'}`}
          >
            {roleLabel}
          </Tag>
          <Tag
            aria-label={`登录网络：${networkTag?.label ?? '未提供'}`}
            variant="filled"
            color={networkTag?.color}
            icon={
              <span
                className={`${networkTag?.icon ?? 'i-lucide-network'} h-14px w-14px shrink-0`}
                aria-hidden="true"
              />
            }
            className={`m-0! inline-flex! items-center! gap-1.5! rounded-control! px-2.5! py-1! text-12px! leading-20px! ${netEnv === '2' ? 'bg-hover! text-accent-text!' : ''}`}
          >
            {networkTag?.label ?? '未提供网络'}
          </Tag>
        </div>
        <div aria-label="所属部门" className="pt-6 [overflow-wrap:anywhere]">
          <div className="text-15px font-600 leading-24px text-text">
            {currentDepartment || '未提供部门信息'}
          </div>
          {parentDepartments && (
            <div className="mt-1.5 text-12px leading-21px text-text-secondary">
              {parentDepartments}
            </div>
          )}
        </div>
        {/* 底部沿用参考图的大号数值与小标签构图；账号仍为文本，保留前导零及长值换行。 */}
        <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-4 pt-8">
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="order-2 text-12px leading-20px text-text-secondary">一事通 ID</dt>
            <dd className="m-0 break-all text-24px font-500 leading-32px text-text tabular-nums">
              {ystId || '—'}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="order-2 text-12px leading-20px text-text-secondary">员工号</dt>
            <dd className="m-0 break-all text-24px font-500 leading-32px text-text tabular-nums">
              {employeeId || '—'}
            </dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
