import { Tabs } from 'antd';
import DataLoadingGallery from './DataLoadingGallery';
import ThreeDimensionalGallery from './ThreeDimensionalGallery';
import FlatLoadingGallery from './FlatLoadingGallery';

export default function LoadingGallery() {
  return (
    <Tabs
      defaultActiveKey="data"
      className="[&_.ant-tabs-nav]:mb-4!"
      items={[
        { key: 'data', label: '新方案 · 页面数据加载', children: <DataLoadingGallery /> },
        { key: '3d', label: '之前的 3D 方案', children: <ThreeDimensionalGallery /> },
        { key: 'flat', label: '之前的平面方案', children: <FlatLoadingGallery /> },
      ]}
    />
  );
}
