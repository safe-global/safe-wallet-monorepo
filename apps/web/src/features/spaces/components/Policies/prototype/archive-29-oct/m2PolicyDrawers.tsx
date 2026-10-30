import { useState, type ReactElement, type ReactNode } from 'react'
import { Ban, Check, ChevronDown, ChevronRight, Copy, Settings, X, type LucideIcon } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerList,
  DrawerSection,
  DrawerTitle,
} from '@/components/common/Drawer'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card } from '@safe-global/views/components/ui/card'
import { PolicyDrawerActions } from '../../components/PolicyDrawerActions'
import { ProposerStatus } from '../../ProposerDrawer'
import { ProposerVariantContent } from '../../ProposerDrawer/variants'
import { toPolicyStatus } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/utils'
import type { ProposerVariantContentProps } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/variants/types'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import { CopyTransactionLink } from '../../SpendingLimitDrawer/components/CopyTransactionLink'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  connectHelper,
  PENDING_OUTCOME_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/messages'
import { PAYMENTS_LIMIT } from '../m2AccountPanel'
import { M2Alert } from '../m2Alert'
import { BlockedSpendingLimitDrawer, type ProtectionLink } from './m2BlockedSpendingLimitDrawer'
import { CopyPolicyDialog } from './m2CopyPolicyDialog'
import { PanelAccount, PanelNavButtons, PolicyIconTile, type PanelNav } from './m2PanelParts'
import {
  getStatusDetail,
  POLICY_ROW_LABELS,
  POLICY_TYPES,
  RowStatusChip,
  TOM_ADDRESS,
  type PanelOperation,
  type PanelViewer,
  type Person,
  type PolicyRow,
  type RowStatus,
} from './m2OverviewPage'
import {
  getAccountKey,
  getAllowlistSettings,
  PAYMENTS,
  SafeAddress,
  SIGNING_TIME_LEFT,
  WaitingForSigners,
  type M2Account,
  AccountProtectionIcon,
} from '../m2Prototype'
import { ACCOUNT_SETTING_GROUPS, getAccountTokens, type Baseline } from './m2SetupFlow'
import TokenIcon from '@/components/common/TokenIcon'

const NADIA_ADDRESS = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'

/** M1's PolicyDrawerHeader markup; its chip only knows M1's statuses, so this one also shows "Change pending". */
const M2DrawerHeader = ({
  row,
  status,
  nav,
  onOpenProtection,
}: {
  row: PolicyRow
  status: RowStatus | null
  nav?: PanelNav
  /** Set when the account's protection checks this policy: the icon gets its badge. */
  onOpenProtection?: () => void
}): ReactElement => (
  <DrawerHeader>
    <PolicyIconTile Icon={POLICY_TYPES[row.type].Icon} onOpenProtection={onOpenProtection} />
    <div className="flex min-w-0 flex-col items-start gap-1">
      <DrawerTitle size="lg">{POLICY_ROW_LABELS[row.type]}</DrawerTitle>
      {status && <RowStatusChip status={status} />}
    </div>
    {nav && (
      <div className="ml-auto">
        <PanelNavButtons nav={nav} />
      </div>
    )}
  </DrawerHeader>
)

/** M1's ProposerDrawer, rebuilt from its parts so its header can take the protection badge and the arrows. */
const M2ProposerDrawer = ({
  open,
  onClose,
  nav,
  onOpenProtection,
  row,
  actionLabel,
  actionVariant,
  onAction,
  ...content
}: ProposerVariantContentProps & {
  open: boolean
  onClose: () => void
  nav?: PanelNav
  /** Set when the account's protection checks what the proposer drafts. */
  onOpenProtection?: () => void
  row: PolicyRow
  actionLabel: string
  actionVariant?: 'default' | 'secondary'
  onAction: () => void
}): ReactElement => (
  <Drawer open={open} onClose={onClose} ariaLabel="Proposer role">
    <M2DrawerHeader row={row} status={toPolicyStatus(content.status)} nav={nav} onOpenProtection={onOpenProtection} />
    <DrawerBody>
      <div className="flex flex-col gap-6">
        <PanelAccount account={row.account} />
        <ProposerVariantContent {...content} />
      </div>
    </DrawerBody>
    <PolicyDrawerActions actionLabel={actionLabel} onClick={onAction} variant={actionVariant} />
  </Drawer>
)

const PROTECTION_TITLE = 'Policy enforcement'

/** A policy row inside a panel: icon, name, summary, an optional tag, and a chevron when it opens that policy. */
const PolicyListItem = ({
  row,
  tag,
  onSelect,
}: {
  row: PolicyRow
  tag?: ReactNode
  onSelect?: (row: PolicyRow) => void
}): ReactElement => {
  const { Icon } = POLICY_TYPES[row.type]

  return (
    <button
      type="button"
      onClick={onSelect ? () => onSelect(row) : undefined}
      className="flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-secondary-hover"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small-medium">{POLICY_ROW_LABELS[row.type]}</Typography>
        <Typography variant="paragraph-small" color="muted" className="truncate">
          {row.summary}
        </Typography>
      </div>
      {tag}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

/** The account's spending limits and proposers, each with whether the protection checks it. */
const PermissionsSection = ({
  permissions,
  onSelect,
}: {
  permissions: PolicyRow[]
  onSelect?: (row: PolicyRow) => void
}): ReactElement => (
  <DrawerSection title="Applied to">
    {permissions.length === 0 ? (
      <Typography variant="paragraph-small" color="muted">
        No spending limits or proposers yet. Any you add will be enforced too.
      </Typography>
    ) : (
      <Card variant="muted" size="none" radius="lg" data-m2-new="New · Covered permissions">
        <div className="flex flex-col divide-y divide-border">
          {permissions.map((row) => (
            <PolicyListItem
              key={row.id}
              row={row}
              onSelect={onSelect}
              tag={
                <Badge variant="subtle" shape="tag">
                  Enforced
                </Badge>
              }
            />
          ))}
        </div>
      </Card>
    )}
  </DrawerSection>
)

/** The policies the protection checks every transaction against: the allowlist today, more kinds later. */
const EnforcedPoliciesSection = ({
  policies,
  onSelect,
}: {
  policies: PolicyRow[]
  onSelect?: (row: PolicyRow) => void
}): ReactElement => (
  <DrawerSection title="Policies it checks">
    <Card variant="muted" size="none" radius="lg" data-m2-new="New · Policies the protection checks">
      <div className="flex flex-col divide-y divide-border">
        {policies.map((row) => (
          <PolicyListItem key={row.id} row={row} onSelect={onSelect} tag={<RowStatusChip status={row.status} />} />
        ))}
      </div>
    </Card>
  </DrawerSection>
)

/** A grey summary row that opens to its details underneath; the chevron points right when closed, down when open. */
const ExpandableCard = ({
  summary,
  detailsLabel,
  markNew,
  children,
}: {
  summary: ReactNode
  /** Names the details for screen readers, e.g. "recipient details". */
  detailsLabel: string
  markNew: string
  children: ReactNode
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const Chevron = isOpen ? ChevronDown : ChevronRight

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} data-m2-new={markNew}>
      <Card variant="muted" size="none" radius="lg">
        <CollapsibleTrigger
          aria-label={`${isOpen ? 'Hide' : 'Show'} ${detailsLabel}`}
          className="group/expandable flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {summary}
          <Chevron
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/expandable:text-foreground"
            aria-hidden
          />
        </CollapsibleTrigger>
      </Card>

      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const PREVIEW_RECIPIENTS = 3

/** M1's change badge (AllowanceRow): fixed width, centred. */
const RemovedBadge = (): ReactElement => (
  <Badge variant={CHANGE_BADGE.removed.variant} className="w-20 shrink-0 justify-center">
    {CHANGE_BADGE.removed.label}
  </Badge>
)

/** Expanded: one card per recipient, as SpendingLimits lists spenders. */
const RecipientList = ({
  recipients,
  isRemoved = false,
}: {
  recipients: Person[]
  isRemoved?: boolean
}): ReactElement => {
  const count = recipients.length

  return (
    <DrawerSection title="Who can receive funds">
      <ExpandableCard
        detailsLabel="recipient details"
        markNew="New · Recipient list"
        summary={
          <>
            <span className="flex shrink-0 -space-x-2">
              {recipients.slice(0, PREVIEW_RECIPIENTS).map(({ address }) => (
                <span key={address} className="rounded-full ring-2 ring-muted">
                  <Identicon address={address} size={24} />
                </span>
              ))}
            </span>
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
              {count} {count === 1 ? 'recipient' : 'recipients'}
            </Typography>
            {isRemoved && <RemovedBadge />}
          </>
        }
      >
        {/* 4px apart, so the expanded cards read as one group under their summary. */}
        <div className="flex flex-col gap-1">
          {recipients.map(({ name, address }) => (
            <Card key={address} variant="muted" size="none" radius="lg">
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <SafeAddress name={name} address={address} />
                </div>
                {isRemoved && (
                  <>
                    <RemovedBadge />
                    {/* The summary row's chevron width, so every Removed badge lines up in one column. */}
                    <span className="size-4 shrink-0" aria-hidden />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ExpandableCard>
    </DrawerSection>
  )
}

const TokenList = ({
  tokens,
  isRemoved = false,
}: {
  tokens: ReturnType<typeof getAccountTokens>
  isRemoved?: boolean
}): ReactElement => {
  const count = tokens.length

  return (
    <DrawerSection title="Which tokens can be sent">
      <ExpandableCard
        detailsLabel="token details"
        markNew="New · Token list"
        summary={
          <>
            <span className="flex shrink-0 -space-x-2">
              {tokens.slice(0, PREVIEW_RECIPIENTS).map(({ symbol, logoUri }) => (
                <span key={symbol} className="rounded-full ring-2 ring-muted">
                  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
                </span>
              ))}
            </span>
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
              {count} {count === 1 ? 'token' : 'tokens'}
            </Typography>
            {isRemoved && <RemovedBadge />}
          </>
        }
      >
        <div className="flex flex-col gap-1">
          {tokens.map(({ symbol, name, logoUri }) => (
            <Card key={symbol} variant="muted" size="none" radius="lg">
              <div className="flex items-center gap-3 p-3">
                <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Typography variant="paragraph-small-medium">{symbol}</Typography>
                  <Typography variant="paragraph-small" color="muted" className="truncate">
                    {name}
                  </Typography>
                </div>
                {isRemoved && (
                  <>
                    <RemovedBadge />
                    <span className="size-4 shrink-0" aria-hidden />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ExpandableCard>
    </DrawerSection>
  )
}

/** What became of a queued transaction that left the queue (M1's PendingTxOutcome). */
export type PanelOutcome = 'executed' | 'failed' | 'replaced' | 'deleted'

/** A side panel state picked from the prototype bar. Without one, the panel follows the prototype's own state. */
export type AllowlistPanelScenario = { viewer: PanelViewer; operation?: PanelOperation; outcome?: PanelOutcome }

// M1's SpendingLimitDrawer copy (SpendingLimitDrawer/messages.ts), worded for the allowlist.
const PENDING_TITLE: Record<PanelOperation, string> = {
  create: 'Policy enforcement isn’t active until the transaction is executed.',
  update: 'The current policies still apply until the change is executed.',
  remove: 'Policy enforcement stays active until the removal is executed.',
}

const OPERATION_TAIL: Record<PanelOperation, string> = {
  create: 'to activate',
  update: 'to apply the change',
  remove: 'to remove it',
}

const DELAY_MS = 24 * 60 * 60 * 1000

/** "Oct 22, 2026 · 14:30 UTC", the date format the side panels already use. */
const formatUtc = (date: Date): string =>
  `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })} UTC`

// Every change to the allowlist waits out the 24‑hour delay after execution; the prototype counts it from now.
const EXECUTED_LINE: Record<PanelOperation, (at: string) => string> = {
  create: (at) => `Policy enforcement becomes active after the 24‑hour delay, on ${at}.`,
  update: (at) => `The new policies apply after the 24‑hour wait, on ${at}.`,
  remove: (at) => `Policy enforcement is removed after the 24‑hour delay, on ${at}.`,
}

const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit its policy enforcement.'

type PanelState =
  | { kind: 'live'; action: 'manage' | 'connect' | 'not-signer' }
  | { kind: 'change-pending' }
  | { kind: 'activating' }
  | {
      kind: 'pending'
      operation: PanelOperation
      action: 'review' | 'execute' | 'connect' | 'copy-link'
      line2?: string
      helper?: string
      signed: number
      required: number
    }
  | { kind: 'closed'; operation: PanelOperation; outcome: PanelOutcome }

/** M1's resolveSpendingLimitDrawerState, step for step: the row's status, then the viewer, decides what the panel shows. */
const resolvePanelState = (
  row: PolicyRow,
  { viewer, operation = 'create', outcome }: AllowlistPanelScenario,
): PanelState => {
  if (row.status === 'failed') {
    return { kind: 'closed', operation, outcome: outcome && isFailure(outcome) ? outcome : 'failed' }
  }
  if (row.status === 'change-pending') return { kind: 'change-pending' }
  if (row.status === 'activating') return { kind: 'activating' }

  if (row.status === 'pending') {
    if (outcome) return { kind: 'closed', operation, outcome }

    const { signed, required } = row.signatures ?? { signed: 0, required: row.account.threshold }
    const base = { kind: 'pending', operation, signed, required } as const

    if (viewer === 'disconnected') {
      return { ...base, action: 'connect', line2: CONNECT_TO_SIGN_LINE, helper: connectHelper(row.account.name) }
    }
    // Anyone can execute a fully signed Safe transaction, so this outranks the signer checks below.
    if (signed >= required)
      return { ...base, action: 'execute', line2: `Execute the transaction ${OPERATION_TAIL[operation]}.` }
    if (viewer === 'non-signer') return { ...base, action: 'copy-link' }
    if (viewer === 'signer-signed') {
      const missing = required - signed
      return {
        ...base,
        action: 'copy-link',
        line2: `You've signed. Waiting for ${missing} more signature${missing === 1 ? '' : 's'}.`,
      }
    }
    // Signatures are still missing, the viewer's among them: the transaction can't be executed yet, only reviewed and signed.
    return { ...base, action: 'review', line2: `Sign and execute the transaction ${OPERATION_TAIL[operation]}.` }
  }

  if (viewer === 'disconnected') return { kind: 'live', action: 'connect' }
  return { kind: 'live', action: viewer === 'non-signer' ? 'not-signer' : 'manage' }
}

/** A transaction that failed, was replaced or was deleted can never be executed: each reads as a failure, in red. */
function isFailure(outcome: PanelOutcome): boolean {
  return outcome !== 'executed'
}

/** An executed transaction is still in its delay, so the header's chip reads Pending. */
const getPanelStatus = (row: PolicyRow, state: PanelState): RowStatus | null => {
  if (state.kind !== 'closed') return row.status
  if (state.outcome === 'executed') return 'activating'
  return isFailure(state.outcome) ? 'failed' : null
}

/** SpendingLimitDrawer's top of body: the pending or closed banner and the signatures, or the change waiting out its delay. */
const StatusSection = ({ row, state }: { row: PolicyRow; state: PanelState }): ReactElement | null => {
  switch (state.kind) {
    case 'pending':
      return (
        <div className="flex flex-col gap-6">
          <M2Alert
            tone="warning"
            title={
              row.singlePolicy && state.operation === 'create'
                ? 'This allowlist isn’t active until the transaction is executed.'
                : PENDING_TITLE[state.operation]
            }
            description={state.line2}
          />
          {/* M1's PendingSignatures layout, with the tooltip address in place of its copy icon. */}
          <DrawerSection title="Pending signatures" rightNode={`${state.signed} of ${state.required} signatures`}>
            <DrawerList
              items={[
                { label: 'Time to sign', content: SIGNING_TIME_LEFT },
                {
                  label: 'Safe account',
                  content: <SafeAddress name={row.account.name} address={row.account.address} />,
                },
                {
                  label: 'Waiting for',
                  content: (
                    <WaitingForSigners signed={state.signed} required={state.required} owners={row.account.owners} />
                  ),
                },
              ]}
            />
          </DrawerSection>
        </div>
      )

    case 'closed':
      if (isFailure(state.outcome)) {
        return (
          <M2Alert
            tone="error"
            title={PENDING_OUTCOME_TITLE[state.outcome]}
            description="Close this panel to see the current policies."
          />
        )
      }

      return (
        <M2Alert
          tone="warning"
          title={PENDING_OUTCOME_TITLE[state.outcome]}
          description={
            state.outcome === 'executed'
              ? EXECUTED_LINE[state.operation](formatUtc(new Date(Date.now() + DELAY_MS)))
              : 'Close this panel to see the current policies.'
          }
        />
      )

    // Executed, waiting out the guard's 24‑hour delay.
    case 'activating':
      return (
        <M2Alert
          tone="warning"
          title="Change pending"
          description={
            <>
              <div>Until then, transactions aren&apos;t checked against it.</div>
              <div>{getStatusDetail(row)}</div>
            </>
          }
        />
      )

    case 'change-pending':
      return (
        <M2Alert
          tone="warning"
          title="Change pending"
          description={
            <>
              <div>Any signer can cancel it before then.</div>
              <div>{getStatusDetail(row)}</div>
            </>
          }
        />
      )

    case 'live':
      return null
  }
}

type M2DrawerHandlers = {
  onEdit?: () => void
  /** Live protection only: set up the same protection on other Safe accounts. */
  onCopy?: () => void
  onConfirm?: () => void
  onExecute?: () => void
  onCancelChange?: () => void
}

/** A stand-in for the queued transaction's link, which M1's CopyTransactionLink copies. */
const getTransactionLink = ({ account }: PolicyRow): string =>
  `https://app.safe.global/transactions/tx?safe=${account.chainId}:${account.address}&id=multisig_${account.address}_0x7d1f`

/** SpendingLimitActions per state: Review transaction (to sign, or to execute once fully signed), or the link. */
const M2DrawerActions = ({
  row,
  state,
  onEdit,
  onCopy,
  onConfirm,
  onExecute,
  onCancelChange,
}: M2DrawerHandlers & { row: PolicyRow; state: PanelState }): ReactElement | null => {
  switch (state.kind) {
    case 'live':
      if (state.action === 'connect') {
        return <PolicyDrawerActions actionLabel="Connect wallet" onClick={() => {}} hint={ACTIVE_CONNECT_HELPER} />
      }
      if (state.action === 'not-signer')
        return <PolicyDrawerActions actionLabel="Edit" hint={NOT_A_SIGNER_HELPER} disabled />

      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="secondary" className="w-full" onClick={onCopy}>
              <Copy data-icon="inline-start" />
              Copy to other Safe accounts
            </Button>
            <Button variant="ghost-muted" className="w-full">
              Remove
            </Button>
          </div>
        </DrawerFooter>
      )

    case 'pending':
      switch (state.action) {
        case 'connect':
          return <PolicyDrawerActions actionLabel="Connect wallet" onClick={() => {}} hint={state.helper} />
        // Fully signed: M1's "Review transaction", which leads to the execute step.
        case 'execute':
          return <PolicyDrawerActions actionLabel="Review transaction" onClick={onExecute} />
        case 'copy-link':
          return <CopyTransactionLink transactionLink={getTransactionLink(row)} />
        case 'review':
          return <PolicyDrawerActions actionLabel="Review transaction" onClick={onConfirm} />
      }
      return null

    case 'change-pending':
      return <PolicyDrawerActions actionLabel="Cancel change" variant="secondary" onClick={onCancelChange} />

    case 'activating':
    case 'closed':
      return null
  }
}

/** The allowlist in M1's drawer: header with status, the pending state, the recipients, then the overview. */
const AllowlistDrawer = ({
  open,
  row,
  viewerHasSigned,
  scenario,
  excludedTokens,
  protectedAccountKeys,
  onOpenProtection,
  justActivated = false,
  onClose,
  nav,
  ...handlers
}: M2DrawerHandlers & {
  open: boolean
  nav?: PanelNav
  row: PolicyRow
  viewerHasSigned: boolean
  scenario?: AllowlistPanelScenario
  /** Symbols of the account's tokens the allowlist leaves out. */
  excludedTokens: string[]
  protectedAccountKeys: string[]
  /** The account's protection overview, which the allowlist is one policy of. */
  onOpenProtection?: (account: M2Account) => void
  /** The first execution just finished: confirm it once at the top of the panel. */
  justActivated?: boolean
  onClose: () => void
}): ReactElement => {
  const [isCopyOpen, setIsCopyOpen] = useState(false)
  // A signer already in the transaction's signatures has signed, whichever state was picked.
  const picked: AllowlistPanelScenario = scenario ?? { viewer: row.viewer ?? 'signer-signed' }
  const state = resolvePanelState(
    row,
    picked.viewer === 'signer' && viewerHasSigned ? { ...picked, viewer: 'signer-signed' } : picked,
  )
  const isRemoved = (state.kind === 'pending' || state.kind === 'closed') && state.operation === 'remove'
  const tokens = getAccountTokens(row.account).filter(({ symbol }) => !excludedTokens.includes(symbol))
  const recipientCount = `${row.people.length} ${row.people.length === 1 ? 'recipient' : 'recipients'}`
  const ruleSummary = `${recipientCount} · ${tokens.length} ${tokens.length === 1 ? 'token' : 'tokens'}`

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={POLICY_ROW_LABELS[row.type]}>
      <M2DrawerHeader
        row={row}
        status={getPanelStatus(row, state)}
        nav={nav}
        onOpenProtection={onOpenProtection ? () => onOpenProtection(row.account) : undefined}
      />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          <PanelAccount account={row.account} />
          {justActivated && state.kind === 'live' && (
            <M2Alert
              tone="success"
              title="Policies are now enforced"
              description={`${row.account.name} can only send the allowed tokens to the ${recipientCount}. Any change waits 24 hours.`}
            />
          )}
          <StatusSection row={row} state={state} />
          <RecipientList recipients={row.people} isRemoved={isRemoved} />
          <TokenList tokens={tokens} isRemoved={isRemoved} />
        </div>
      </DrawerBody>

      <M2DrawerActions row={row} state={state} {...handlers} onCopy={() => setIsCopyOpen(true)} />

      <CopyPolicyDialog
        open={isCopyOpen}
        onOpenChange={setIsCopyOpen}
        source={row.account}
        protectedAccountKeys={protectedAccountKeys}
        templateSummary={ruleSummary}
      />
    </Drawer>
  )
}

export type PolicyDrawerProps = M2DrawerHandlers & {
  open: boolean
  row?: PolicyRow
  /** The prototype's viewer has already signed this row's pending setup. */
  viewerHasSigned?: boolean
  /** Allowlist only: a state picked from the prototype bar. */
  scenario?: AllowlistPanelScenario
  /** Payments' spending limit only: tokens its setup's allowlist blocks; other rows carry their own. */
  spendingLimitBlockedTokens?: string[]
  /** Allowlist on Payments only: the tokens unchecked in its setup. Other accounts use their own settings. */
  paymentsExcludedTokens?: string[]
  /** The setup allowlist's first execution just finished. */
  justActivated?: boolean
  /** Every row on the table: the protection panel lists its account's permissions, a permission finds its protection. */
  allRows?: PolicyRow[]
  /** Accounts with protection (getAccountKey), which Copy can't set up again. */
  protectedAccountKeys?: string[]
  /** Opens another row's panel, e.g. a permission from the protection panel. */
  onSelectPolicy?: (row: PolicyRow) => void
  /** A blocked spending limit's "See policy here": opens the allowlist on that account. */
  onOpenAllowlist?: (account: M2Account) => void
  /** The account's protection overview: from a spending limit's protection section or the allowlist's link. */
  onOpenProtection?: (account: M2Account) => void
  /** Account settings only: what its enforcement setup blocked. */
  accountSettingsRules?: ProtectionRules
  onClose: () => void
  nav?: PanelNav
}

/** The drawer for one policy row: M1's own drawers for M1's types, the M2 drawer for the rest. */
export const PolicyDrawer = ({
  open,
  row,
  viewerHasSigned = false,
  scenario,
  spendingLimitBlockedTokens = [],
  paymentsExcludedTokens = [],
  justActivated = false,
  protectedAccountKeys = [],
  onOpenAllowlist,
  onOpenProtection,
  accountSettingsRules = DEFAULT_PROTECTION_RULES,
  onClose,
  nav,
  ...handlers
}: PolicyDrawerProps): ReactElement | null => {
  if (!row) return null

  const isPayments = getAccountKey(row.account) === getAccountKey(PAYMENTS)
  const excludedTokens = isPayments ? paymentsExcludedTokens : getAllowlistSettings(row.account).excludedTokens

  switch (row.type) {
    // The row's status picks the panel, so the panel's chip always matches the table's.
    case 'spending-limit': {
      const limit = row.spendingLimit ?? PAYMENTS_LIMIT
      const protection: ProtectionLink | undefined = row.coverage && {
        onOpenProtection: onOpenProtection ? () => onOpenProtection(row.account) : undefined,
      }

      if (row.status === 'blocked') {
        return (
          <BlockedSpendingLimitDrawer
            variant="blocked"
            open={open}
            onClose={onClose}
            nav={nav}
            limit={limit}
            protection={protection}
            blockedTokens={row.blockedTokens ?? spendingLimitBlockedTokens}
            onEdit={handlers.onEdit}
            onOpenAllowlist={onOpenAllowlist ? () => onOpenAllowlist(row.account) : undefined}
          />
        )
      }
      if (row.locked)
        return (
          <BlockedSpendingLimitDrawer
            variant="locked"
            open={open}
            onClose={onClose}
            nav={nav}
            limit={limit}
            protection={protection}
          />
        )
      // Without protection too, so every spending limit panel has the arrows and the account at the top.
      return (
        <BlockedSpendingLimitDrawer
          variant="covered"
          open={open}
          onClose={onClose}
          nav={nav}
          limit={limit}
          protection={protection}
          onEdit={handlers.onEdit}
        />
      )
    }

    case 'account-settings':
      return (
        <AccountSettingsDrawer
          open={open}
          onClose={onClose}
          nav={nav}
          row={row}
          rules={accountSettingsRules}
          onOpenProtection={onOpenProtection ? () => onOpenProtection(row.account) : undefined}
          onEdit={handlers.onEdit}
        />
      )

    case 'proposer':
      return (
        <M2ProposerDrawer
          open={open}
          onClose={onClose}
          nav={nav}
          onOpenProtection={
            row.coverage === 'follows' && onOpenProtection ? () => onOpenProtection(row.account) : undefined
          }
          row={row}
          status={ProposerStatus.ACTIVE}
          overview={{
            proposer: { address: TOM_ADDRESS, name: 'Tom Reyes' },
            appliesTo: { address: row.account.address, name: row.account.name },
            initiatedBy: { address: NADIA_ADDRESS, name: 'Nadia Kaur' },
            chainId: row.account.chainId,
            lastUpdated: 'Jul 21, 2026 · 10:04 UTC',
            enforcedBy: 'Safe module',
          }}
          actionLabel="Remove proposer"
          actionVariant="secondary"
          onAction={() => {}}
        />
      )

    default:
      return (
        <AllowlistDrawer
          open={open}
          row={row}
          viewerHasSigned={viewerHasSigned}
          scenario={scenario}
          excludedTokens={excludedTokens}
          protectedAccountKeys={protectedAccountKeys}
          onOpenProtection={onOpenProtection}
          justActivated={justActivated}
          onClose={onClose}
          nav={nav}
          {...handlers}
        />
      )
  }
}

export type ProtectionDrawerProps = {
  open: boolean
  account?: M2Account
  /** Every row on the table; the panel picks its account's. */
  allRows: PolicyRow[]
  onSelectPolicy?: (row: PolicyRow) => void
  onClose: () => void
  /** Two levels: the allowlist is one of the policies under the protection, in a single list. */
  levels?: boolean
  nav?: PanelNav
  /** The protection's own rules, set in its setup and changed with Edit. */
  rules?: ProtectionRules
  /** The viewer is among the signatures on the protection's pending transaction. */
  viewerHasSigned?: boolean
  /** Edited and executed: the change waits out its 24 hours. */
  changePending?: boolean
  onConfirm?: () => void
  onExecute?: () => void
  onCancelChange?: () => void
  onEditProtection?: () => void
  /** Not enforced: starts the Enforce policies flow for this account. */
  onEnforce?: () => void
}

/** What the protection itself decides: what happens to anything no policy covers, and which account changes it lets through. */
export type ProtectionRules = { baseline: Baseline; blockedSettings: string[] }

export const DEFAULT_PROTECTION_RULES: ProtectionRules = { baseline: 'block-all', blockedSettings: [] }

type Verdict = 'allowed' | 'blocked' | 'partly'

const VERDICTS: Record<Verdict, ReactElement> = {
  allowed: (
    <Badge variant="success" size="status" shape="status">
      <Check aria-hidden />
      Allowed
    </Badge>
  ),
  blocked: (
    <Badge variant="destructive" size="status" shape="status">
      <X aria-hidden />
      Blocked
    </Badge>
  ),
  partly: (
    <Badge variant="warning" size="status" shape="status">
      Partly blocked
    </Badge>
  ),
}

const getSettingsVerdict = (groupTitles: string[], blockedSettings: string[]): Verdict => {
  const ids = ACCOUNT_SETTING_GROUPS.filter(({ title }) => groupTitles.includes(title)).flatMap(({ settings }) =>
    settings.map(({ id }) => id),
  )
  const blocked = ids.filter((id) => blockedSettings.includes(id)).length
  return blocked === 0 ? 'allowed' : blocked === ids.length ? 'blocked' : 'partly'
}

/** A policy row's verdict: a live policy is allowed, a blocked one says so, anything in between keeps its status. */
const getPolicyVerdict = (row: PolicyRow): ReactElement =>
  row.status === 'active' || row.status === 'change-pending' ? (
    VERDICTS.allowed
  ) : row.status === 'blocked' ? (
    VERDICTS.blocked
  ) : (
    <RowStatusChip status={row.status} />
  )

/** Laid out like PolicyListItem, with a blank where its chevron goes, so the badges line up. */
const VerdictRow = ({
  Icon,
  title,
  description,
  verdict,
  onClick,
}: {
  Icon: LucideIcon
  title: string
  description: string
  verdict: ReactNode
  onClick?: () => void
}): ReactElement => {
  const content = (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <span className="flex min-w-0 flex-1 flex-col">
        <Typography variant="paragraph-small-medium">{title}</Typography>
        <Typography variant="paragraph-small" color="muted">
          {description}
        </Typography>
      </span>
      {verdict}
      {onClick ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
    </>
  )

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-secondary-hover"
    >
      {content}
    </button>
  ) : (
    <div className="flex items-center gap-3 p-3">{content}</div>
  )
}

/** Account settings, created with enforcement: every account change, one by one, with whether it's allowed. */
const AccountSettingsDrawer = ({
  open,
  onClose,
  nav,
  row,
  rules,
  onOpenProtection,
  onEdit,
}: {
  open: boolean
  onClose: () => void
  nav?: PanelNav
  row: PolicyRow
  rules: ProtectionRules
  onOpenProtection?: () => void
  onEdit?: () => void
}): ReactElement => (
  <Drawer open={open} onClose={onClose} ariaLabel={POLICY_ROW_LABELS[row.type]}>
    <M2DrawerHeader row={row} status={row.status} nav={nav} onOpenProtection={onOpenProtection} />

    <DrawerBody>
      <div className="flex flex-col gap-6" data-m2-new="New · Account settings panel">
        <PanelAccount account={row.account} />
        <Typography variant="paragraph-small" color="muted">
          What can change on {row.account.name} itself. Anything blocked here can’t happen, even with every signature.
          Any change to these settings waits 24 hours.
        </Typography>
        {ACCOUNT_SETTING_GROUPS.map(({ title, settings }) => (
          <DrawerSection key={title} title={title}>
            <Card variant="muted" size="none" radius="lg">
              <div className="flex flex-col divide-y divide-border">
                {settings.map(({ id, title: settingTitle, description }) => (
                  <div key={id} className="flex items-center gap-3 p-3">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <Typography variant="paragraph-small-medium">{settingTitle}</Typography>
                      <Typography variant="paragraph-small" color="muted">
                        {description}
                      </Typography>
                    </span>
                    {VERDICTS[rules.blockedSettings.includes(id) ? 'blocked' : 'allowed']}
                  </div>
                ))}
              </div>
            </Card>
          </DrawerSection>
        ))}
      </div>
    </DrawerBody>

    {onEdit && (
      <DrawerFooter>
        <Button className="w-full" onClick={onEdit}>
          Edit account settings
        </Button>
      </DrawerFooter>
    )}
  </Drawer>
)

/** Everything enforcement lets through, policy by policy, then the one thing it blocks: every other action. */
const EnforcedListSection = ({
  rules,
  policies,
  accountSettings,
  onSelect,
  isPending = false,
}: {
  rules: ProtectionRules
  policies: PolicyRow[]
  /** Both account rows open the account settings policy. */
  accountSettings?: PolicyRow
  onSelect?: (row: PolicyRow) => void
  /** Enforcement isn't executed yet: what it sets up, and what it blocks, are pending too. */
  isPending?: boolean
}): ReactElement => {
  const openSettings = accountSettings && onSelect ? () => onSelect(accountSettings) : undefined
  const pendingChip = <RowStatusChip status="pending" />
  // Set up with enforcement first (the allowlist), then the policies that work on their own.
  const ordered = [...policies].sort((a, b) => Number(b.type === 'allowlist') - Number(a.type === 'allowlist'))

  return (
    <DrawerSection title="Policies">
      <Card variant="muted" size="none" radius="lg" data-m2-new="New · Enforced policies list">
        <div className="flex flex-col divide-y divide-border">
          <VerdictRow
            Icon={Settings}
            title="Account changes"
            description="Signers, threshold, advanced"
            verdict={
              isPending ? pendingChip : VERDICTS[getSettingsVerdict(['Signers', 'Advanced'], rules.blockedSettings)]
            }
            onClick={openSettings}
          />
          <VerdictRow
            Icon={Settings}
            title="Policy changes"
            description="Creating and changing policies"
            verdict={isPending ? pendingChip : VERDICTS[getSettingsVerdict(['Policies'], rules.blockedSettings)]}
            onClick={openSettings}
          />
          {ordered.map((row) => (
            <PolicyListItem key={row.id} row={row} onSelect={onSelect} tag={getPolicyVerdict(row)} />
          ))}
          <VerdictRow
            Icon={Ban}
            title="Every other action"
            description="Anything no policy allows"
            verdict={isPending ? pendingChip : VERDICTS.blocked}
          />
        </div>
      </Card>
    </DrawerSection>
  )
}

/**
 * The account's protection, opened from "Protected" on its row or a policy's "Protection applied" tag: what it does,
 * the policies it checks, and the spending limits and proposers it applies to. The policies keep their own panels.
 */
export const ProtectionDrawer = ({
  open,
  account,
  allRows,
  onSelectPolicy,
  onClose,
  levels = false,
  nav,
  rules = DEFAULT_PROTECTION_RULES,
  viewerHasSigned = false,
  changePending = false,
  onConfirm,
  onExecute,
  onCancelChange,
  onEditProtection,
  onEnforce,
}: ProtectionDrawerProps): ReactElement | null => {
  if (!account) return null

  const rows = allRows.filter((row) => getAccountKey(row.account) === getAccountKey(account))
  const enforced = rows.filter(({ type }) => type === 'allowlist')
  const appliedTo = rows.filter(({ type }) => type !== 'allowlist')
  const isActive = enforced.some(({ status }) => status === 'active' || status === 'change-pending')
  // The transaction that turned the protection on: its signatures and Confirm or Execute show here until it applies.
  const setup = enforced[0]
  const setupState =
    setup && resolvePanelState(setup, { viewer: setup.viewer ?? (viewerHasSigned ? 'signer-signed' : 'signer') })
  const isSettingUp = setupState !== undefined && setupState.kind !== 'live'
  // Never set up, or its setup failed: explain what that leaves open instead of rules.
  const isOff = !setup || setup.status === 'failed'

  if (isOff)
    return (
      <Drawer open={open} onClose={onClose} ariaLabel={PROTECTION_TITLE}>
        <DrawerHeader>
          <div className="flex size-10 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <AccountProtectionIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-1">
            <DrawerTitle size="lg">{PROTECTION_TITLE}</DrawerTitle>
            <RowStatusChip status="unenforced" />
          </div>
          {nav && (
            <div className="ml-auto">
              <PanelNavButtons nav={nav} />
            </div>
          )}
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col gap-6" data-m2-new="New · Policy enforcement off">
            <PanelAccount account={account} />
            <M2Alert
              tone="warning"
              title="Funds can be sent to any address"
              description={`Enforce your policies so ${account.name} can only do what they allow.`}
            />
          </div>
        </DrawerBody>

        {onEnforce && (
          <DrawerFooter>
            <Button className="w-full" onClick={onEnforce}>
              Set up policy enforcement
            </Button>
          </DrawerFooter>
        )}
      </Drawer>
    )

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={PROTECTION_TITLE}>
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-mint">
          <AccountProtectionIcon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <DrawerTitle size="lg">{PROTECTION_TITLE}</DrawerTitle>
          <Badge variant={isActive ? 'success' : 'subtle'} size="status" shape="status">
            {isActive ? 'Policies enforced' : 'Enforcement pending'}
          </Badge>
        </div>
        {nav && (
          <div className="ml-auto">
            <PanelNavButtons nav={nav} />
          </div>
        )}
      </DrawerHeader>

      <DrawerBody>
        <div className="flex flex-col gap-6" data-m2-new="New · Policy enforcement overview">
          <PanelAccount account={account} />
          {setup && setupState && isSettingUp && <StatusSection row={setup} state={setupState} />}
          {changePending && (
            <M2Alert
              tone="warning"
              title="Your change applies in 24 hours"
              description="The policies below apply then. Until that, the current ones stay and any signer can cancel."
            />
          )}
          {levels ? (
            <>
              <Typography variant="paragraph-small" color="muted">
                {isActive ? 'Anything' : 'Once it’s executed, anything'} your policies don’t allow on {account.name} is
                blocked, even with every signature. Any change waits 24 hours.
              </Typography>
              <EnforcedListSection
                rules={rules}
                policies={rows.filter(({ protectionOnly, type }) => !protectionOnly && type !== 'account-settings')}
                accountSettings={rows.find(({ type }) => type === 'account-settings')}
                onSelect={onSelectPolicy}
                isPending={!isActive}
              />
            </>
          ) : (
            <>
              <Typography variant="paragraph-small" color="muted">
                {isActive ? 'Every' : 'Once active, every'} transaction on {account.name} is checked against these
                policies right before it runs, after the signers approve it. Anything not allowed is blocked, and any
                change waits 24 hours.
              </Typography>
              <EnforcedPoliciesSection policies={enforced} onSelect={onSelectPolicy} />
              <PermissionsSection permissions={appliedTo} onSelect={onSelectPolicy} />
            </>
          )}
        </div>
      </DrawerBody>

      {setup && setupState && isSettingUp ? (
        <M2DrawerActions row={setup} state={setupState} onConfirm={onConfirm} onExecute={onExecute} />
      ) : changePending ? (
        <PolicyDrawerActions actionLabel="Cancel change" variant="secondary" onClick={onCancelChange} />
      ) : (
        onEditProtection && (
          <DrawerFooter>
            <Button className="w-full" onClick={onEditProtection} data-m2-new="New · Edit protection">
              Edit policy enforcement
            </Button>
          </DrawerFooter>
        )
      )}
    </Drawer>
  )
}
