import type { Meta, StoryObj } from '@storybook/react'
import LimitedActionsHint from './LimitedActionsHint'

const meta = {
  title: 'Features/Spaces/Policies/components/LimitedActionsHint',
  component: LimitedActionsHint,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof LimitedActionsHint>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
