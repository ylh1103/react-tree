/** 介绍页演示用的参数快照，首屏编辑器、终端与发布回退演示共用同一组数据。 */
export interface SnapshotValues {
  enabled: boolean;
  dupFileProcess: boolean;
  writeBatchSize: number;
}

export interface Snapshot {
  id: number;
  time: string;
  message: string;
  values: SnapshotValues;
}

export const snapshots: Snapshot[] = [
  { id: 105, time: '17:18', message: '批量写入数量改为 1000', values: { enabled: true, dupFileProcess: false, writeBatchSize: 1000 } },
  { id: 104, time: '17:16', message: '关闭重复文件处理', values: { enabled: true, dupFileProcess: false, writeBatchSize: 5 } },
  { id: 103, time: '17:03', message: '批量写入数量改为 5', values: { enabled: true, dupFileProcess: true, writeBatchSize: 5 } },
  { id: 102, time: '16:36', message: '开启 F012 文件处理', values: { enabled: true, dupFileProcess: true, writeBatchSize: 100 } },
  { id: 101, time: '10:53', message: '初始化 F012 参数', values: { enabled: false, dupFileProcess: true, writeBatchSize: 100 } },
];

const fields = ['enabled', 'dupFileProcess', 'writeBatchSize'] as const;

export function countChanges(from: Snapshot, to: Snapshot) {
  return fields.filter((field) => from.values[field] !== to.values[field]).length;
}

export function findSnapshot(id: number) {
  return snapshots.find((snapshot) => snapshot.id === id) ?? snapshots[0];
}
