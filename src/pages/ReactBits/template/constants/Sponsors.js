export const diamondSponsors = [
  {
    id: 1,
    name: 'shadcnblocks.com',
    imageUrl: '/reactbits/assets/sponsors/shadcnblocks.svg',
    lightImageUrl: '/reactbits/assets/sponsors/shadcnblocks-lightmode.svg',
    url: 'https://www.shadcnblocks.com/',
  },
  {
    id: 2,
    name: 'shaders.com',
    imageUrl: '/reactbits/assets/sponsors/shaders.svg',
    lightImageUrl: '/reactbits/assets/sponsors/shaders-lightmode.svg',
    url: 'https://shaders.com/',
  },
];

export const platinumSponsors = [];

export const silverSponsors = [
  {
    id: 1,
    name: 'shadcnuikit.com',
    imageUrl: '/reactbits/assets/sponsors/shadcnuikit.svg',
    lightImageUrl: '/reactbits/assets/sponsors/shadcnuikit-lightmode.svg',
    url: 'https://shadcnuikit.com/',
  },
  {
    id: 2,
    name: 'Shadcn Studio',
    imageUrl: '/reactbits/assets/sponsors/shadcnstudio.svg',
    lightImageUrl: '/reactbits/assets/sponsors/shadcnstudio-lightmode.svg',
    url: 'https://shadcnstudio.com/',
  },
];

export const hasSponsors =
  diamondSponsors.length > 0 || platinumSponsors.length > 0 || silverSponsors.length > 0;
export const hasDiamondSponsors = diamondSponsors.length > 0;
export const hasPlatinumSponsors = platinumSponsors.length > 0;
export const hasSilverSponsors = silverSponsors.length > 0;
