/** 脱敏 HTML 示意画面；全页统一 demo-service、v12/v13 与 3000/5000。 */
import { muted, SampleNote } from './ui';
export function VersionDiff({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-10px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)]">
      <div className="flex items-center justify-between gap-3 border-b border-b-solid border-[var(--landing-border)] px-4 py-3 text-12px">
        <span className={muted}>版本差异</span>
        <span>
          v12 <span aria-hidden="true">→</span> v13
        </span>
      </div>
      <div className={`grid ${compact ? '' : 'min-[768px]:grid-cols-2'}`}>
        <div className="min-w-0 p-4">
          <p className={`mb-3 mt-0 text-12px ${muted}`}>− 修改前 · v12</p>
          <code className="block overflow-x-auto whitespace-pre text-13px leading-[2]">
            <span className={muted}>demo-service</span>
            {'\n'}
            <span className="text-[var(--landing-delete)]">− connectionTimeout: 3000</span>
          </code>
        </div>
        <div className="min-w-0 bg-[var(--landing-add-bg)] p-4">
          <p className={`mb-3 mt-0 text-12px ${muted}`}>+ 修改后 · v13</p>
          <code className="block overflow-x-auto whitespace-pre text-13px leading-[2]">
            <span className={muted}>demo-service</span>
            {'\n'}
            <span className="text-[var(--landing-add)]">+ connectionTimeout: 5000</span>
          </code>
        </div>
      </div>
    </div>
  );
}
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-12px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)] shadow-[0_24px_80px_-30px_rgba(90,62,130,0.22)]">
      <div className="flex items-center justify-between gap-3 border-b border-b-solid border-[var(--landing-border)] p-4">
        <div className="flex items-center gap-2 text-13px font-600">
          <span aria-hidden="true" className="i-lucide-box text-[var(--landing-link)]" />
          demo-service
        </div>
        <span className={`text-12px ${muted}`}>流程示意</span>
      </div>
      <div className="p-4 min-[768px]:p-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-12px">
          <span className="rounded-6px bg-[var(--landing-raised)] px-3 py-1.5">
            环境 · 示例生产
          </span>
          <span className="rounded-6px bg-[var(--landing-raised)] px-3 py-1.5">快照 · v13</span>
        </div>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className={`mb-2 mt-0 text-12px ${muted}`}>发布前，先看清变化</p>
            <h2 className="m-0 text-20px font-600">一次变更，一份完整快照。</h2>
          </div>
          <span
            aria-hidden="true"
            className="i-lucide-git-compare-arrows mt-2 shrink-0 text-24px text-[var(--landing-link)]"
          />
        </div>
        <VersionDiff compact />
        <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-12px ${muted}`}>
          <span>01 保存配置</span>
          <span>02 生成快照</span>
          <span>03 发布与核对</span>
        </div>
        <SampleNote />
      </div>
    </div>
  );
}
export function RuntimeTable() {
  return (
    <div className="overflow-x-auto rounded-10px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)]">
      <table className="w-full border-collapse text-left text-13px leading-[1.8]">
        <caption className={`p-3 text-left text-12px ${muted}`}>
          connectionTimeout · 预期快照 v13
        </caption>
        <thead className="bg-[var(--landing-raised)]">
          <tr>
            {['实例', '预期', '运行时', '核对结果'].map((text) => (
              <th key={text} scope="col" className="whitespace-nowrap p-3 font-500">
                {text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ['A', '5000', '5000', '一致'],
            ['B', '5000', '3000', '存在差异'],
          ].map((row) => (
            <tr key={row[0]} className="border-t border-t-solid border-[var(--landing-border)]">
              {row.map((cell, column) => (
                <td key={column} className="whitespace-nowrap p-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
