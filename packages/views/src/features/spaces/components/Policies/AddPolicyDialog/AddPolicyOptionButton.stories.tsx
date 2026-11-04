import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { MessageSquarePlus, WalletCards } from 'lucide-react'
import AddPolicyOptionButton from './AddPolicyOptionButton'

const meta = {
  title: 'Features/Spaces/AddPolicyOptionButton',
  component: AddPolicyOptionButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <div className="max-w-[512px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof AddPolicyOptionButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
  },
}

export const Suggestion: Story = {
  args: {
    id: 'suggestion',
    title: 'Suggest the next policy',
    description: 'Tell us which rules would help you manage your Safe Accounts.',
    Icon: MessageSquarePlus,
  },
}

export const Disabled: Story = {
  args: {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    disabled: true,
    disabledTooltip: 'You need to be an Admin to add policies',
  },
}
