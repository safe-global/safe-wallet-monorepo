import type { Meta, StoryObj } from '@storybook/react'
import TxProposalChip from './TxProposalChip'

const meta = {
  title: 'Features/Proposers/TxProposalChip',
  component: TxProposalChip,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TxProposalChip>

export default meta

type Story = StoryObj<typeof meta>

/** Marks a queued transaction that a proposer created; hover explains that signers must confirm or reject it. */
export const Default: Story = {}
