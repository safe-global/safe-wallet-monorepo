import type { ReactElement } from 'react'
import { UserRoundPen, Users, Wallet } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import PolicyStatusChip from '@safe-global/views/features/spaces/components/Policies/components/PolicyStatusChip'
import { PAYMENTS, SafeAddress, TREASURY, VAULT_3, type M2Account } from '../../m2Prototype'
import { getAccountTokens } from '../../m2SetupFlow'
import { PanelRow, PanelSection } from '../PanelBody'
import { STATUS } from '../SharedDrawerHeader'
import type { FooterActions } from '../SignaturesFooter'
import type { PanelType, PanelVariant } from '../VariantPanel'
import {
  NADIA,
  PRIYA,
  PolicyOverview,
  RecipientsSection,
  SIGNING_TIME,
  TOM,
  TokensSection,
  created,
  needed,
  signed,
} from './shared'

const icon = (Icon: typeof Users, title: string, subtitle?: string) =>
  ({ kind: 'icon', icon: Icon, title, subtitle }) as const

// ——— Recipient allowlist ———

const ALLOWLIST = 'Recipient allowlist'
const allowlistMedia = icon(Users, ALLOWLIST)
const ALLOWLIST_LONG = 'Recipient allowlist with spending limits for contractors'

const AllowlistBody = ({ removed }: { removed?: boolean }): ReactElement => (
  <>
    <RecipientsSection account={PAYMENTS} removed={removed} />
    <TokensSection account={PAYMENTS} removed={removed} />
    <PolicyOverview account={PAYMENTS} enforcedBy="Safe policy guard" />
  </>
)

const PENDING_TITLE = 'The recipient allowlist is not active as the transaction is not yet executed.'
const CREATED_AT = 'Oct 12, 2026 · 13:02'

const yourSignature = {
  ...SIGNING_TIME,
  signed: 1,
  required: 2,
  rows: [created(NADIA, CREATED_AT), signed(NADIA, CREATED_AT), needed(TOM)],
}

const allowlist = (rest: Omit<PanelVariant, 'group' | 'media' | 'longTitle'>): PanelVariant => ({
  group: ALLOWLIST,
  media: allowlistMedia,
  longTitle: ALLOWLIST_LONG,
  ...rest,
})

const gotIt: FooterActions = { primary: { label: 'Got it', dismiss: true } }

const ALLOWLIST_VARIANTS: PanelVariant[] = [
  allowlist({
    id: 'allowlist-active',
    label: 'Active · signer',
    status: STATUS.active,
    body: <AllowlistBody />,
    actions: { primary: { label: 'Edit' }, secondary: { label: 'Remove' } },
  }),
  allowlist({
    id: 'allowlist-active-no-wallet',
    label: 'Active · no wallet',
    status: STATUS.active,
    body: <AllowlistBody />,
    actions: { primary: { label: 'Connect wallet' }, hint: 'Connect a signer wallet to edit.' },
  }),
  allowlist({
    id: 'allowlist-active-not-signer',
    label: 'Active · not a signer',
    status: STATUS.active,
    body: <AllowlistBody />,
    actions: {
      primary: { label: 'Edit', disabled: true },
      hint: 'Only signers of this Safe account can edit this recipient allowlist.',
    },
  }),
  allowlist({
    id: 'allowlist-pending-you',
    label: 'Pending · your signature',
    status: STATUS.pending,
    banner: { tone: 'warning', title: PENDING_TITLE, description: 'Sign and execute the transaction to activate.' },
    body: <AllowlistBody />,
    signatures: { ...yourSignature, actions: { primary: { label: 'Review and sign' } } },
  }),
  allowlist({
    id: 'allowlist-pending-signed',
    label: "Pending · you've signed",
    status: STATUS.pending,
    banner: { tone: 'warning', title: PENDING_TITLE, description: "You've signed. Waiting for 1 more signature." },
    body: <AllowlistBody />,
    signatures: {
      ...SIGNING_TIME,
      signed: 1,
      required: 2,
      rows: [created(TOM, CREATED_AT), signed(TOM, CREATED_AT), needed(PRIYA)],
      actions: { primary: { label: 'Waiting on others', disabled: true } },
    },
  }),
  allowlist({
    id: 'allowlist-pending-no-wallet',
    label: 'Pending · no wallet',
    status: STATUS.pending,
    banner: { tone: 'warning', title: PENDING_TITLE, description: 'Connect a signer wallet to sign this transaction.' },
    body: <AllowlistBody />,
    signatures: {
      ...SIGNING_TIME,
      signed: 1,
      required: 2,
      rows: [created(NADIA, CREATED_AT), signed(NADIA, CREATED_AT), needed(PRIYA)],
      actions: { primary: { label: 'Connect wallet' }, hint: 'Connect a signer wallet of Payments to sign.' },
    },
  }),
  allowlist({
    id: 'allowlist-ready',
    label: 'Pending · ready to execute',
    status: STATUS.pending,
    banner: { tone: 'warning', title: PENDING_TITLE, description: 'Execute the transaction to activate.' },
    body: <AllowlistBody />,
    signatures: {
      ...SIGNING_TIME,
      signed: 2,
      required: 2,
      rows: [created(NADIA, CREATED_AT), signed(NADIA, CREATED_AT), signed(TOM, 'Oct 13, 2026 · 09:20')],
      actions: { primary: { label: 'Review and execute' } },
    },
  }),
  allowlist({
    id: 'allowlist-removal',
    label: 'Pending · removal',
    status: STATUS.pending,
    banner: {
      tone: 'warning',
      title: 'This recipient allowlist is still active until the removal is executed.',
      description: 'Sign and execute the transaction to remove it.',
    },
    body: <AllowlistBody removed />,
    signatures: { ...yourSignature, actions: { primary: { label: 'Review and sign' } } },
  }),
  allowlist({
    id: 'allowlist-executed',
    label: 'Executed · 24h delay',
    status: STATUS.pending,
    banner: {
      tone: 'warning',
      title: 'The transaction was executed.',
      description: 'The recipient allowlist applies after the 24‑hour delay.',
    },
    body: <AllowlistBody />,
  }),
  allowlist({
    id: 'allowlist-change-pending',
    label: 'Change pending',
    status: STATUS.pending,
    banner: {
      tone: 'warning',
      title: 'Change pending',
      description: 'Applies in 24h · Oct 13, 20:00. Any signer can cancel it before then.',
    },
    body: <AllowlistBody />,
    actions: { primary: { label: 'Cancel change', variant: 'secondary' } },
  }),
  allowlist({
    id: 'allowlist-failed',
    label: 'Failed',
    status: STATUS.failed,
    banner: {
      tone: 'error',
      title: 'The transaction failed and can no longer be executed.',
      description: 'Close this panel to see the current policies.',
    },
    body: <AllowlistBody />,
    actions: gotIt,
  }),
  allowlist({
    id: 'allowlist-replaced',
    label: 'Replaced',
    status: STATUS.failed,
    banner: {
      tone: 'error',
      title: 'Another transaction used this nonce, so this one can no longer be executed.',
      description: 'Close this panel to see the current policies.',
    },
    body: <AllowlistBody />,
    actions: gotIt,
  }),
]

// ——— Spending limit ———

const SPENDING_LIMIT = 'Spending limit'

/** M1's Limits section: the spender, then one row per token allowance. */
const LimitsSection = ({ account, usage }: { account: M2Account; usage?: boolean }): ReactElement => (
  <PanelSection title="Limits">
    <PanelRow label="Spender 1" account>
      <SafeAddress name="Ops bot" address="0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5" chainId={account.chainId} />
    </PanelRow>
    {getAccountTokens(account)
      .slice(0, 2)
      .map(({ symbol, logoUri }, index) => (
        <div key={symbol} className="flex min-h-8 items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
            <Typography variant="paragraph-small-medium">{symbol}</Typography>
          </span>
          <span className="flex flex-col items-end">
            <Typography variant="paragraph-small-medium">{index === 0 ? '1,500' : '1,000'}/month</Typography>
            {usage && (
              <Typography variant="paragraph-mini" color="muted">
                {index === 0 ? '1,120' : '1,000'} remaining · Resets Nov 1
              </Typography>
            )}
          </span>
        </div>
      ))}
  </PanelSection>
)

const spendingLimit = (rest: Omit<PanelVariant, 'group' | 'media' | 'longTitle'>): PanelVariant => ({
  group: SPENDING_LIMIT,
  media: icon(Wallet, SPENDING_LIMIT),
  longTitle: 'Spending limit for the Ops bot on Payments',
  ...rest,
})

const limitOverview = (
  <PolicyOverview account={PAYMENTS} enforcedBy="Safe allowance module" lastUpdated="Jun 4, 2026 · 09:12" />
)

const SPENDING_LIMIT_VARIANTS: PanelVariant[] = [
  spendingLimit({
    id: 'limit-active',
    label: 'Active',
    status: STATUS.active,
    body: (
      <>
        <LimitsSection account={PAYMENTS} usage />
        {limitOverview}
      </>
    ),
    actions: { primary: { label: 'Edit' } },
  }),
  spendingLimit({
    id: 'limit-blocked',
    label: 'Blocked by allowlist',
    status: STATUS.blocked,
    banner: {
      tone: 'error',
      title: "This spending limit can't be used anymore",
      description: (
        <>
          You have a policy that restricts sending of USDC.{' '}
          <button type="button" className="font-medium text-foreground underline underline-offset-2">
            See policy here
          </button>
        </>
      ),
    },
    body: (
      <>
        <LimitsSection account={PAYMENTS} usage />
        {limitOverview}
      </>
    ),
    actions: { primary: { label: 'Edit' } },
  }),
  spendingLimit({
    id: 'limit-locked',
    label: 'Locked by allowlist',
    status: STATUS.active,
    banner: {
      tone: 'info',
      title: 'This spending limit is locked',
      description:
        "The recipient allowlist on Payments applies to it, so it can't be changed. Turn that off in the allowlist to edit it.",
    },
    body: (
      <>
        <LimitsSection account={PAYMENTS} usage />
        {limitOverview}
      </>
    ),
    actions: { primary: { label: 'Edit', disabled: true }, hint: 'Locked by the recipient allowlist.' },
  }),
  spendingLimit({
    id: 'limit-pending',
    label: 'Pending · your signature',
    status: STATUS.pending,
    banner: {
      tone: 'warning',
      title: 'The spending limit is not active as the transaction is not yet executed.',
      description: 'Sign and execute the transaction to activate.',
    },
    body: (
      <>
        <LimitsSection account={PAYMENTS} />
        {limitOverview}
      </>
    ),
    signatures: { ...yourSignature, actions: { primary: { label: 'Review and sign' } } },
  }),
]

// ——— Proposer ———

const PROPOSER = 'Proposer role'

const ProposerOverview = (): ReactElement => (
  <PolicyOverview
    account={TREASURY}
    enforcedBy="Safe module"
    link={false}
    lastUpdated="Jul 21, 2026 · 10:04"
    extra={[
      <PanelRow key="proposer" label="Proposer" account>
        <SafeAddress name={TOM.name} address={TOM.address} />
      </PanelRow>,
      <PanelRow key="initiated-by" label="Initiated by" account>
        <SafeAddress name={NADIA.name} address={NADIA.address} />
      </PanelRow>,
    ]}
  />
)

const proposer = (rest: Omit<PanelVariant, 'group' | 'media' | 'longTitle'>): PanelVariant => ({
  group: PROPOSER,
  media: icon(UserRoundPen, PROPOSER),
  longTitle: 'Proposer role for Tom Reyes on the Treasury account',
  ...rest,
})

const PROPOSER_VARIANTS: PanelVariant[] = [
  proposer({
    id: 'proposer-active',
    label: 'Active',
    status: STATUS.active,
    body: <ProposerOverview />,
    actions: { primary: { label: 'Remove proposer', variant: 'secondary' } },
  }),
  proposer({
    id: 'proposer-pending',
    label: 'Pending · parent Safe signs',
    status: STATUS.pending,
    banner: {
      tone: 'warning',
      title: 'The proposer role is not active yet',
      description:
        'Treasury is a nested Safe account. The parent Safe account, Ops, needs to execute the transaction before the proposer role activates.',
    },
    body: <ProposerOverview />,
    signatures: {
      meta: 'Expires in 1h 33 min',
      signed: 2,
      required: 3,
      rows: [
        created(NADIA, 'Jul 21, 2026 · 10:04'),
        signed(NADIA, 'Jul 21, 2026 · 10:04'),
        signed(PRIYA, 'Jul 21, 2026 · 11:30'),
        needed(TOM),
      ],
      actions: { primary: { label: 'Review and sign' } },
    },
  }),
  proposer({
    id: 'proposer-not-activated',
    label: 'Not activated',
    status: STATUS.notActivated,
    banner: {
      tone: 'error',
      title: 'The proposer role was not activated',
      description:
        'A signer of the parent Safe account, Ops, rejected the transaction. Set the policy up again to retry.',
    },
    body: <ProposerOverview />,
    actions: { primary: { label: 'Retry' } },
  }),
]

// ——— Account panel ———

const ACCOUNT_PANEL = 'Account panel'

const accountPanel = (safe: M2Account, rest: Omit<PanelVariant, 'group' | 'media' | 'longTitle'>): PanelVariant => ({
  group: ACCOUNT_PANEL,
  media: { kind: 'account', name: safe.name, address: safe.address, chainId: safe.chainId },
  longTitle: 'Payments and payroll account for contractors in Europe',
  ...rest,
})

const SETUP_STEPS = [
  'We check the account is ready',
  'Your usual recipients are added for you',
  'Everything else is blocked',
]

const SetupCoverage = ({ title }: { title: string }): ReactElement => (
  <PanelSection title={title}>
    {SETUP_STEPS.map((step, index) => (
      <div key={step} className="flex min-h-8 items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {index + 1}
        </span>
        <Typography variant="paragraph-small">{step}</Typography>
      </div>
    ))}
  </PanelSection>
)

const ActivePolicies = ({ allowlist: hasAllowlist }: { allowlist?: boolean }): ReactElement => (
  <PanelSection title="Active policies">
    {hasAllowlist && (
      <PanelRow label="Recipient allowlist">
        <PolicyStatusChip status="active" />
      </PanelRow>
    )}
    <PanelRow label="Spending limit">
      <PolicyStatusChip status="active" />
    </PanelRow>
  </PanelSection>
)

const GuardOverview = (): ReactElement => (
  <PanelSection title="Policy overview">
    <PanelRow label="Allowed recipients">5</PanelRow>
    <PanelRow label="When nothing matches">Blocked</PanelRow>
    <PanelRow label="Enforced by">Safe guard</PanelRow>
  </PanelSection>
)

const ACCOUNT_VARIANTS: PanelVariant[] = [
  accountPanel(PAYMENTS, {
    id: 'account-not-protected',
    label: 'Not protected',
    status: STATUS.notProtected,
    note: 'Policies check every transaction before it goes through and block anything you haven’t allowed.',
    body: (
      <>
        <ActivePolicies />
        <SetupCoverage title="Add protection" />
      </>
    ),
    actions: { primary: { label: 'Set up policies' }, hint: 'One transaction, signed by 2 of 3.' },
  }),
  accountPanel(VAULT_3, {
    id: 'account-not-protected-empty',
    label: 'Not protected · no policies',
    status: STATUS.notProtected,
    note: 'Policies check every transaction before it goes through and block anything you haven’t allowed.',
    body: <SetupCoverage title="What setup covers" />,
    actions: { primary: { label: 'Set up policies' }, hint: 'One transaction, signed by 2 of 2.' },
  }),
  accountPanel(PAYMENTS, {
    id: 'account-waiting',
    label: 'Waiting for signatures',
    status: STATUS.changePending,
    note: 'Nothing changes on this account until it’s executed.',
    body: (
      <>
        <RecipientsSection account={PAYMENTS} />
        <TokensSection account={PAYMENTS} />
      </>
    ),
    signatures: {
      ...yourSignature,
      actions: { primary: { label: 'Review and sign' }, secondary: { label: 'Reject', variant: 'ghost-destructive' } },
    },
  }),
  accountPanel(PAYMENTS, {
    id: 'account-ready',
    label: 'Ready to execute',
    status: STATUS.changePending,
    note: 'All signatures are in. Anyone on the team can execute it.',
    body: (
      <>
        <RecipientsSection account={PAYMENTS} />
        <TokensSection account={PAYMENTS} />
      </>
    ),
    signatures: {
      ...SIGNING_TIME,
      signed: 2,
      required: 2,
      rows: [created(NADIA, CREATED_AT), signed(NADIA, CREATED_AT), signed(TOM, 'Oct 13, 2026 · 09:20')],
      actions: { primary: { label: 'Execute' } },
    },
  }),
  accountPanel(PAYMENTS, {
    id: 'account-execution-failed',
    label: 'Execution failed',
    status: STATUS.changePending,
    banner: { tone: 'error', title: 'Execution failed', description: 'Nothing changed on this account.' },
    body: (
      <>
        <RecipientsSection account={PAYMENTS} />
        <TokensSection account={PAYMENTS} />
      </>
    ),
    actions: { primary: { label: 'Try again' } },
  }),
  accountPanel(TREASURY, {
    id: 'account-active',
    label: 'Active',
    status: STATUS.active,
    note: 'Changes take 24 hours to apply. Any signer can cancel them.',
    body: (
      <>
        <ActivePolicies allowlist />
        <GuardOverview />
      </>
    ),
    actions: { primary: { label: 'Add policy' } },
  }),
  accountPanel(TREASURY, {
    id: 'account-change-pending',
    label: 'Change pending',
    status: STATUS.changePending,
    banner: {
      tone: 'warning',
      title: 'Change pending',
      description: 'Applies in 23h 00m. Any signer can cancel it before then.',
    },
    body: (
      <>
        <PanelSection title="Pending change" rightNode="Applies in 23h 00m">
          <PanelRow label="1 change">
            <Button variant="outline" size="sm">
              Cancel change
            </Button>
          </PanelRow>
        </PanelSection>
        <ActivePolicies allowlist />
        <GuardOverview />
      </>
    ),
    actions: { primary: { label: 'Add policy' } },
  }),
]

export const POLICIES: PanelType = {
  id: 'policies',
  label: 'Policies',
  variants: [...ALLOWLIST_VARIANTS, ...SPENDING_LIMIT_VARIANTS, ...PROPOSER_VARIANTS, ...ACCOUNT_VARIANTS],
}
