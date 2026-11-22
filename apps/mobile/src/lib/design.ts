// Shared TESFA presentation rules for the Android app and browser site.
// Keep the typography and blue identity restrained; screens may change layout by platform.
export const design = {
  width: {
    content: 1240,
    desktopNav: 960,
    tablet: 820,
    phone: 600,
  },
  gutter: {
    phone: 20,
    desktop: 32,
  },
  radius: {
    small: 6,
    control: 8,
    card: 10,
  },
  brand: '#173B63',
} as const;

export const campaignCategories = ['medical', 'education', 'emergency'] as const;
export type CampaignCategory = (typeof campaignCategories)[number];

export function campaignCategoryFromParam(value: string | undefined): CampaignCategory | 'all' {
  return campaignCategories.find((category) => category === value) ?? 'all';
}
