/** Tooltip 共用快捷键提示：动作与键帽分开展示，键帽继承浮层文字颜色以适配主题。 */
export function ShortcutHint({ label, keys }: { label: string; keys: readonly string[] }) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap text-13px leading-24px">
      <span>{label}</span>
      <span className="flex items-center gap-1" aria-label={keys.join(' ')}>
        {keys.map((key) => (
          <kbd
            key={key}
            className={`
              inline-flex h-24px min-w-24px items-center justify-center rounded-control border
              border-solid [border-color:color-mix(in_srgb,currentColor_30%,transparent)]
              bg-transparent px-1.5 font-mono text-12px font-400 leading-none
            `}
          >
            {key}
          </kbd>
        ))}
      </span>
    </span>
  );
}
