import type { Meta, StoryObj } from '@storybook/react'
import PickerGroupHeader from './PickerGroupHeader'

const meta = {
  title: 'Features/Spaces/Policies/RecipientAllowlistFlow/PickerGroupHeader',
  component: PickerGroupHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[480px] bg-card p-1">
        <Story />
      </div>
    ),
  ],
  args: { label: 'In spending limits', count: 2 },
} satisfies Meta<typeof PickerGroupHeader>

export default meta
type Story = StoryObj<typeof meta>

export const SpendingLimits: Story = {}

export const OtherTokens: Story = { args: { label: 'Other tokens', count: 12 } }
