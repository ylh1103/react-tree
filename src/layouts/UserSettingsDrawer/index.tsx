/**
 * 按需加载的用户设置内容与保存反馈；抽屉外壳独立加载，避免下载时阻塞打开和关闭。
 * 表单内容复用 LayoutSettings，自动保存及失败回退仍由 Redux 管理。
 */
import { Button, Popconfirm, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useDebounceFn } from 'ahooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { saveUserSettings } from '@/store/slices/preferencesSlice';
import { LayoutSettings } from '@/components/LayoutSettings';
import { defaultUserSettings, type UserSettings } from '@/types/preferences';

export function UserSettingsContent() {
  // 只订阅抽屉实际展示的字段，布局预览等无关变更不触发整层抽屉更新。
  const status = useAppSelector((state) => state.preferences.status);
  const error = useAppSelector((state) => state.preferences.error);
  const failedSettings = useAppSelector((state) => state.preferences.failedSettings);
  const dispatch = useAppDispatch();
  // “已保存”只是一段短暂 UI 提示；实际配置及保存结果以 Redux 为准，不在组件中复制配置。
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const { run: scheduleClearSyncedAt, cancel: cancelClearSyncedAt } = useDebounceFn(
    () => setSyncedAt(null),
    { wait: 3000 },
  );
  // RTK thunk 的 dispatch 会返回结果 action；显式判断 fulfilled 后才显示成功，失败交给 Slice 回退。
  // 自动保存、恢复默认、失败重试都走同一入口；恢复默认仅覆盖平台字段，API 仍保留未知字段。
  const save = async (changes: Partial<UserSettings>) => {
    setSyncedAt(null);
    const result = await dispatch(saveUserSettings(changes));
    if (saveUserSettings.fulfilled.match(result)) setSyncedAt(Date.now());
  };
  useEffect(() => {
    if (syncedAt === null) return;
    // 每次保存完成重新计时；开始新保存或卸载时取消旧提示任务。
    scheduleClearSyncedAt();
    return cancelClearSyncedAt;
  }, [syncedAt, scheduleClearSyncedAt, cancelClearSyncedAt]);
  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden">
        <LayoutSettings
          onSave={(changes) => {
            void save(changes);
          }}
        />
      </div>
      <div className="shrink-0 border-t border-t-solid border-divider px-6 py-3">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Popconfirm
            title="将所有用户设置恢复为默认值？"
            description={
              <p className="m-0 text-13px leading-6 whitespace-normal break-words text-text-secondary">
                外观、布局和编辑器设置将全部重置，并自动保存。
              </p>
            }
            // 限制浮层宽度并允许换行，避免长描述将按钮挤出抽屉或小屏视口。
            classNames={{
              root: 'w-320px max-w-[calc(100vw-32px)]',
              container: 'p-4!',
              title: 'text-14px! font-600! leading-6! whitespace-normal',
            }}
            okText="全部恢复默认"
            cancelText="保留设置"
            placement="topLeft"
            disabled={status === 'idle' || status === 'loading' || status === 'load-error'}
            onConfirm={() => save(defaultUserSettings)}
          >
            <Button disabled={status === 'idle' || status === 'loading' || status === 'load-error'}>
              恢复全部默认
            </Button>
          </Popconfirm>
          <span
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 text-12px text-text-secondary"
          >
            {status === 'saving' && (
              <>
                <span
                  aria-hidden="true"
                  className="i-lucide-loader-circle animate-spin text-accent text-14px"
                />
                正在保存…
              </>
            )}
            {status === 'save-error' && (
              <>
                <Tooltip title={error}>
                  <span className="flex items-center gap-1.5 text-error">
                    <span aria-hidden="true" className="i-lucide-circle-alert text-14px" />
                    保存失败，已恢复原设置
                  </span>
                </Tooltip>
                <Button
                  type="link"
                  size="small"
                  danger
                  className="h-auto! px-0! py-0!"
                  onClick={() => {
                    // UI 已回退，重试必须发送之前失败的修改项，不能重新读取当前回退值作为输入。
                    if (failedSettings) void save(failedSettings);
                  }}
                >
                  重试
                </Button>
              </>
            )}
            {syncedAt !== null && status === 'ready' && (
              <>
                <span aria-hidden="true" className="i-lucide-check text-success text-14px" />
                已保存
              </>
            )}
            {status === 'ready' && syncedAt === null && '更改后自动保存'}
          </span>
        </div>
      </div>
    </>
  );
}
