/** 通用异常插画：叠放的页面和独立异常徽标表达不可显示状态，不含业务名称、诊断结论或模拟数据。 */
export function FailureIllustration() {
  return (
    <svg aria-hidden="true" viewBox="0 0 480 360" className="block w-full" fill="none">
      <ellipse cx="251" cy="172" rx="166" ry="143" fill="var(--color-accent)" opacity=".035" />
      <path
        d="M57 117a163 163 0 0 1 153-95m222 177a163 163 0 0 1-55 101"
        stroke="var(--color-accent)"
        strokeOpacity=".15"
        strokeWidth="1.5"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />
      <circle cx="57" cy="132" r="3" fill="var(--color-accent)" opacity=".4" />
      <circle cx="421" cy="235" r="4" fill="var(--color-accent)" opacity=".25" />
      {/* 背景窗口压低对比度，将视觉重心留给前景页面与异常徽标。 */}
      <rect
        x="92"
        y="55"
        width="326"
        height="230"
        rx="15"
        fill="var(--color-border-subtle)"
        opacity=".2"
      />
      <rect
        x="86"
        y="47"
        width="326"
        height="230"
        rx="15"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1.5"
      />
      <path d="M86 87h326" stroke="var(--color-border-subtle)" />
      <g fill="var(--color-text-secondary)" opacity=".3">
        <circle cx="105" cy="67" r="3" />
        <circle cx="116" cy="67" r="3" />
        <circle cx="127" cy="67" r="3" />
      </g>
      <rect x="158" y="62" width="95" height="10" rx="5" fill="var(--color-canvas)" />
      <path
        d="m390 63 4 4-4 4m-11-8-4 4 4 4"
        stroke="var(--color-text-secondary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".45"
      />
      <path d="M142 87v190" stroke="var(--color-border-subtle)" />
      <rect x="99" y="105" width="30" height="30" rx="7" fill="var(--color-accent)" opacity=".09" />
      <g stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M107 116h14m-14 8h14m-10-11v6m7 2v6" />
      </g>
      <g stroke="var(--color-text-secondary)" strokeWidth="1.5" opacity=".22">
        <rect x="107" y="151" width="14" height="12" rx="2" />
        <rect x="107" y="183" width="14" height="12" rx="2" />
        <rect x="107" y="215" width="14" height="12" rx="2" />
      </g>
      <rect
        x="164"
        y="109"
        width="74"
        height="7"
        rx="3.5"
        fill="var(--color-text-secondary)"
        opacity=".3"
      />
      <rect
        x="164"
        y="128"
        width="128"
        height="4"
        rx="2"
        fill="var(--color-text-secondary)"
        opacity=".12"
      />
      <rect x="164" y="153" width="104" height="70" rx="9" fill="var(--color-canvas)" />
      <rect x="281" y="153" width="108" height="70" rx="9" fill="var(--color-canvas)" />
      <g
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".45"
      >
        <rect x="181" y="169" width="22" height="16" rx="3" />
        <path d="M181 175h22m-22 26h46m70-28h43m-43 10h61m-61 18h31" />
      </g>
      <path
        d="M281 244h108m-108 11h66"
        stroke="var(--color-text-secondary)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".1"
      />
      {/* 略微倾斜的前景页面形成层次；几何符号不对应任何真实报错字段。 */}
      <g transform="rotate(-7 160 245)">
        <rect
          x="53"
          y="172"
          width="214"
          height="150"
          rx="13"
          fill="var(--color-border-subtle)"
          opacity=".3"
        />
        <rect
          x="48"
          y="165"
          width="214"
          height="150"
          rx="13"
          fill="var(--color-surface)"
          stroke="var(--color-border-subtle)"
          strokeWidth="1.5"
        />
        <path d="M48 197h214" stroke="var(--color-border-subtle)" />
        <rect
          x="63"
          y="178"
          width="39"
          height="5"
          rx="2.5"
          fill="var(--color-accent)"
          opacity=".65"
        />
        <circle cx="246" cy="181" r="2" fill="var(--color-text-secondary)" opacity=".3" />
        <g
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m89 216-11 10 11 10m37-20 11 10-11 10m-18-24-5 28" />
        </g>
        <path
          d="M72 258h142m-142 15h109m-109 15h68"
          stroke="var(--color-text-secondary)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".16"
        />
      </g>
      {/* 独立徽标只表达异常，不暗示网络、配置或某个业务模块已经被定位为故障源。 */}
      <circle cx="299" cy="271" r="43" fill="var(--color-canvas)" />
      <circle cx="299" cy="271" r="34" fill="var(--color-border-subtle)" opacity=".3" />
      <circle
        cx="296"
        cy="267"
        r="34"
        fill="var(--color-surface)"
        stroke="var(--color-border-subtle)"
        strokeWidth="1.5"
      />
      <circle
        cx="296"
        cy="267"
        r="26"
        fill="var(--color-danger, var(--color-accent))"
        opacity=".07"
      />
      <path
        d="M296 252v18"
        stroke="var(--color-danger, var(--color-accent))"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="296" cy="280" r="2" fill="var(--color-danger, var(--color-accent))" />
      <path
        d="m333 240 5-5m-2 30h8m-13 27 5 5"
        stroke="var(--color-danger, var(--color-accent))"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".35"
      />
    </svg>
  );
}
