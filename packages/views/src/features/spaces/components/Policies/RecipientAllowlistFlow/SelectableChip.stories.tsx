import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SelectableChip from './SelectableChip'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/SelectableChip',
  component: SelectableChip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    selected: true,
    onToggle: fn(),
    'aria-label': 'USDC',
    children: <span>USDC</span>,
  },
} satisfies Meta<typeof SelectableChip>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const Unselected: Story = { args: { selected: false } }

export const Token: Story = {
  args: {
    'aria-label': 'Ether',
    children: (
      <>
        <span className="size-6 rounded-full bg-muted" aria-hidden />
        <span>ETH</span>
        <span className="font-normal text-muted-foreground">1.25</span>
      </>
    ),
  },
}

export const Recipient: Story = {
  args: {
    'aria-label': 'Alice',
    children: (
      <>
        <span className="size-6 rounded-full bg-muted" aria-hidden />
        <span className="flex flex-col items-start gap-1 text-left">
          <span>Alice</span>
          <span className="font-mono text-xs font-normal text-muted-foreground">0x1234…abcd</span>
        </span>
      </>
    ),
  },
}
