import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import AddPolicyDialog from './index'
import { ADD_POLICY_OPTIONS, RECOVERY_POLICY_OPTION } from './options'

const meta = {
  title: 'Features/Spaces/AddPolicyDialog',
  component: AddPolicyDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    open: true,
    onOpenChange: fn(),
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddPolicyDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDisabledOption: Story = {
  args: {
    options: ADD_POLICY_OPTIONS.map((option) =>
      option.id === 'spending-limit'
        ? { ...option, disabled: true, disabledTooltip: 'You need to be an Admin to add policies' }
        : option,
    ),
  },
}

export const TwoColumns: Story = {
  args: {
    options: [
      ...ADD_POLICY_OPTIONS,
      RECOVERY_POLICY_OPTION,
      { ...RECOVERY_POLICY_OPTION, id: 'spending-limit', title: 'Treasury cap' },
    ],
  },
}
