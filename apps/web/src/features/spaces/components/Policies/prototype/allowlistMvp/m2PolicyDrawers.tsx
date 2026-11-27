import { useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Loader2, ShieldCheck } from 'lucide-react'
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
import { PolicyDrawerActions } from '../../components/PolicyDrawerActions'
import { MOCK_VIEWERS } from '../../mocks/policies'
import ProposerDrawer, { ProposerStatus } from '../../ProposerDrawer'
import { SpendingLimitDrawer } from '../../SpendingLimitDrawer'
import { CHANGE_BADGE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/Summary/constants'
import { CopyTransactionLink } from '../../SpendingLimitDrawer/components/CopyTransactionLink'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  connectHelper,
  PENDING_OUTCOME_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/messages'
import { PAYMENTS_LIMIT } from './m2AccountPanel'
import { M2Alert } from './m2Alert'
import { BlockedSpendingLimitDrawer } from './m2BlockedSpendingLimitDrawer'
import {
  getAllowlistTag,
  getStatusDetail,
  POLICY_ROW_LABELS,
  StatusTagChip,
  POLICY_TYPES,
  RowStatusChip,
  TOM_ADDRESS,
  type PanelOperation,
  type PanelViewer,
  type Person,
  type PolicyRow,
  type RowStatus,
  type SpecChange,
  type SpecStage,
} from './m2OverviewPage'
import {
  getAccountKey,
  getAccountSpendingLimits,
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
const ENFORCED_BY = 'Safe policy contract'

/** M1's PolicyDrawerHeader markup; its chip only knows M1's statuses, so this one also shows "Change pending". */
const M2DrawerHeader = ({
  row,
  status,
  useTag = false,
}: {
  row: PolicyRow
  status: RowStatus | null
  /** Shows the table's spec 5.7 tag, so the panel and its row read the same. */
  useTag?: boolean
}): ReactElement => {
  const { Icon } = POLICY_TYPES[row.type]

  return (
    <DrawerHeader>
      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <DrawerTitle size="lg">{POLICY_ROW_LABELS[row.type]}</DrawerTitle>
      <div className="ml-auto">
        {useTag ? <StatusTagChip tag={getAllowlistTag(row)} /> : status && <RowStatusChip status={status} />}
      </div>
    </DrawerHeader>
  )
}

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
      <DrawerSection title="Policy overview">
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

/** Whether the account's spending limits follow the allowlist: the setup's "Apply the allowlist to existing policies" switch. */
const ExistingPoliciesSection = ({ count, isApplied }: { count: number; isApplied: boolean }): ReactElement => {
  const Icon = POLICY_TYPES['spending-limit'].Icon

  return (
    <DrawerSection title="Existing policies">
      <Card variant="muted" size="none" radius="lg" data-m2-new="New · Existing policies coverage">
        <div className="flex flex-col gap-1 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <Typography variant="paragraph-small-medium" className="min-w-0 flex-1 truncate">
              {count} {count === 1 ? 'spending limit' : 'spending limits'}
            </Typography>
            <Badge variant={isApplied ? 'success' : 'warning'} size="status" shape="status">
              {isApplied ? 'Follow the allowlist' : 'Not covered'}
            </Badge>
          </div>
          {/* A choice made at setup, so it reads as information, not a warning to act on. */}
          {!isApplied && (
            <Typography variant="paragraph-small" color="muted" className="pl-11">
              They can still send any token to any address. Edit the allowlist to include them.
            </Typography>
          )}
        </div>
      </Card>
    </DrawerSection>
  )
}

/** What became of a queued transaction that left the queue (M1's PendingTxOutcome). */
export type PanelOutcome = 'executed' | 'failed' | 'replaced' | 'deleted'

/** A side panel state picked from the prototype bar. Without one, the panel follows the prototype's own state. */
export type AllowlistPanelScenario = { viewer: PanelViewer; operation?: PanelOperation; outcome?: PanelOutcome }

// Setup's side panel copy, the one pattern every allowlist transaction follows: same states, same sentences, its own goal.
type TxCopy = {
  /** Yellow title while signatures are missing: what stays true until it's executed. */
  pending: string
  /** "Sign and execute the transaction to …" */
  signGoal: string
  /** Blue, fully signed: "Execute the transaction to …" */
  executeGoal: string
  /** After "The transaction is executed." while the result loads. */
  processing: string
}

export const TX_COPY: Record<PanelOperation, TxCopy> = {
  create: {
    pending: "The allowlist isn't active until the transaction is executed.",
    signGoal: 'activate it',
    executeGoal: 'activate the allowlist',
    processing: 'The allowlist will appear as active in a moment.',
  },
  update: {
    pending: '',
    signGoal: 'start the 24-hour review window',
    executeGoal: 'start the 24-hour review window',
    processing: 'The change applies on {at}, after the 24-hour review window.',
  },
  'update-apply': {
    pending: 'The current rules still apply until the transaction is executed.',
    signGoal: 'apply the new rules',
    executeGoal: 'apply the new rules',
    processing: 'The new rules will appear in a moment.',
  },
  'update-cancel': {
    pending: "The change isn't canceled until the transaction is executed.",
    signGoal: 'cancel the change',
    executeGoal: 'cancel the change',
    processing: 'The change will disappear in a moment.',
  },
  remove: {
    pending: '',
    signGoal: 'start the 24-hour review window',
    executeGoal: 'start the 24-hour review window',
    processing: 'The removal applies on {at}, after the 24-hour review window.',
  },
  'remove-apply': {
    pending: 'The allowlist stays active until the transaction is executed.',
    signGoal: 'remove the allowlist',
    executeGoal: 'remove the allowlist',
    processing: 'The allowlist will disappear in a moment.',
  },
  'remove-cancel': {
    pending: "The removal isn't canceled until the transaction is executed.",
    signGoal: 'cancel the removal',
    executeGoal: 'cancel the removal',
    processing: 'The removal will disappear in a moment.',
  },
}

const lowerFirst = (text: string): string => text.charAt(0).toLowerCase() + text.slice(1)

const signLine = (operation: PanelOperation): string =>
  `Sign and execute the transaction to ${TX_COPY[operation].signGoal}.`
const executeLine = (operation: PanelOperation): string =>
  `Execute the transaction to ${TX_COPY[operation].executeGoal}.`
const DAY_MS = 24 * 60 * 60 * 1000

/** "Oct 13, 20:00 UTC", the date format the side panels already use. */
const formatUtc = (date: Date): string =>
  `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })} UTC`

const processingLine = (operation: PanelOperation): string =>
  `The transaction is executed. ${TX_COPY[operation].processing.replace('{at}', formatUtc(new Date(Date.now() + DAY_MS)))}`
const waitingLine = (missing: number): string => `Waiting for ${missing} more signature${missing === 1 ? '' : 's'}`

/** The transaction-only spec stages, as the setup operation they read like. */
const SPEC_TX_OPERATION: Partial<Record<SpecStage, Record<'Edit' | 'Removal', PanelOperation>>> = {
  pending: { Edit: 'update', Removal: 'remove' },
  'ready to execute': { Edit: 'update', Removal: 'remove' },
  'apply pending': { Edit: 'update-apply', Removal: 'remove-apply' },
  'apply ready to execute': { Edit: 'update-apply', Removal: 'remove-apply' },
  'cancel pending': { Edit: 'update-cancel', Removal: 'remove-cancel' },
  'cancel ready to execute': { Edit: 'update-cancel', Removal: 'remove-cancel' },
}

const getSpecOperation = (change: SpecChange, stage: SpecStage): PanelOperation | undefined =>
  change === 'Edit' || change === 'Removal' ? SPEC_TX_OPERATION[stage]?.[change] : undefined

// M1's outcome titles, without "nonce".
const OUTCOME_TITLE: Record<PanelOutcome, string> = {
  ...PENDING_OUTCOME_TITLE,
  replaced: "Another transaction replaced this one, so it can't be executed.",
}

const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit this allowlist.'

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

/** A queued allowlist transaction, by viewer: setup's four cases, or execute once fully signed. */
const resolvePendingState = (
  row: PolicyRow,
  viewer: PanelViewer,
  operation: PanelOperation,
  signed: number,
  required: number,
): PanelState => {
  const base = { kind: 'pending', operation, signed, required } as const
  const missing = required - signed

  if (viewer === 'disconnected') {
    return { ...base, action: 'connect', line2: CONNECT_TO_SIGN_LINE, helper: connectHelper(row.account.name) }
  }
  // Anyone can execute a fully signed Safe transaction, so this outranks the signer checks below.
  if (signed >= required) return { ...base, action: 'execute', line2: executeLine(operation) }
  if (viewer === 'non-signer') {
    return { ...base, action: 'copy-link', line2: `${signed}/${required} signed. ${waitingLine(missing)}` }
  }
  if (viewer === 'signer-signed')
    return { ...base, action: 'copy-link', line2: `You've signed. ${waitingLine(missing)}.` }
  return { ...base, action: 'review', line2: signLine(operation) }
}

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
    return resolvePendingState(row, viewer, operation, signed, required)
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

/** Spec 5.8: executed, but not served yet, so the panel waits for it. */
const ProcessingAlert = ({ operation }: { operation: PanelOperation }): ReactElement => (
  <div data-m2-new="Spec 5.8 · Processing">
    <M2Alert
      tone="neutral"
      title={
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Processing
        </span>
      }
      description={processingLine(operation)}
      showIcon={false}
    />
  </div>
)

/** SpendingLimitDrawer's top of body: the pending or closed banner and the signatures, or the change waiting out its delay. */
const StatusSection = ({ row, state }: { row: PolicyRow; state: PanelState }): ReactElement | null => {
  switch (state.kind) {
    case 'pending':
      return (
        <div className="flex flex-col gap-6">
          {state.action === 'execute' ? (
            <M2Alert tone="info" description={state.line2} />
          ) : (
            <M2Alert tone="warning" title={TX_COPY[state.operation].pending} description={state.line2} />
          )}
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
            title={OUTCOME_TITLE[state.outcome]}
            description="Close this panel to see the current policies."
          />
        )
      }

      return <ProcessingAlert operation={state.operation} />

    // Spec 5.8: executed, but not served yet, so the panel waits for it.
    case 'activating':
      return <ProcessingAlert operation="create" />

    case 'change-pending':
      return (
        <M2Alert
          tone="warning"
          title={`The change ${lowerFirst(getStatusDetail(row) ?? '')}.`}
          description="Any signer can cancel it before then."
        />
      )

    case 'live':
      return null
  }
}

/** The example change's review window (spec 5.6.6): requested, applies from, expires 7 days later. */
const REVIEW_DATES = { requested: 'Oct 12, 20:00', appliesFrom: 'Oct 13, 20:00', expires: 'Oct 20, 20:00' }

/** What a spec 5.7 stage shows: its banner, the signatures when it waits for them, and its actions. */
type SpecPanel = {
  tone: 'warning' | 'info' | 'neutral' | 'error'
  title: string
  description: string
  signatures?: boolean
  actions: 'cancel' | 'apply' | 'discard' | 'remove'
  /** The lists read as removed, as M1's removal does. */
  isRemoved: boolean
}

const CHANGE_NOUN: Record<SpecChange, string> = {
  Edit: 'change',
  Removal: 'removal',
  'Guard removal': 'removal',
  Guard: 'policy',
}

const getSpecPanel = (change: SpecChange, stage: SpecStage, row: PolicyRow): SpecPanel | undefined => {
  const noun = CHANGE_NOUN[change]
  const isRemoval = change !== 'Edit'
  const removed = isRemoval && !['expired', 'cancel pending', 'cancel ready to execute'].includes(stage)

  switch (stage) {
    case 'in delay':
      return {
        tone: 'warning',
        title: `The ${noun} ${lowerFirst(getStatusDetail(row) ?? '')}.`,
        description: 'Any signer can cancel it before then.',
        actions: 'cancel',
        isRemoved: removed,
      }
    case 'ready to apply':
      return {
        tone: 'info',
        title: `The ${noun} is ready to apply.`,
        description: `It doesn't apply on its own. Apply it before ${REVIEW_DATES.expires}, or it expires.`,
        actions: 'apply',
        isRemoved: removed,
      }
    case 'expired':
      return {
        tone: 'neutral',
        title: `This ${noun} expired.`,
        description:
          change === 'Edit'
            ? "It wasn't applied within 7 days, so the current rules still apply."
            : "It wasn't applied within 7 days, so the allowlist stays active.",
        actions: 'discard',
        isRemoved: false,
      }
    case 'missing':
      return {
        tone: 'error',
        title: "This allowlist isn't applied.",
        description:
          "It was removed from this Safe account outside the app, so transactions aren't checked against it.",
        actions: 'remove',
        isRemoved: false,
      }
    default:
      return undefined
  }
}

/** The spec 5.7 stage's banner, and M1's pending signatures when it waits for them. */
const SpecStatusSection = ({ row, panel, stage }: { row: PolicyRow; panel: SpecPanel; stage: SpecStage }) => {
  const required = row.account.threshold
  const signed = stage.endsWith('ready to execute') ? required : 1

  return (
    <div className="flex flex-col gap-6" data-m2-new="Spec 5.7 · Side panel state">
      <M2Alert tone={panel.tone} title={panel.title} description={panel.description} />
      {(stage === 'in delay' || stage === 'ready to apply') && (
        <DrawerSection title="Review window">
          <DrawerList
            items={[
              { label: 'Requested', content: REVIEW_DATES.requested },
              { label: 'Applies from', content: REVIEW_DATES.appliesFrom },
              { label: 'Expires', content: REVIEW_DATES.expires },
              ...(stage === 'ready to apply'
                ? [{ label: 'Signatures needed', content: `${required} of ${row.account.owners}` }]
                : []),
            ]}
          />
        </DrawerSection>
      )}
      {panel.signatures && (
        <DrawerSection title="Pending signatures" rightNode={`${signed} of ${required} signatures`}>
          <DrawerList
            items={[
              { label: 'Time to sign', content: SIGNING_TIME_LEFT },
              { label: 'Safe account', content: <SafeAddress name={row.account.name} address={row.account.address} /> },
              {
                label: 'Waiting for',
                content: <WaitingForSigners signed={signed} required={required} owners={row.account.owners} />,
              },
            ]}
          />
        </DrawerSection>
      )}
    </div>
  )
}

/** Spec 5.6.8: signers act, non-signers get the button disabled with the reason, no wallet gets Connect wallet. */
const SpecActions = ({
  panel,
  change,
  viewer,
  onConfirm,
  onCancelChange,
}: M2DrawerHandlers & { panel: SpecPanel; change: SpecChange; viewer: PanelViewer }): ReactElement | null => {
  const noun = CHANGE_NOUN[change]
  const capitalNoun = noun.charAt(0).toUpperCase() + noun.slice(1)
  const { label, verb } = {
    cancel: { label: `Cancel ${noun}`, verb: `cancel this ${noun}` },
    apply: { label: `Apply ${noun}`, verb: `apply or cancel this ${noun}` },
    discard: { label: `Discard ${noun}`, verb: `discard this ${noun}` },
    remove: { label: 'Remove allowlist', verb: 'remove this allowlist' },
  }[panel.actions]

  if (viewer === 'disconnected') {
    return (
      <PolicyDrawerActions
        actionLabel="Connect wallet"
        onClick={() => {}}
        hint={`Connect a signer wallet to ${verb}.`}
      />
    )
  }
  if (viewer === 'non-signer') {
    return <PolicyDrawerActions actionLabel={label} hint={`Only signers of this Safe account can ${verb}.`} disabled />
  }

  switch (panel.actions) {
    // Spec 5.6.6: Apply is there but disabled until the review window ends.
    case 'cancel':
      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" disabled>
              Apply {noun}
            </Button>
            <Typography variant="paragraph-mini" color="muted" className="text-center">
              You can apply it from {REVIEW_DATES.appliesFrom}.
            </Typography>
            <Button variant="secondary" className="w-full" onClick={onCancelChange}>
              Cancel {noun}
            </Button>
          </div>
        </DrawerFooter>
      )
    case 'apply':
      return (
        <DrawerFooter>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onConfirm}>
              Apply {noun}
            </Button>
            <Button variant="secondary" className="w-full" onClick={onCancelChange}>
              Cancel {noun}
            </Button>
          </div>
        </DrawerFooter>
      )
    case 'discard':
      return <PolicyDrawerActions actionLabel={`Discard ${noun}`} variant="secondary" onClick={() => {}} />
    case 'remove':
      return (
        <PolicyDrawerActions
          actionLabel={label}
          variant="secondary"
          onClick={() => {}}
          hint={change === 'Guard' ? undefined : `${capitalNoun} expired.`}
        />
      )
  }
}

type M2DrawerHandlers = {
  onEdit?: () => void
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
            <Button variant="secondary" className="w-full">
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
  appliesToSpendingLimits,
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
  /** Whether the account's spending limits follow the allowlist too. */
  appliesToSpendingLimits: boolean
  /** The first execution just finished: confirm it once at the top of the panel. */
  justActivated?: boolean
  onClose: () => void
}): ReactElement => {
  // A signer already in the transaction's signatures has signed, whichever state was picked.
  const picked: AllowlistPanelScenario = scenario ?? {
    viewer: row.viewer ?? (row.example ? 'signer' : 'signer-signed'),
    outcome: row.panelOutcome,
  }
  const viewer: PanelViewer = picked.viewer === 'signer' && viewerHasSigned ? 'signer-signed' : picked.viewer
  // Spec 6.6: the main flow's change waiting out its delay reads as the spec's Edit in delay.
  const example =
    row.example ??
    (row.status === 'change-pending' ? { change: 'Edit' as const, stage: 'in delay' as const } : undefined)
  const specOperation = example && getSpecOperation(example.change, example.stage)
  const required = row.account.threshold
  // Spec transactions read exactly like setup's, by viewer; the other spec stages keep their own banner.
  const state: PanelState = specOperation
    ? picked.outcome
      ? { kind: 'closed', operation: specOperation, outcome: picked.outcome }
      : resolvePendingState(
          row,
          viewer,
          specOperation,
          example.stage.endsWith('ready to execute') ? required : 1,
          required,
        )
    : resolvePanelState(row, { ...picked, viewer })
  const spec = example && !specOperation ? getSpecPanel(example.change, example.stage, row) : undefined
  const isRemoved = spec
    ? spec.isRemoved
    : specOperation
      ? specOperation === 'remove' || specOperation === 'remove-apply'
      : (state.kind === 'pending' || state.kind === 'closed') && state.operation === 'remove'
  const tokens = getAccountTokens(row.account).filter(({ symbol }) => !excludedTokens.includes(symbol))
  const spendingLimitCount = getAccountSpendingLimits(row.account).length

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={POLICY_ROW_LABELS[row.type]}>
      <M2DrawerHeader row={row} status={getPanelStatus(row, state)} useTag={!scenario?.outcome} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {justActivated && state.kind === 'live' && (
            <M2Alert
              tone="success"
              title="The allowlist is active"
              description={`${row.account.name} can only send allowed tokens to ${row.people.length} allowed ${row.people.length === 1 ? 'recipient' : 'recipients'}. Every later change has a 24-hour review window.`}
            />
          )}
          {spec && example ? (
            <SpecStatusSection row={row} panel={spec} stage={example.stage} />
          ) : (
            <StatusSection row={row} state={state} />
          )}
          <RecipientList recipients={row.people} isRemoved={isRemoved} />
          <TokenList tokens={tokens} isRemoved={isRemoved} />
          {spendingLimitCount > 0 && !isRemoved && (
            <ExistingPoliciesSection count={spendingLimitCount} isApplied={appliesToSpendingLimits} />
          )}
          {/* Last in every state, as in SpendingLimitDrawer. */}
          <PolicyOverviewSection account={row.account} lastUpdated={row.lastUpdated} />
        </div>
      </DrawerBody>

      {spec && example ? (
        <SpecActions panel={spec} change={example.change} viewer={viewer} {...handlers} />
      ) : (
        <M2DrawerActions row={row} state={state} {...handlers} />
      )}
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
  /** Allowlist on Payments only: its setup's "Apply the allowlist to existing policies" switch. */
  paymentsAppliesToSpendingLimits?: boolean
  /** The setup allowlist's first execution just finished. */
  justActivated?: boolean
  /** A blocked spending limit's "See policy here": opens the allowlist on that account. */
  onOpenAllowlist?: (account: M2Account) => void
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
  paymentsAppliesToSpendingLimits = true,
  justActivated = false,
  onOpenAllowlist,
  onClose,
  ...handlers
}: PolicyDrawerProps): ReactElement | null => {
  if (!row) return null

  switch (row.type) {
    // The row's status picks the panel, so the panel's chip always matches the table's.
    case 'spending-limit': {
      const limit = row.spendingLimit ?? PAYMENTS_LIMIT

      if (row.status === 'blocked') {
        return (
          <BlockedSpendingLimitDrawer
            variant="blocked"
            open={open}
            onClose={onClose}
            limit={limit}
            blockedTokens={row.blockedTokens ?? spendingLimitBlockedTokens}
            onEdit={handlers.onEdit}
            onOpenAllowlist={onOpenAllowlist ? () => onOpenAllowlist(row.account) : undefined}
          />
        )
      }
      if (row.locked) return <BlockedSpendingLimitDrawer variant="locked" open={open} onClose={onClose} limit={limit} />

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
          excludedTokens={
            getAccountKey(row.account) === getAccountKey(PAYMENTS)
              ? paymentsExcludedTokens
              : getAllowlistSettings(row.account).excludedTokens
          }
          appliesToSpendingLimits={
            getAccountKey(row.account) === getAccountKey(PAYMENTS)
              ? paymentsAppliesToSpendingLimits
              : getAllowlistSettings(row.account).applyToSpendingLimits
          }
          justActivated={justActivated}
          onClose={onClose}
          {...handlers}
        />
      )
  }
}
