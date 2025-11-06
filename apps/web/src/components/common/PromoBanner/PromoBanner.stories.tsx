import type { Meta, StoryObj } from '@storybook/react'
import PromoBanner from './PromoBanner'

const meta = {
  component: PromoBanner,
  title: 'Components/Common/PromoBanner',
  tags: ['autodocs'],
  parameters: {
    componentSubtitle: 'A customizable promotional banner with image, text, CTA button, and dismiss functionality.',
  },
} satisfies Meta<typeof PromoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Discover new features',
    description: 'Learn about the latest updates and improvements to Safe',
    ctaLabel: 'Learn more',
    href: '#',
    trackOpenProps: { action: 'Click promo banner', category: 'overview' },
    trackHideProps: { action: 'Dismiss promo banner', category: 'overview' },
    onDismiss: () => {},
    imageSrc: '/images/hypernative/guardian-badge.svg',
    imageAlt: 'Promo image',
  },
}

export const WithoutImage: Story = {
  args: {
    title: 'Important announcement',
    description: 'Check out our latest security features',
    ctaLabel: 'View details',
    href: '#',
    trackOpenProps: { action: 'Click promo banner', category: 'overview' },
    trackHideProps: { action: 'Dismiss promo banner', category: 'overview' },
    onDismiss: () => {},
  },
}

export const WithCustomColors: Story = {
  args: {
    title: 'Special offer',
    description: 'Limited time promotion for Safe users',
    ctaLabel: 'Claim now',
    href: '#',
    trackOpenProps: { action: 'Click promo banner', category: 'overview' },
    trackHideProps: { action: 'Dismiss promo banner', category: 'overview' },
    onDismiss: () => {},
    imageSrc: '/images/hypernative/guardian-badge.svg',
    imageAlt: 'Special offer',
    customFontColor: '#FFD700',
    customBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
}

export const WithoutDismiss: Story = {
  args: {
    title: 'Welcome to Safe',
    description: 'Your gateway to secure digital asset management',
    ctaLabel: 'Get started',
    href: '#',
    trackOpenProps: { action: 'Click promo banner', category: 'overview' },
    trackHideProps: { action: 'Dismiss promo banner', category: 'overview' },
    imageSrc: '/images/hypernative/guardian-badge.svg',
    imageAlt: 'Welcome',
  },
}

export const ShortText: Story = {
  args: {
    title: 'New update available',
    ctaLabel: 'Update',
    href: '#',
    trackOpenProps: { action: 'Click promo banner', category: 'overview' },
    trackHideProps: { action: 'Dismiss promo banner', category: 'overview' },
    onDismiss: () => {},
  },
}
