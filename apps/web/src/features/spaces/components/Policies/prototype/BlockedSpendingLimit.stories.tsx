import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { BlockedSpendingLimitDrawer, type BlockedSpendingLimitDrawerProps } from './m2BlockedSpendingLimitDrawer'
import { PAYMENTS_LIMIT } from './m2AccountPanel'
import { PoliciesByPolicyPage } from './m2OverviewPage'
import { createPoliciesM2Story } from './m2Prototype'

/** The panel open over the By policy table, with the Payments allowlist live. */
const DrawerOverPolicies = (props: BlockedSpendingLimitDrawerProps): ReactElement => (
  <>
    <PoliciesByPolicyPage payments={{ state: 'enforcing', signedCount: 2, pendingChange: false }} />
    <BlockedSpendingLimitDrawer {...props} />
  </>
)

const shell = createPoliciesM2Story()

const meta = {
  title: 'Prototype/Spending limit side panel – blocked by allowlist',
  component: DrawerOverPolicies,
  decorators: [shell.decorator],
  parameters: shell.parameters,
  args: {
    open: true,
    variant: 'blocked',
    limit: PAYMENTS_LIMIT,
    blockedTokens: ['USDC'],
    onClose: fn(),
    onEdit: fn(),
  },
} satisfies Meta<typeof DrawerOverPolicies>

export default meta
type Story = StoryObj<typeof meta>

/** The Ops bot's 500 USDC per day limit predates the Payments allowlist, which doesn't allow USDC. */
export const BlockedByAllowlist: Story = {}
