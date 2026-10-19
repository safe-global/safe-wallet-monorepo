import type { ReactElement } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { AccountPanel, type AccountPanelProps } from './m2AccountPanel'
import { PoliciesOverviewPage } from './m2OverviewPage'
import { createPoliciesM2Story, PAYMENTS, VAULT_3 } from './m2Prototype'

/** The panel open over the Policies overview, as it appears after clicking Payments on Ethereum. */
const PanelOverOverview = (props: AccountPanelProps): ReactElement => (
  <>
    <PoliciesOverviewPage
      payments={{
        state: props.state,
        signedCount: props.signedCount ?? 0,
        pendingChange: props.pendingChange ?? false,
      }}
      defaultExpanded={[PAYMENTS.address]}
    />
    <AccountPanel {...props} />
  </>
)

const shell = createPoliciesM2Story()

const meta = {
  title: 'Prototype/Account panel',
  component: PanelOverOverview,
  decorators: [shell.decorator],
  parameters: shell.parameters,
  args: {
    open: true,
    state: 'not-set-up',
    signedCount: 0,
    hasSpendingLimit: true,
    onClose: fn(),
    onSetUp: fn(),
    onReview: fn(),
    onReject: fn(),
    onOpenExecute: fn(),
    onRetryExecute: fn(),
    onCreateRejection: fn(),
    onCloseDialog: fn(),
    onCancelChange: fn(),
  },
} satisfies Meta<typeof PanelOverOverview>

export default meta
type Story = StoryObj<typeof meta>

/** Payments has M1's Ops bot spending limit but no M2 guard, so the limit is listed above the setup. */
export const NotProtected: Story = {}

/** Vault 3 has no guard and no M1 policies either: also "Not protected", with only the setup. */
export const NotProtectedNoPolicies: Story = {
  args: { account: VAULT_3, hasSpendingLimit: false },
}

/** The setup has 1 of 2 signatures; nothing changes until it executes. */
export const WaitingForSignatures: Story = {
  args: { state: 'waiting', signedCount: 1 },
}

/** All signatures are in; anyone on the team can execute it. */
export const ReadyToExecute: Story = {
  args: { state: 'ready', signedCount: 2 },
}

/** The execution is on its way; the action is disabled. */
export const Executing: Story = {
  args: { state: 'executing', signedCount: 2 },
}

/** The execution failed; nothing changed and it can be retried. */
export const ExecutionFailed: Story = {
  args: { state: 'execution-failed', signedCount: 2 },
}

/** Policies are on for Payments. */
export const Active: Story = {
  args: { state: 'enforcing', signedCount: 2 },
}

/** Policies are on and one change is waiting out the delay. */
export const ChangePending: Story = {
  args: { state: 'enforcing', signedCount: 2, pendingChange: true },
}

/** Confirming execution of the fully signed setup. */
export const ExecuteDialog: Story = {
  args: { state: 'ready', signedCount: 2 },
}

/** Confirming a rejection of the setup. */
export const RejectDialog: Story = {
  args: { state: 'waiting', signedCount: 1, dialog: 'reject' },
}
