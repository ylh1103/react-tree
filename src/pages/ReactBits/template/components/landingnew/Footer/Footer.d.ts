import type { ComponentType, ReactNode } from 'react';

declare const Footer: ComponentType<{
  wide?: boolean;
  lead?: ReactNode;
  brandHref?: string;
  artworkText?: string;
  navigation?: ReactNode;
  credits?: ReactNode;
}>;
export default Footer;
