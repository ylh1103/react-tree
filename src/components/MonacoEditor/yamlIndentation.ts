/** YAML 缩进适配：同步补全与格式化设置，保留共享服务已有的诊断、Schema 和其他格式化选项。 */
import type { FormatterOptions, MonacoYaml } from 'monaco-yaml';

/**
 * monaco-yaml 5.5.0 的声明缺少 tabWidth，但已核对其 yaml.worker.js：
 * YAMLFormatter 将 format.tabWidth 传给 Prettier；仅设置 indentation 不会影响格式化。
 * 用局部结构扩展补齐实际支持的字段，升级依赖时须回归真实 Worker 格式化行为。
 */
interface YamlFormatterOptions extends FormatterOptions {
  tabWidth?: number;
}

/** 服务配置在 update 调用时同步合并；同屏多个编辑器可去重，异步重校验不覆盖较新的缩进。 */
export async function syncYamlIndentation(service: MonacoYaml, tabSize: number) {
  const options = service.getOptions();
  const format: YamlFormatterOptions = options.format ?? {};
  const indentation = ' '.repeat(tabSize);
  if (options.indentation === indentation && format.tabWidth === tabSize) return;
  const nextFormat: YamlFormatterOptions = { ...format, tabWidth: tabSize };
  await service.update({ indentation, format: nextFormat });
}
