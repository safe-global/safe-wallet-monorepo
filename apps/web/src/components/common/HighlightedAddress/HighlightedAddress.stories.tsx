import type { Meta, StoryObj } from '@storybook/react'
import HighlightedAddress from './index'

const meta = {
  component: HighlightedAddress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HighlightedAddress>

export default meta
type Story = StoryObj<typeof meta>

const address = '0x1234567890123456789012345678901234567890'

export const Full: Story = {
  args: {
    address,
  },
}

export const Shortened: Story = {
  args: {
    address,
    shorten: true,
  },
}
