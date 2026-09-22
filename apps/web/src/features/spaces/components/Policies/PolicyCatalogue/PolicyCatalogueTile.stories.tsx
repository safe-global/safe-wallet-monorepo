import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { MessageSquarePlus, WalletCards } from 'lucide-react'
import PolicyCatalogueTile from './PolicyCatalogueTile'

const meta = {
  title: 'Features/Spaces/PolicyCatalogueTile',
  component: PolicyCatalogueTile,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <div className="max-w-[560px]">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof PolicyCatalogueTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'spending-limit',
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    action: 'Set policy',
    onClick: fn(),
  },
}

/** The last tile asks for feedback instead of setting a policy. */
export const Suggestion: Story = {
  args: {
    id: 'suggestion',
    title: 'Something missing?',
    description: 'Tell us which rules would help you manage your Safe accounts.',
    Icon: MessageSquarePlus,
    action: 'Give feedback',
    onClick: fn(),
  },
}
