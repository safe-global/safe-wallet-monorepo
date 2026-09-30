import type { Decorator, Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import QRCode from './index'

const withStore: Decorator = (Story, context) => (
  <StoreDecorator initialState={{}} context={context}>
    <div className="rounded-lg bg-card p-4">
      <Story />
    </div>
  </StoreDecorator>
)

const meta = {
  title: 'Components/Common/QRCode',
  component: QRCode,
  parameters: {
    layout: 'centered',
  },
  decorators: [withStore],
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
