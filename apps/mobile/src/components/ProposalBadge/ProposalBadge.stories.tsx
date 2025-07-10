import type { StoryObj, Meta } from '@storybook/react'
import { ProposalBadge } from '@/src/components/ProposalBadge/ProposalBadge'

const meta: Meta<typeof ProposalBadge> = {
  title: 'ProposalBadge',
  component: ProposalBadge,
}

export default meta

type Story = StoryObj<typeof ProposalBadge>

export const Default: Story = {
  args: {},
}
