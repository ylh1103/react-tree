/** 官方首页源码的项目内入口：页面主题和滚动独立，组件与资源均在本地。 */
import './template/styles.css';
import 'virtual:reactbits-utilities.css';
import LandingPage from './template/pages/LandingPage';
import TemplateProvider from './TemplateProvider';

export default function ReactBits() {
  return (
    <TemplateProvider>
      <LandingPage />
    </TemplateProvider>
  );
}
