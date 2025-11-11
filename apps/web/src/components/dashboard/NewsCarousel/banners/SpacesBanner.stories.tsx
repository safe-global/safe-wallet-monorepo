import type { Meta, StoryObj } from '@storybook/react'
import SpacesBanner from './SpacesBanner'

const meta = {
  component: SpacesBanner,
  title: 'Components/Dashboard/NewsCarousel/SpacesBanner',
  tags: ['autodocs'],
  parameters: {
    componentSubtitle: 'The Improved Spaces promotional banner displayed in the dashboard news carousel.',
  },
} satisfies Meta<typeof SpacesBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => { },
  },
}

