/** 精选主题的轻量目录；沿用源主题色系，为 YAML/JSON 区分键名、字符串、数字和常量，并与静态预览共享。 */
export const customEditorThemes = [
  {
    value: 'github-light',
    label: 'GitHub Light',
    dark: false,
    background: '#ffffff',
    foreground: '#24292e',
    key: '#22863a',
    string: '#032f62',
    // 数字采用源主题的紫色，与深蓝字符串、绿色键名及红色常量区分。
    number: '#6f42c1',
    keyword: '#d73a49',
    comment: '#6a737d',
  },
  {
    value: 'github-dark',
    label: 'GitHub Dark',
    dark: true,
    background: '#24292e',
    foreground: '#f6f8fa',
    key: '#7bcc72',
    string: '#79b8ff',
    // 源主题中数字和字符串同为蓝色，数字改用其已有的紫色。
    number: '#b392f0',
    keyword: '#ea4a5a',
    comment: '#959da5',
  },
  {
    value: 'dracula',
    label: 'Dracula',
    dark: true,
    background: '#282a36',
    foreground: '#f8f8f2',
    key: '#ff79c6',
    string: '#f1fa8c',
    number: '#bd93f9',
    // 布尔值和空值使用 Dracula 青色，与粉色键名、紫色数字及黄色字符串分别区分。
    keyword: '#8be9fd',
    comment: '#6272a4',
  },
  {
    value: 'night-owl',
    label: 'Night Owl',
    dark: true,
    background: '#011627',
    foreground: '#d6deeb',
    key: '#7fdbca',
    string: '#addb67',
    number: '#f78c6c',
    keyword: '#c792ea',
    comment: '#637777',
  },
  {
    value: 'cobalt2',
    label: 'Cobalt2',
    dark: true,
    background: '#193549',
    foreground: '#ffffff',
    // 原键名与字符串均偏绿，键名改用源主题的青色，保留绿色字符串。
    key: '#9effff',
    string: '#3ad900',
    number: '#ff628c',
    keyword: '#ff9d00',
    comment: '#0088ff',
  },
] as const;

export type CustomEditorTheme = (typeof customEditorThemes)[number];
