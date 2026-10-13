import PlaceholderWorkspace from '../../components/PlaceholderWorkspace';
import LoadingGallery from './components/LoadingGallery';

export default function SystemParametersPage() {
  if (!import.meta.env.DEV) return <PlaceholderWorkspace title="参数项" />;
  return <LoadingGallery />;
}
