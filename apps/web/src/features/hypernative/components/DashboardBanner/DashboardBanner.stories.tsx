import type { Meta, StoryObj } from '@storybook/react'
import DashboardBanner from './DashboardBanner'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const meta = {
  component: DashboardBanner,
  title: 'Features/Hypernative/DashboardBanner',
  tags: ['autodocs'],
  parameters: {
    componentSubtitle: 'A dashboard banner component for promoting Hypernative Guardian with badge, tag, title, description, and CTA button.',
  },
} satisfies Meta<typeof DashboardBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Strengthen your Safe',
    description: 'Automatically block risky transactions using advanced, user-defined security policies.',
    ctaLabel: 'Learn more',
    href: '#',
    tagLabel: 'Powered by Hypernative',
    badgeSrc: '/images/hypernative/guardian-badge.svg',
    badgeAlt: 'Guardian badge',
    endIcon: <ArrowForwardIcon fontSize="small" />,
  },
}

