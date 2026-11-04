import { motion } from 'motion/react';
import type { Snapshot, SnapshotValues } from '../../data';
import { StageWindow } from './StageWindow';

interface Line {
  indent: number;
  key: string;
  field?: keyof SnapshotValues;
  value?: string;
}

const lines: Line[] = [
  { indent: 0, key: 'fileprocess' },
  { indent: 1, key: 'config' },
  { indent: 2, key: 'F012' },
  { indent: 3, key: 'enabled', field: 'enabled' },
  { indent: 3, key: 'dup-file-process', field: 'dupFileProcess' },
  { indent: 3, key: 'write-batch-size', field: 'writeBatchSize' },
  { indent: 0, key: 'tracing' },
  { indent: 1, key: 'sampling-rate', value: '1' },
  { indent: 1, key: 'url-pattern', value: "'/*'" },
  { indent: 0, key: 'biz-proxy' },
  { indent: 1, key: 'connect-timeout-ms', value: '10000' },
  { indent: 1, key: 'read-timeout-ms', value: '20000' },
];

interface YamlEditorProps {
  selected: Snapshot;
  published: Snapshot;
}

/** 展示所选快照的参数，与当前生效快照不同的行高亮并注明原值。 */
export function YamlEditor({ selected, published }: YamlEditorProps) {
  return (
    <StageWindow title="application.yml" meta={`#${selected.id}`} className="min-w-0">
      <pre className="m-0 overflow-x-auto py-4 font-mono text-12px leading-7 md:text-13px">
        {lines.map((line, index) => {
          const value = line.field ? String(selected.values[line.field]) : line.value;
          const previous = line.field ? String(published.values[line.field]) : undefined;
          const changed = line.field !== undefined && value !== previous;
          return (
            <div
              key={line.key + index}
              className={`flex pr-4 transition-colors duration-300 ${changed ? 'bg-[rgba(77,141,255,0.12)]' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`w-10 shrink-0 select-none pr-3 text-right ${changed ? 'text-[var(--lp-blue)]' : 'text-[rgba(255,255,255,0.22)]'}`}
              >
                {changed ? '+' : index + 1}
              </span>
              <span style={{ paddingLeft: `${line.indent * 2}ch` }} className="whitespace-pre">
                <span className="text-[#c6cbd6]">{line.key}</span>
                <span className="text-[var(--lp-muted)]">:</span>
                {value !== undefined && (
                  <>
                    {' '}
                    <motion.span
                      key={value}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`inline-block ${line.field ? 'text-[var(--lp-blue)] underline decoration-dotted underline-offset-4' : 'text-[#9aa3b5]'}`}
                    >
                      {value}
                    </motion.span>
                  </>
                )}
                {changed && <span className="text-[var(--lp-muted)]">{`  # 原值 ${previous}`}</span>}
              </span>
            </div>
          );
        })}
      </pre>
    </StageWindow>
  );
}
