import type { Meta, StoryObj } from '@storybook/react'
import { HnDashboardBanner } from './HnDashboardBanner'

const meta = {
  component: HnDashboardBanner,
  title: 'Features/Hypernative/HnDashboardBanner',
  tags: ['autodocs'],
  parameters: {
    componentSubtitle:
      'A dashboard banner component for promoting Hypernative Guardian with badge, tag, title, description, and CTA button.',
  },
} satisfies Meta<typeof HnDashboardBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
  },
}
