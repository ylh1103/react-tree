/** 为直接渲染的官方模板提供局部主题、滚动和可访问的内容跳转。 */
import { useRef, useState, type ReactNode } from 'react';
import { TemplateContext } from './model/templateContext';
import { templateContent } from './content';

export default function TemplateProvider({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  return (
    <TemplateContext value={{ theme, setTheme, root }}>
      <div
        ref={root}
        data-reactbits-template
        data-theme={theme}
        id="reactbits-top"
        lang={templateContent.metadata.language}
        className="relative h-full overflow-x-hidden overflow-y-auto [color-scheme:dark] data-[theme=light]:[color-scheme:light]"
      >
        <a
          href="#reactbits-content"
          className="absolute -top-100px z-50 bg-white p-3 text-black focus:top-3"
        >
          Skip to content
        </a>
        {children}
      </div>
    </TemplateContext>
  );
}
