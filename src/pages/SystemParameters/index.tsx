/** 参数项暂未接入业务：开发环境保留原有 Loading 效果图库，生产环境使用占位工作区。 */
import PlaceholderWorkspace from '@/components/PlaceholderWorkspace';
import LoadingGallery from './components/LoadingGallery';

export default function SystemParametersPage() {
  if (!import.meta.env.DEV) return <PlaceholderWorkspace title="参数项" />;
  return <LoadingGallery />;
}
