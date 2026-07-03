import type { Meta, StoryObj } from '@storybook/react'
import QRCode from './index'

const meta = {
  title: 'Components/Common/QRCode',
  component: QRCode,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-card p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof QRCode>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    size: 150,
  },
}

export const SmallSize: Story = {
  args: {
    value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    size: 100,
  },
}

export const LargeSize: Story = {
  args: {
    value: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    size: 250,
  },
}

export const LongValue: Story = {
  args: {
    value: 'ethereum:0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552@1',
    size: 200,
  },
}

export const Loading: Story = {
  args: {
    value: undefined,
    size: 150,
  },
}
