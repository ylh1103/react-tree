/** 使用模板容器的滚动位置，不修改项目外层滚动状态。 */
import { useEffect } from 'react';
import { useTemplateRoot } from '@/pages/ReactBits/hooks/useTemplateTheme';
export default function useScrollToTop() {
  const root = useTemplateRoot();
  useEffect(() => {
    root.current?.scrollTo(0, 0);
  }, [root]);
}
