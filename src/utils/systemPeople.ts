/** 负责人契约为“姓名/编号”逗号分隔；头像只取姓名首字，完整值保留给提示。 */
export function peopleList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((person) => person.trim())
    .filter(Boolean)
    .map((raw) => {
      const [name = '', ...rest] = raw.split('/');
      const displayName = name.trim() || raw;
      return {
        key: raw,
        name: displayName,
        id: rest.join('/').trim(),
        initial: Array.from(displayName)[0] ?? '?',
      };
    });
}
