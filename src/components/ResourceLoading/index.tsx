import { PageSkeleton } from '../../router/skeletons';

export function ResourceLoading() {
  return (
    <div className="h-full overflow-auto bg-canvas p-6">
      <PageSkeleton />
    </div>
  );
}
