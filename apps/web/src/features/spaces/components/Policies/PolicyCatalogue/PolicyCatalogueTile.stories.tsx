import type { Meta, StoryObj } from '@storybook/react'
import { UserRoundPen, WalletCards } from 'lucide-react'
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

export const Available: Story = {
  args: {
    title: 'Proposer',
    description: 'Let teammates without signing rights propose transactions.',
    Icon: UserRoundPen,
    isAvailable: true,
    onClick: () => {},
  },
}

export const Unavailable: Story = {
  args: {
    title: 'Spending limit',
    description: 'Let spenders access assets without collecting signatures.',
    Icon: WalletCards,
    isAvailable: false,
    onClick: () => {},
  },
}
