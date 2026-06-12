import type { Meta, StoryObj } from '@storybook/react'
import { Send, Plus, ArrowLeftRight, Wallet } from 'lucide-react'
import ChoiceButton from './index'

const meta = {
  component: ChoiceButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ChoiceButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Send tokens',
    description: 'Send tokens to another address',
    icon: Send,
    onClick: () => console.log('clicked'),
  },
}

export const WithChip: Story = {
  args: {
    title: 'Swap tokens',
    description: 'Exchange one token for another',
    icon: ArrowLeftRight,
    onClick: () => console.log('clicked'),
    chip: 'New',
  },
}

export const WithIconColor: Story = {
  args: {
    title: 'Add funds',
    description: 'Deposit funds into your Safe',
    icon: Plus,
    iconColor: 'success',
    onClick: () => console.log('clicked'),
  },
}

export const NoDescription: Story = {
  args: {
    title: 'Connect wallet',
    icon: Wallet,
    onClick: () => console.log('clicked'),
  },
}

export const Disabled: Story = {
  args: {
    title: 'Send tokens',
    description: 'Send tokens to another address',
    icon: Send,
    onClick: () => console.log('clicked'),
    disabled: true,
  },
}
