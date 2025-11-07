import type { Meta, StoryObj } from '@storybook/react'
import DashboardBanner from './DashboardBanner'

const meta = {
  component: DashboardBanner,
  title: 'Features/Hypernative/DashboardBanner',
  tags: ['autodocs'],
  parameters: {
    componentSubtitle:
      'A dashboard banner component for promoting Hypernative Guardian with badge, tag, title, description, and CTA button.',
  },
} satisfies Meta<typeof DashboardBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
