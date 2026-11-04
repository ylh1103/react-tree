import { useMemo, useState } from 'react';
import { countChanges, findSnapshot } from '../../data';
import { Waves } from '../../reactbits/Waves';
import { PublishTerminal, type TerminalScript } from './PublishTerminal';
import { SnapshotList } from './SnapshotList';
import { YamlEditor } from './YamlEditor';

const stageBackground = {
  backgroundImage:
    'radial-gradient(120% 90% at 50% 110%, #2a56c4 0%, #13245a 38%, #0b0f1f 70%, #09090b 100%)',
};

/** 首屏交互舞台：选快照看差异，发布或回退后终端回放执行过程。 */
export function ProductStage() {
  const [selectedId, setSelectedId] = useState(105);
  const [publishedId, setPublishedId] = useState(104);
  const [run, setRun] = useState<{ key: number; script: TerminalScript }>(() => ({
    key: 0,
    script: {
      command: 'lingdong status --app CBTB',
      output: [
        { text: '当前生效快照 #104', tone: 'info' },
        { text: '待发布快照 #105 · 1 项变更', tone: 'info' },
      ],
    },
  }));

  const selected = findSnapshot(selectedId);
  const published = findSnapshot(publishedId);
  const changes = useMemo(() => countChanges(published, selected), [published, selected]);

  function publish() {
    const rollback = selected.id < published.id;
    setPublishedId(selected.id);
    setRun((current) => ({
      key: current.key + 1,
      script: {
        command: rollback
          ? `lingdong rollback --to #${selected.id}`
          : `lingdong publish --snapshot #${selected.id}`,
        output: [
          { text: rollback ? `定位历史快照 #${selected.id}` : `静态检查通过 · ${changes} 项变更`, tone: 'info' },
          { text: rollback ? '配置中心参数已回退' : '已发布到配置中心', tone: 'success' },
          { text: '2/2 实例热更新完成，无需重启', tone: 'success' },
        ],
      },
    }));
  }

  return (
    <div
      style={stageBackground}
      className="relative overflow-hidden rounded-3xl border border-solid border-[var(--lp-line)]"
    >
      <Waves
        lineColor="rgba(140,175,255,0.16)"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="relative grid gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-6 lg:p-12">
        <YamlEditor selected={selected} published={published} />
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6 lg:pt-10">
          <PublishTerminal runKey={run.key} script={run.script} />
          <div className="lg:-ml-20">
            <SnapshotList
              selected={selected}
              published={published}
              onSelect={setSelectedId}
              onPublish={publish}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
