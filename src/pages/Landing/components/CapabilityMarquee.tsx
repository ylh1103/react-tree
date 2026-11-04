import { motion } from 'motion/react';

const capabilities = [
  '参数快照',
  '版本比对',
  '一键发布',
  '快速回退',
  '热更新',
  '灰度生效',
  '运行时比对',
  '静态检查',
  '变更推送',
  '开放 SDK',
  '高可用容错',
];

const fadeEdges = {
  maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
};

/** 能力标签横向循环滚动，参照 React Bits「LogoLoop」。 */
export function CapabilityMarquee() {
  return (
    <section aria-label="能力一览" className="mx-auto mt-10 flex max-w-1200px items-center gap-4 px-4 md:px-8">
      <span className="flex shrink-0 items-center gap-2 font-mono text-12px tracking-wider text-[var(--lp-fg)]">
        <span aria-hidden="true" className="i-lucide-layers h-4 w-4" />
        11 项能力
      </span>
      <div style={fadeEdges} className="min-w-0 flex-1 overflow-hidden">
        <motion.ul
          className="m-0 flex w-max list-none gap-0 p-0"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
        >
          {[...capabilities, ...capabilities].map((item, index) => (
            <li
              key={`${item}-${index}`}
              aria-hidden={index >= capabilities.length}
              className="flex items-center gap-4 px-4 font-mono text-12px tracking-wider text-[var(--lp-muted)]"
            >
              <span aria-hidden="true" className="h-3 w-px bg-[var(--lp-line)]" />
              {item}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
