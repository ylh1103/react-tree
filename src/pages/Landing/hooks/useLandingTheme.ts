/** 产品页仅暴露实际使用的主题状态与滚动容器，不兼容演示站点别名接口。 */
import { useContext } from 'react';
import { LandingContext } from '../model/landingContext';
export function useLandingTheme() {
  const context = useContext(LandingContext);
  if (!context) throw new Error('落地页组件必须位于 LandingProvider 内。');
  return context;
}
