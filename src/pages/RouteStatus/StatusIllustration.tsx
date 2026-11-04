/** 路由状态专用插画：以不同主体区分页面缺失、系统缺失和访问受限，使用主题变量适配深浅色。 */
import type { ReactNode } from 'react';

type StatusIllustrationKind = 'page-not-found' | 'system-not-found' | 'forbidden';

/** 共用画幅与背景；主体按 AppFailure 约 379×288 的实际范围校准，等比例缩放并统一留白。 */
function IllustrationFrame({
  children,
  subjectTransform,
}: {
  children: ReactNode;
  subjectTransform: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 480 360" className="block w-full" fill="none">
      <ellipse cx="246" cy="181" rx="170" ry="137" fill="var(--color-accent)" opacity=".035" />
      <path
        d="M66 136a171 140 0 0 1 120-103m232 191a171 140 0 0 1-86 96"
        stroke="var(--color-accent)"
        strokeOpacity=".2"
        strokeWidth="1.5"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />
      <circle cx="65" cy="150" r="3" fill="var(--color-accent)" opacity=".4" />
      <circle cx="410" cy="246" r="4" fill="var(--color-accent)" opacity=".25" />
      <ellipse cx="244" cy="327" rx="142" ry="8" fill="var(--color-border-subtle)" opacity=".25" />
      <g transform={subjectTransform}>{children}</g>
    </svg>
  );
}

/** 缺失页面用文档轮廓与搜索镜表达，避免与系统节点、权限门禁混淆。 */
function MissingPage() {
  return (
    <IllustrationFrame subjectTransform="translate(-25.63 0.71) scale(1.0765)">
      <g transform="translate(-40 0)">
        <g transform="rotate(-9 220 174)">
          <rect
            x="117"
            y="58"
            width="208"
            height="238"
            rx="14"
            fill="var(--color-hover)"
            stroke="var(--color-accent-border)"
          />
          <path
            d="M144 89h65m-65 13h95"
            stroke="var(--color-accent)"
            strokeOpacity=".2"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M151 49h116l62 62v185a14 14 0 0 1-14 14H151a14 14 0 0 1-14-14V63a14 14 0 0 1 14-14Z"
          fill="var(--color-surface)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
        />
        <path
          d="M267 49v49a13 13 0 0 0 13 13h49"
          fill="var(--color-canvas)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
        />
        <path
          d="M166 83h52"
          stroke="var(--color-accent)"
          strokeOpacity=".65"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x="165"
          y="132"
          width="135"
          height="99"
          rx="10"
          fill="var(--color-canvas)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <path
          d="m216 170-10 10 10 10m32-20 10 10-10 10m-12-27-8 34"
          stroke="var(--color-text-muted)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".5"
        />
        <path
          d="M167 256h85m-85 16h60"
          stroke="var(--color-text-secondary)"
          strokeOpacity=".18"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(28 0)">
        <circle cx="317" cy="232" r="54" fill="var(--color-border-subtle)" opacity=".2" />
        <circle
          cx="310"
          cy="225"
          r="53"
          fill="var(--color-surface)"
          stroke="var(--color-accent-border)"
          strokeWidth="2"
        />
        <circle cx="310" cy="225" r="42" fill="var(--color-hover)" />
        <path
          d="m349 264 33 33"
          stroke="var(--color-accent)"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M301 214a10 10 0 0 1 19 4c0 8-10 7-10 15m0 10v1"
          stroke="var(--color-accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
      <path
        d="m95 208-8 4m275-94 6-7m-2 24h9"
        stroke="var(--color-accent)"
        strokeOpacity=".4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IllustrationFrame>
  );
}

/** 空置的立体系统基座与虚线模块表达目标缺失，用空间轮廓区别于页面文档和权限窗口。 */
function MissingSystem() {
  return (
    <IllustrationFrame subjectTransform="translate(-39.69 -40.77) scale(1.1253)">
      {/* 周边实体模块只提供系统集合语境，中央模块使用虚线保留明确的空缺感。 */}
      <path
        d="M106 184v27q0 12 12 19l38 22m218-20-28 16"
        stroke="var(--color-accent-border)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
      <ellipse cx="246" cy="323" rx="132" ry="11" fill="var(--color-border-subtle)" opacity=".25" />
      {/* 低矮基座的三个面用既有表面色区分，不引入窗口、卡片或锁盾造型。 */}
      <path
        d="m111 235 136 78v20l-136-78v-20Z"
        fill="var(--color-sidebar)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m247 313 136-78v20l-136 78v-20Z"
        fill="var(--color-hover)"
        stroke="var(--color-accent-border)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m111 235 136-78 136 78-136 78-136-78Z"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m139 235 108-62 108 62-108 62-108-62Z" fill="var(--color-canvas)" />
      <path
        d="m186 235 61-35 61 35-61 35-61-35Z"
        fill="var(--color-hover)"
        stroke="var(--color-accent-border)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        strokeLinejoin="round"
      />
      <path
        d="m158 239-7-4 15-9m162 0 15 9-7 4m-101 44 12 7 12-7"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".55"
      />
      <path
        d="m269 313 26-15m10-6 9-5"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".45"
      />
      {/* 空心虚线立方体表示未找到的系统位置，避免实体填充让人误以为系统已经存在。 */}
      <path d="m247 82 62 36-62 36-62-36 62-36Z" fill="var(--color-hover)" opacity=".3" />
      <g
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeDasharray="5 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m247 82 62 36-62 36-62-36 62-36Z" opacity=".65" />
        <path d="M185 118v72l62 36 62-36v-72m-62 36v72" opacity=".45" />
      </g>
      <path
        d="M185 203v15m124-15v15m-62 21v10"
        stroke="var(--color-accent-border)"
        strokeWidth="1.5"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />
      {/* 两个较小的实体模块使用同一透视方向，强调中央位置的缺失而非整个系统集合故障。 */}
      <g transform="translate(-6 0)">
        <g stroke="var(--color-border-subtle)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="m76 124 30 17v35l-30-17v-35Z" fill="var(--color-sidebar)" />
          <path d="m106 141 30-17v35l-30 17v-35Z" fill="var(--color-surface)" />
          <path d="m76 124 30-17 30 17-30 17-30-17Z" fill="var(--color-surface)" />
        </g>
        <path d="m97 124 9-5 9 5-9 5-9-5Z" fill="var(--color-accent)" opacity=".25" />
        <path
          d="m115 154 10-6m-10 14 10-6"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".55"
        />
      </g>
      <g transform="translate(6 0)">
        <g stroke="var(--color-accent-border)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="m345 181 28 16v32l-28-16v-32Z" fill="var(--color-hover)" />
          <path d="m373 197 28-16v32l-28 16v-32Z" fill="var(--color-surface)" />
          <path d="m345 181 28-16 28 16-28 16-28-16Z" fill="var(--color-surface)" />
        </g>
        <path d="m365 181 8-5 8 5-8 5-8-5Z" fill="var(--color-accent)" opacity=".25" />
        <path
          d="m382 207 9-5m-9 13 9-5"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".55"
        />
      </g>
      <path
        d="m161 84 6-6m-3 24h8m172 12 8 4m-13-24 4-6"
        stroke="var(--color-accent)"
        strokeOpacity=".35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IllustrationFrame>
  );
}

/** 受保护的工作区与前景锁盾形成主次，身份卡片补充访问语义，避免用故障符号表达权限限制。 */
function AccessRestricted() {
  return (
    <IllustrationFrame subjectTransform="translate(-10.97 -10.43) scale(1.0797)">
      {/* 后景工作区保留可识别的窗口结构，降低内部细节对比度，突出前景权限屏障。 */}
      <g transform="rotate(3 246 166)">
        <rect
          x="100"
          y="68"
          width="292"
          height="208"
          rx="15"
          fill="var(--color-border-subtle)"
          opacity=".2"
        />
        <rect
          x="94"
          y="61"
          width="292"
          height="208"
          rx="15"
          fill="var(--color-surface)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
        />
        <path d="M94 98h292" stroke="var(--color-border-subtle)" />
        <g fill="var(--color-text-secondary)" opacity=".25">
          <circle cx="113" cy="80" r="3" />
          <circle cx="124" cy="80" r="3" />
          <circle cx="135" cy="80" r="3" />
        </g>
        <rect x="163" y="75" width="96" height="9" rx="4.5" fill="var(--color-canvas)" />
        <rect x="114" y="118" width="39" height="39" rx="9" fill="var(--color-hover)" />
        <path
          d="M126 130h15v15h-15Zm0 7.5h15m-7.5-7.5v15"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity=".55"
        />
        <path
          d="M169 127h79m-79 16h118"
          stroke="var(--color-text-secondary)"
          strokeOpacity=".16"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x="114" y="178" width="99" height="65" rx="9" fill="var(--color-canvas)" />
        <path
          d="M131 195h40m-40 14h61m-61 14h32"
          stroke="var(--color-text-secondary)"
          strokeOpacity=".14"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      {/* 主体锁盾使用完整、闭合的轮廓；描边与轻量投影提供层次，不依赖错误红色。 */}
      <path
        d="M294 121c24 17 48 26 77 30v64c0 49-32 82-77 105-45-23-77-56-77-105v-64c29-4 53-13 77-30Z"
        fill="var(--color-border-subtle)"
        opacity=".3"
      />
      <path
        d="M286 112c24 17 48 26 77 30v64c0 49-32 82-77 105-45-23-77-56-77-105v-64c29-4 53-13 77-30Z"
        fill="var(--color-surface)"
        stroke="var(--color-accent-border)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M286 128c19 12 39 20 61 25v53c0 38-23 65-61 87-38-22-61-49-61-87v-53c22-5 42-13 61-25Z"
        fill="var(--color-hover)"
      />
      <path
        d="M286 139c-15 9-31 15-48 20v43"
        stroke="var(--color-accent)"
        strokeOpacity=".22"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M268 209v-20a18 18 0 0 1 36 0v20"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="257"
        y="208"
        width="58"
        height="49"
        rx="11"
        fill="var(--color-surface)"
        stroke="var(--color-accent)"
        strokeWidth="3"
      />
      <circle cx="286" cy="227" r="4" fill="var(--color-accent)" />
      <path d="M286 230v9" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
      {/* 倾斜的身份卡片与锁盾建立关联，不显示虚构的用户资料或已获授权标记。 */}
      <g transform="translate(-15.2 0) rotate(-8 150 253)">
        <rect
          x="73"
          y="208"
          width="151"
          height="101"
          rx="13"
          fill="var(--color-border-subtle)"
          opacity=".25"
        />
        <rect
          x="68"
          y="201"
          width="151"
          height="101"
          rx="13"
          fill="var(--color-surface)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
        />
        <path d="M68 225h151" stroke="var(--color-border-subtle)" />
        <rect
          x="126"
          y="210"
          width="36"
          height="5"
          rx="2.5"
          fill="var(--color-accent)"
          opacity=".45"
        />
        <rect x="83" y="239" width="39" height="46" rx="8" fill="var(--color-hover)" />
        <circle cx="102.5" cy="253" r="6" fill="var(--color-accent)" opacity=".45" />
        <path d="M92 275a10.5 10.5 0 0 1 21 0" fill="var(--color-accent)" opacity=".3" />
        <path
          d="M136 249h60m-60 14h42m-42 14h27"
          stroke="var(--color-text-secondary)"
          strokeOpacity=".22"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <path
        d="m381 171 9-5m-6 28h12M78 180l-7-5"
        stroke="var(--color-accent)"
        strokeOpacity=".35"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IllustrationFrame>
  );
}

export default function StatusIllustration({ kind }: { kind: StatusIllustrationKind }) {
  if (kind === 'forbidden') return <AccessRestricted />;
  if (kind === 'system-not-found') return <MissingSystem />;
  return <MissingPage />;
}
