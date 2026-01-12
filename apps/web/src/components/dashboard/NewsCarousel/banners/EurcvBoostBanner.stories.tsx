import type { Meta, StoryObj } from '@storybook/react'
import { EurcvBoostBanner } from './EurcvBoostBanner'

const meta = {
  title: 'Components/Dashboard/Banners/EurcvBoostBanner',
  component: EurcvBoostBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof EurcvBoostBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => console.log('Banner dismissed'),
  },
}
