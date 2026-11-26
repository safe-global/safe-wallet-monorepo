import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SelectableChip from './SelectableChip'
import ShortAddress from './ShortAddress'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/SelectableChip',
  component: SelectableChip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    selected: true,
    onToggle: fn(),
    'aria-label': 'Allow USDC',
    icon: <span className="size-6 rounded-full bg-muted" aria-hidden />,
    label: 'USDC',
  },
} satisfies Meta<typeof SelectableChip>

export default meta
type Story = StoryObj<typeof meta>

export const Selected: Story = {}

export const Unselected: Story = { args: { selected: false } }

export const Recipient: Story = {
  args: {
    'aria-label': 'Allow Alice',
    label: 'Alice',
    subline: <ShortAddress address="0x8675B754342754A30A2AeF474D114d8460bca19b" />,
  },
}

export const LongLabel: Story = {
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Allow Payroll provider for the contractors in Europe',
    label: 'Payroll provider for the contractors in Europe',
    subline: <ShortAddress address="0x8675B754342754A30A2AeF474D114d8460bca19b" />,
  },
}
