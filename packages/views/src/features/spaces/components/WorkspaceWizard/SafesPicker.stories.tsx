import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SafesPicker from './SafesPicker'

const ListSlot = () => (
  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
    The list of the user&apos;s Safe accounts renders here
  </div>
)

const meta = {
  title: 'Features/Spaces/WorkspaceWizard/SafesPicker',
  component: SafesPicker,
  parameters: { layout: 'padded' },
  args: {
    hasNoSafes: false,
    hasNoResults: false,
    seatCount: 2,
    limit: 5,
    isAtLimit: false,
    onSearch: fn(),
    list: <ListSlot />,
    error: null,
  },
  decorators: [
    (Story) => (
      <div className="flex max-w-[640px] flex-col gap-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafesPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AtLimit: Story = {
  args: { seatCount: 5, isAtLimit: true },
}

export const OverLimit: Story = {
  args: { seatCount: 7, isAtLimit: true, error: 'Remove 2 Safe accounts or pick a larger plan' },
}

export const NoLimit: Story = {
  args: { seatCount: 12, limit: null },
}

export const NoResults: Story = {
  args: { hasNoResults: true },
}

export const NoSafes: Story = {
  args: { hasNoSafes: true, seatCount: 0 },
}
