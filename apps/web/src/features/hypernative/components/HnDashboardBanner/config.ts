import type { LinkProps } from 'next/link'

export const dashboardBannerConfig = {
  title: 'Enforce enterprise-grade security',
  description: 'Automatically block risky transactions using advanced, user-defined security policies.',
  ctaLabel: 'Learn more',
  href: '#' as LinkProps['href'],
  tagLabel: 'Powered by Hypernative',
  badgeSrc: '/images/hypernative/guardian-badge.svg',
  badgeAlt: 'Guardian badge',
} as const
