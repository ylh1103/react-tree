# React Bits 首页

公开路由 `/loading-copy` 按目录懒加载，不进入业务系统布局，也不增加登录要求。参考页面为 <https://www.reactbits.dev/>，采集日期为 2026-11-05。`/landing` 留给实际产品落地页；复刻页的静态资源仍保存在 `public/landing`，资源路径与页面路由独立。

## 实现范围

- 保留首屏、组件特色、演示、安装说明、Pro、五款工具、赞助商、开发者评价、FAQ 和页脚。
- 波浪背景沿用参考站 GradientWaves 的原始 GLSL，用浏览器 WebGL2 渲染。预设、颜色和数值编辑同步更新代码示例及 Background Studio 的链接参数。
- 波浪窗口支持拖动；轮播沿用原站照片及弧面分片几何，支持自动旋转、拖动和左右方向键；确认按钮支持鼠标、触摸和键盘按住两秒确认。
- 主题只切换本页展示，不改写应用偏好。导航、组件详情、安装文档和 Pro 链接前往原站，不添加这些站外页面的本地路由。
- 菜单支持 Escape 关闭，FAQ 使用 Ant Design 折叠面板，命令通过剪贴板复制，复制失败时显示错误提示。

## 资源、样式与选型

`public/landing` 保存实际字体、品牌、赞助商标识、轮播照片，以及从原站生成式展示区域捕获的静态预览。展示卡片中的程序生成预览使用原站截图；首屏波浪、轮播与确认按钮保留本地交互，其余预览通过链接打开原组件。资源不依赖远程图片或字体地址。

布局、局部主题变量、响应式和交互样式使用 UnoCSS，不新增全局 shortcuts 或样式文件。唯一内嵌 CSS 是所属页面的两条 `@font-face`，因为字体注册不能用工具类表达。图标复用项目已有 Lucide 集合，控件复用安装版本 Ant Design 6.6.1 的非废弃接口。

选型核对了现有 React、Ant Design、UnoCSS 依赖与浏览器原生能力：已有控件足以实现菜单、颜色输入、滑块与 FAQ；WebGL2 可直接运行原着色器，因此无需额外图形或动画依赖。颜色选择使用 Ant Design Input 的原生 color 类型，避免 ColorPicker 预设模块将折叠面板反向引入首屏。画布与轮播离屏、文档隐藏时暂停，减少动态效果偏好下静止；卸载清理帧、观察器、事件和计时器。

上游代码、标识及预览的归属保留给原作者；GradientWaves 的原始许可保存在 [LICENSE.txt](../../../../public/landing/LICENSE.txt)。字体为原站所使用的 Geist 和 Geist Mono，照片为原站加载的 Unsplash 图片。

## 验证

项目根目录 `design-qa.md` 记录实际浏览器证据、视觉对比、交互检查及最终结果。项目检查使用 `npm test`、`npm run build`、`npm run lint` 和 `npm run format:check`。
