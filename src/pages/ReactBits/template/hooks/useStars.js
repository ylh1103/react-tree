/** 模板展示值来自本地文案，不请求 GitHub 或写入公共缓存。 */
import { templateContent } from '@/pages/ReactBits/content';
export const useStars = () => templateContent.community.stars;
