import type { Meta, StoryObj } from '@storybook/react'
import Identicon from './index'

const meta = {
  component: Identicon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Identicon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  },
}

export const SmallSize: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    size: 24,
  },
}

export const LargeSize: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    size: 64,
  },
}

export const DifferentAddress: Story = {
  args: {
    address: '0x1234567890123456789012345678901234567890',
  },
}

export const InvalidAddress: Story = {
  args: {
    address: 'invalid-address',
  },
}
