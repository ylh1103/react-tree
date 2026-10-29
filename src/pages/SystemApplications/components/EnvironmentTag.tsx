/** 环境标识：展开与折叠面板共用配色、标题语义和提示，仅随窄条切换文字方向。 */
import { Tooltip, theme } from 'antd';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';

export function EnvironmentTag({
  environment: env,
  vertical = false,
}: {
  environment: Pick<ApplicationEnvironment, 'envTag' | 'isPrd' | 'approvalRequiredFlag'>;
  vertical?: boolean;
}) {
  const { token } = theme.useToken();
  const production = env.isPrd === '1';
  const label = `${env.envTag} · ${production ? '生产环境' : '非生产环境'}`;
  return (
    <Tooltip
      title={`${label}${!production && env.approvalRequiredFlag === 'Y' ? ' · 发布需审批' : ''}`}
      trigger={['hover', 'focus']}
      align={{
        htmlRegion: 'visible',
        overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true },
      }}
    >
      <h3
        tabIndex={0}
        aria-label={label}
        style={{ borderRadius: token.borderRadiusSM }}
        className={`m-0 inline-flex shrink-0 items-center gap-1 font-mono text-13px font-600 leading-24px layout-focus ${vertical ? 'py-2 [writing-mode:vertical-rl]' : 'px-2'} ${production ? 'bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] text-danger' : 'bg-hover text-accent'}`}
      >
        {env.envTag}
      </h3>
    </Tooltip>
  );
}
