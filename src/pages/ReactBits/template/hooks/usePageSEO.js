/** 路由元信息来自可编辑文案，离开模板时恢复原页面的标题和描述。 */
import { useEffect } from 'react';
import { templateContent } from '@/pages/ReactBits/content';
export default function usePageSEO() {
  useEffect(() => {
    const title = document.title;
    const previous = document.head.querySelector('meta[name="description"]');
    const description = previous || document.createElement('meta');
    const saved = previous?.getAttribute('content');
    description.setAttribute('name', 'description');
    description.setAttribute('content', templateContent.metadata.description);
    if (!previous) document.head.appendChild(description);
    document.title = templateContent.metadata.title;
    return () => {
      document.title = title;
      if (!previous) description.remove();
      else if (saved === null) description.removeAttribute('content');
      else description.setAttribute('content', saved);
    };
  }, []);
}
