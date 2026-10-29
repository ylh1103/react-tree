/** 将编辑器缩进同步到共享 YAML 服务；不自动格式化内容，卸载单个编辑器也不释放共享服务。 */
import { useEffect } from 'react';
import { yamlService } from './monaco';
import { syncYamlIndentation } from './yamlIndentation';

export function useYamlIndentation(tabSize: number) {
  useEffect(() => {
    // update 会重校验现有 YAML 模型；失败保持编辑器可用，沿用运行时错误诊断入口。
    void syncYamlIndentation(yamlService, tabSize).catch((error: unknown) => {
      console.error('YAML 缩进配置同步失败', error);
    });
  }, [tabSize]);
}
