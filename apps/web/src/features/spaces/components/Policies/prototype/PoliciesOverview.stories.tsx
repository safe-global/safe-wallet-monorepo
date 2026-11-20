import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { PoliciesByPolicyPage, PoliciesOverviewPage } from './m2OverviewPage'
import { createPoliciesM2Story, PAYMENTS } from './m2Prototype'

const shell = createPoliciesM2Story()

const meta = {
  title: 'Prototype/Policies overview',
  component: PoliciesOverviewPage,
  decorators: [shell.decorator],
  parameters: shell.parameters,
  args: {
    payments: { state: 'waiting', signedCount: 1, pendingChange: false },
    defaultExpanded: [PAYMENTS.address],
    onAddPolicy: fn(),
    onSelectAccount: fn(),
  },
} satisfies Meta<typeof PoliciesOverviewPage>

export default meta
type Story = StoryObj<typeof meta>

/** One row per Safe; Safes on several networks expand into one row per network. */
export const ByAccount: Story = {
  name: 'By account',
}

/** The same policies, one row per policy, laid out like M1's policy list. */
export const ByPolicy: Story = {
  name: 'By policy',
  render: ({ payments, onAddPolicy, onSelectAccount }) => (
    <PoliciesByPolicyPage payments={payments} onAddPolicy={onAddPolicy} onSelectAccount={onSelectAccount} />
  ),
}
