import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { RecoveryProposalCard } from './RecoveryProposalCard'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const meta = {
  title: 'Features/Recovery/RecoveryProposalCard',
  component: RecoveryProposalCard,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof RecoveryProposalCard>

export default meta

type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    onClose: () => {},
  },
}

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
}
