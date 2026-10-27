import { useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Copy, ShieldCheck } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { Typography } from '@safe-global/views/components/ui/typography'
import ChainIndicator from '@/components/common/ChainIndicator'
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
import { Link } from '@safe-global/views/components/ui/link'
import { PolicyDrawerActions } from '../components/PolicyDrawerActions'
import { MOCK_VIEWERS } from '../mocks/policies'
import ProposerDrawer, { ProposerStatus } from '../ProposerDrawer'
import { SpendingLimitDrawer } from '../SpendingLimitDrawer'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import { CopyTransactionLink } from '../SpendingLimitDrawer/components/CopyTransactionLink'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  connectHelper,
  PENDING_OUTCOME_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/messages'
import { PAYMENTS_LIMIT } from './m2AccountPanel'
import { M2Alert } from './m2Alert'
import { BlockedSpendingLimitDrawer, type ProtectionLink } from './m2BlockedSpendingLimitDrawer'
import { CopyPolicyDialog } from './m2CopyPolicyDialog'
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
} from './m2Prototype'
import { getAccountTokens } from './m2SetupFlow'
import TokenIcon from '@/components/common/TokenIcon'

const NADIA_ADDRESS = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'

/** The setup's fake guard contract, as in m2SetupFlow's transaction. */
const GUARD_ADDRESS = '0x1a4f7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4c802'
const ENFORCED_BY = 'Safe protection contract'

/** M1's PolicyDrawerHeader markup; its chip only knows M1's statuses, so this one also shows "Change pending". */
const M2DrawerHeader = ({ row, status }: { row: PolicyRow; status: RowStatus | null }): ReactElement => {
  const { Icon } = POLICY_TYPES[row.type]

  return (
    <DrawerHeader>
      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <DrawerTitle size="lg">{POLICY_ROW_LABELS[row.type]}</DrawerTitle>
      <div className="ml-auto">{status && <RowStatusChip status={status} />}</div>
    </DrawerHeader>
  )
}

const PROTECTION_TITLE = 'Account protection'

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
        No spending limits or proposers yet. Any you add will follow the protection.
      </Typography>
    ) : (
      <Card variant="muted" size="none" radius="lg" data-m2-new="New · Covered permissions">
        <div className="flex flex-col divide-y divide-border">
          {permissions.map((row) => {
            const follows = row.coverage !== 'not-covered'

            return (
              <PolicyListItem
                key={row.id}
                row={row}
                onSelect={onSelect}
                tag={
                  <Badge variant={follows ? 'subtle' : 'warning'} shape="tag">
                    {follows ? 'Protection applied' : 'Protection not applied'}
                  </Badge>
                }
              />
            )
          })}
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

const EXPLORERS: Record<string, string> = {
  '1': 'https://etherscan.io/address/',
  '42161': 'https://arbiscan.io/address/',
  '8453': 'https://basescan.org/address/',
}

/** M1's PolicyOverview (SpendingLimitDrawer), with the prototype's address tooltip in place of M1's copy icon. */
const PolicyOverviewSection = ({
  account,
  lastUpdated,
}: {
  account: M2Account
  lastUpdated?: string
}): ReactElement => {
  const explorer = EXPLORERS[account.chainId]

  return (
    <div data-m2-new="M1 copy · Policy overview">
      <DrawerSection title="Details">
        <DrawerList
          items={[
            { label: 'Safe account', content: <SafeAddress name={account.name} address={account.address} /> },
            {
              label: 'Network',
              content: <ChainIndicator chainId={account.chainId} inline className="min-w-0! justify-end!" />,
            },
            ...(lastUpdated ? [{ label: 'Last updated', content: lastUpdated }] : []),
            {
              label: 'Enforced by',
              content: (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" />
                  {explorer ? (
                    <Link
                      href={`${explorer}${GUARD_ADDRESS}`}
                      variant="inherit"
                      className="underline"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {ENFORCED_BY}
                    </Link>
                  ) : (
                    <span>{ENFORCED_BY}</span>
                  )}
                </span>
              ),
            },
          ]}
        />
      </DrawerSection>
    </div>
  )
}

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
  create: 'Account protection isn’t active until the transaction is executed.',
  update: 'The current rules still apply until the change is executed.',
  remove: 'Account protection stays active until the removal is executed.',
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
  create: (at) => `Account protection becomes active after the 24‑hour delay, on ${at}.`,
  update: (at) => `The new rules apply after the 24‑hour delay, on ${at}.`,
  remove: (at) => `Account protection is removed after the 24‑hour delay, on ${at}.`,
}

const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit its protection.'

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
          <M2Alert tone="warning" title={PENDING_TITLE[state.operation]} description={state.line2} />
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
  ...handlers
}: M2DrawerHandlers & {
  open: boolean
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
      <M2DrawerHeader row={row} status={getPanelStatus(row, state)} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {justActivated && state.kind === 'live' && (
            <M2Alert
              tone="success"
              title="Account protection is now active"
              description={`${row.account.name} can only send the allowed tokens to the ${recipientCount}. Further changes will take 24 hours to apply.`}
            />
          )}
          <StatusSection row={row} state={state} />
          <RecipientList recipients={row.people} isRemoved={isRemoved} />
          <TokenList tokens={tokens} isRemoved={isRemoved} />
          {/* A policy like the others; what it means for the account sits in the protection overview. */}
          {onOpenProtection && (
            <button
              type="button"
              onClick={() => onOpenProtection(row.account)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-muted p-3 text-left transition-colors hover:bg-secondary-hover"
              data-m2-new="New · Part of account protection"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-mint">
                <ShieldCheck className="size-4" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <Typography variant="paragraph-small-medium">
                  Part of {row.account.name}’s account protection
                </Typography>
                <Typography variant="paragraph-small" color="muted">
                  See every policy it checks and the spending limits it applies to.
                </Typography>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          )}
          {/* Last in every state, as in SpendingLimitDrawer. */}
          <PolicyOverviewSection account={row.account} lastUpdated={row.lastUpdated} />
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
  onClose: () => void
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
  allRows = [],
  protectedAccountKeys = [],
  onOpenAllowlist,
  onOpenProtection,
  onClose,
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
        coverage: row.coverage,
        excludedTokens,
        onOpenProtection: onOpenProtection ? () => onOpenProtection(row.account) : undefined,
      }

      if (row.status === 'blocked') {
        return (
          <BlockedSpendingLimitDrawer
            variant="blocked"
            open={open}
            onClose={onClose}
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
            limit={limit}
            protection={protection}
          />
        )
      if (protection)
        return (
          <BlockedSpendingLimitDrawer
            variant="covered"
            open={open}
            onClose={onClose}
            limit={limit}
            protection={protection}
            onEdit={handlers.onEdit}
          />
        )

      return (
        <SpendingLimitDrawer
          open={open}
          onClose={onClose}
          policy={limit.policy}
          viewer={MOCK_VIEWERS.signer}
          safe={{ address: row.account.address, name: row.account.name }}
          overview={limit.overview}
          names={limit.names}
          onEdit={handlers.onEdit}
          onConnectWallet={() => {}}
        />
      )
    }

    case 'proposer':
      return (
        <ProposerDrawer
          open={open}
          onClose={onClose}
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
}: ProtectionDrawerProps): ReactElement | null => {
  if (!account) return null

  const rows = allRows.filter((row) => getAccountKey(row.account) === getAccountKey(account))
  const enforced = rows.filter(({ type }) => type === 'allowlist')
  const appliedTo = rows.filter(({ type }) => type !== 'allowlist')
  const isActive = enforced.some(({ status }) => status === 'active' || status === 'change-pending')
  const lastUpdated = enforced.find(({ lastUpdated }) => lastUpdated)?.lastUpdated

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={PROTECTION_TITLE}>
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-mint">
          <ShieldCheck className="size-4" />
        </div>
        <DrawerTitle size="lg">{PROTECTION_TITLE}</DrawerTitle>
        <div className="ml-auto">
          <Badge variant={isActive ? 'success' : 'subtle'} size="status" shape="status">
            {isActive ? 'Protected' : 'Not active yet'}
          </Badge>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex flex-col gap-6" data-m2-new="New · Account protection overview">
          <Typography variant="paragraph-small" color="muted">
            {isActive ? 'Every' : 'Once active, every'} transaction on {account.name} is checked against these policies
            right before it runs, after the signers approve it. Anything not allowed is blocked, and any change waits 24
            hours.
          </Typography>
          <EnforcedPoliciesSection policies={enforced} onSelect={onSelectPolicy} />
          <PermissionsSection permissions={appliedTo} onSelect={onSelectPolicy} />
          <PolicyOverviewSection account={account} lastUpdated={lastUpdated} />
        </div>
      </DrawerBody>
    </Drawer>
  )
}
