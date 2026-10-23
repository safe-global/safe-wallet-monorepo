import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from 'react'
import { Info, LockKeyhole, ShieldAlert, ShieldCheck, ShieldEllipsis } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Button } from '@safe-global/views/components/ui/button'
import { Input } from '@safe-global/views/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import SafenetLogo from '@/public/images/safenet/safenet-logo.svg'
import { SAFENET_ICONS, SAFENET_TONES } from '../../SafenetMark'
import { DrawerList } from '@/components/common/Drawer'
import { PanelAlert } from '../../Panel/PanelAlert'
import { TOOLTIP_TIMING } from '../../Panel/SharedDrawerHeader'
import { PanelLinkRow, PanelRow, PanelSection } from '../../Panel/PanelBody'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { getActionBreakdown, getHeadline } from '../../../services/columns'
import {
  getAccount,
  getConflicts,
  getCreatedAt,
  getSignatureCount,
  getSignerIdentity,
  getState,
  getTypeLabel,
  getWarnings,
  WARNING_DETAILS,
  WARNING_LABELS,
} from '../../../services/model'
import { getMethodName, getTechnicalData } from '../../../services/technical'
import { getSafenetCheck, SAFENET_LABELS, SAFENET_URL } from '../../../services/safenet'
import type { Persona, Proposal } from '../../../types'
import { BatchActions, getDetailItems } from '../../ProposalDetails'
import { chainLogoUrl, StatusChip, TypeTag } from '../../shared'
import { SummaryText } from '../../QueueTable/TransactionLine'
import { NonceMark } from '../../QueueTable/NonceCell'
import type { Hypernative } from '../../ScenarioBar'
import type { Replacement, ReviewLayout, SectionsMode } from '../ReviewDrawer'
import { IdentityRow } from './IdentityRow'
import { getFlowRows } from './Flow'
import { getRiskFlags, RiskFlagBadge } from '../../RiskFlag'

const SECTION_TITLES: Record<Proposal['kind']['type'], string> = {
  transfer: 'Transfer',
  swap: 'Swap order',
  bridge: 'Bridge',
  batch: 'Batch',
  contract: 'Contract call',
  settings: 'Settings',
  nested: 'Nested Safe approval',
  rejection: 'On-chain rejection',
}

// Earlier nonces this transaction waits on, at most 10.
const getEarlierNonces = (tx: Proposal, persona: Persona) => {
  const { nextNonce } = getAccount(tx)
  return getState(tx, persona).waiting
    ? Array.from({ length: Math.min(tx.nonce - nextNonce, 10) }, (_, index) => nextNonce + index)
    : []
}

const atNonce = (tx: Proposal, items: Proposal[], nonce: number) =>
  items.filter((other) => other.account === tx.account && other.nonce === nonce)

// Queue order lives in Summary. Alerts are for urgent transactions, risks, and a missing nonce, which stops the whole queue.
export function StatusAlerts({ tx, items, persona }: { tx: Proposal; items: Proposal[]; persona: Persona }) {
  const gap = getEarlierNonces(tx, persona).find((nonce) => !atNonce(tx, items, nonce).length)
  return (
    <>
      {tx.emergency && <PanelAlert tone="error" title="Urgent" description={tx.emergency} />}
      {gap !== undefined && (
        <PanelAlert
          tone="warning"
          title={`#${gap} has no proposal`}
          description={`Nothing after #${gap} can execute until a transaction uses that nonce.`}
        />
      )}
      {getWarnings(tx).map((warning) => (
        <PanelAlert
          key={warning}
          tone="warning"
          title={WARNING_LABELS[warning]}
          description={WARNING_DETAILS[warning]}
        />
      ))}
    </>
  )
}

export const SectionsContext = createContext<{ mode: SectionsMode; version: number }>({ mode: 'default', version: 0 })

// A section's open state: its own default, overridden by "Expand all" / "Collapse all" each time they're pressed.
const useSectionOpen = (defaultOpen: boolean) => {
  const { mode, version } = useContext(SectionsContext)
  const target = mode === 'expanded' ? true : mode === 'collapsed' ? false : defaultOpen
  const [open, setOpen] = useState(target)
  const [appliedVersion, setAppliedVersion] = useState(version)
  if (appliedVersion !== version) {
    setAppliedVersion(version)
    setOpen(target)
  }
  return { open, onOpenChange: setOpen }
}

// Only Summary opens by default. Security and the type section also open when there's a warning to look at.
const hasSecurityIssue = (tx: Proposal) => getWarnings(tx).length > 0 || getSafenetCheck(tx) === 'risk'

// Types whose details are a list or a long block get their own section. The rest fit in Summary.
const hasOwnSection = (tx: Proposal) =>
  tx.kind.type === 'batch' || tx.kind.type === 'swap' || (tx.kind.type === 'contract' && !!tx.kind.steps)

const getTypeRows = (tx: Proposal, extended: boolean) => {
  const hidden = [
    'Recipient',
    'Token',
    'From',
    'To',
    'Fees',
    'Change',
    ...(tx.kind.type === 'settings' ? [] : ['Address']),
    ...(tx.kind.type === 'batch' ? ['Call', 'Operation', 'Total value'] : []),
  ]
  return [
    ...(tx.origin === 'replacement' ? [{ label: 'Proposed as', content: 'Replacement' }] : []),
    ...getDetailItems(tx, extended).filter((item) => !hidden.includes(String(item.label))),
  ]
}

const Warning = ({ children }: { children: ReactNode }) => <span className="text-warning-strong">{children}</span>

const getSectionSummary = (tx: Proposal) => {
  const { kind } = tx
  if (kind.type === 'batch') return getActionBreakdown(kind.actions)
  if (kind.type === 'swap') return kind.expired ? <Warning>Expired</Warning> : 'Open'
  if (kind.type === 'contract') return kind.verified ? 'Verified' : <Warning>Unverified</Warning>
  return undefined
}

const MethodName = ({ method }: { method: string }) => <code className="font-mono text-xs">{method}</code>

export function SummarySection({ tx, status }: { tx: Proposal; status?: ReactNode }) {
  const account = getAccount(tx)
  const creatorId = tx.signers[0]
  const creator = creatorId ? getSignerIdentity(creatorId) : undefined
  const section = useSectionOpen(true)
  return (
    <PanelSection collapsible {...section} title="Summary" rightNode={status}>
      <PanelRow label="Type">
        <span className="flex justify-end">
          <TypeTag type={getTypeLabel(tx)} />
        </span>
      </PanelRow>
      {tx.app && (
        <PanelRow label="App">
          <span className="flex items-center justify-end gap-2">
            <Avatar size="xs" className="size-5">
              {tx.app.logo && <AvatarImage src={tx.app.logo} alt="" />}
              <AvatarFallback>{tx.app.name[0]}</AvatarFallback>
            </Avatar>
            {tx.app.name}
          </span>
        </PanelRow>
      )}
      <PanelRow label="Action">
        <SummaryText tx={tx} />
      </PanelRow>
      {getFlowRows(tx).map((row) =>
        row.top ? (
          <div key={row.label} className="flex items-start justify-between gap-2">
            <Typography variant="paragraph-small-medium" className="flex h-6 shrink-0 items-center">
              {row.label}
            </Typography>
            {row.content}
          </div>
        ) : (
          <PanelRow key={row.label} label={row.label}>
            {row.content}
          </PanelRow>
        ),
      )}
      {(hasOwnSection(tx) ? [] : getTypeRows(tx, false)).map((row) => (
        <PanelRow key={String(row.label)} label={row.label}>
          {row.content}
        </PanelRow>
      ))}
      {/* The From avatar carries the network. Swaps have no From row, so they keep this one. */}
      {tx.kind.type === 'swap' && (
        <PanelRow label="Network">
          <span className="flex items-center justify-end gap-2">
            <Avatar size="xs" className="size-5">
              <AvatarImage src={chainLogoUrl(account.chainId)} alt="" />
              <AvatarFallback>{account.network[0]}</AvatarFallback>
            </Avatar>
            {account.network}
          </span>
        </PanelRow>
      )}
      <PanelRow label="Proposed">{`${formatDateTime(getCreatedAt(tx))} · ${tx.age}`}</PanelRow>
      <PanelRow label="Created by">
        {tx.proposedBy ? (
          tx.proposedBy
        ) : creator ? (
          <IdentityRow inline name={creator.name} address={creator.address} chainId={account.chainId} />
        ) : (
          'Unknown'
        )}
      </PanelRow>
    </PanelSection>
  )
}

export function WhatItDoesSection({ tx }: { tx: Proposal }) {
  const { kind } = tx
  const section = useSectionOpen(hasSecurityIssue(tx))
  if (!hasOwnSection(tx)) return null
  return (
    <PanelSection collapsible {...section} title={SECTION_TITLES[kind.type]} rightNode={getSectionSummary(tx)}>
      {getTypeRows(tx, true).map((item) => (
        <PanelRow key={String(item.label)} label={item.label}>
          {item.content}
        </PanelRow>
      ))}
      {kind.type === 'contract' && kind.steps && (
        <ol className="list-decimal space-y-1 pl-4 text-sm">
          {kind.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {kind.type === 'batch' && <BatchActions actions={kind.actions} heading="All actions" />}
    </PanelSection>
  )
}

export function NoteSection({ tx }: { tx: Proposal }) {
  const section = useSectionOpen(false)
  if (!tx.note) return null
  return (
    <PanelSection collapsible {...section} title="Note" rightNode={tx.note.onchain ? 'On-chain' : 'Off-chain'}>
      <div className="space-y-2">
        <p className="text-sm leading-relaxed">{tx.note.text}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <LockKeyhole className="size-3" aria-hidden="true" />
          By {tx.note.author} · {tx.note.date}
        </p>
      </div>
    </PanelSection>
  )
}

// What the earliest blocker needs, from this persona's point of view.
const getBlockerStep = (next: Proposal, persona: Persona) => {
  const { ready, canSign, missing } = getState(next, persona)
  if (ready) return `Execute #${next.nonce} first.`
  if (canSign) return `Sign #${next.nonce} first.`
  return `Waiting on ${missing} ${missing === 1 ? 'signer' : 'signers'} for #${next.nonce}.`
}

type QueueProps = { tx: Proposal; items: Proposal[]; persona: Persona; onReview: (tx: Proposal) => void }

// Why this can't simply be signed and executed: what it waits on, what it competes with, and its risk flags.
export function ConflictsSection({ tx, items, persona, onReview }: QueueProps) {
  const section = useSectionOpen(true)
  const earlierNonces = getEarlierNonces(tx, persona)
  const next = earlierNonces.flatMap((nonce) => atNonce(tx, items, nonce))[0]
  const conflicts = getConflicts(tx, items)
  const flags = getRiskFlags(tx)
  if (!next && !conflicts.length && !flags.length) return null
  const flagIssue = flags.some((flag) => flag.issue)
  // Blocked wins: it's the reason this can't execute yet, and it uses the table's status pill.
  const summary = next ? (
    <StatusChip tone="warning">Blocked by #{next.nonce}</StatusChip>
  ) : conflicts.length ? (
    <Warning>Conflict</Warning>
  ) : (
    <span className={flagIssue ? 'text-warning-strong' : undefined}>
      {flags.length} {flags.length === 1 ? 'flag' : 'flags'}
    </span>
  )
  return (
    <PanelSection collapsible {...section} title="Conflicts and checks" rightNode={summary}>
      {next && (
        <PanelLinkRow onClick={() => onReview(next)}>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2 text-sm font-medium">
              Runs after #{next.nonce}
              {earlierNonces.length > 1 && (
                <span className="text-xs font-normal text-muted-foreground">+{earlierNonces.length - 1} earlier</span>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {getHeadline(next)} · {getBlockerStep(next, persona)}
            </span>
          </span>
        </PanelLinkRow>
      )}
      {conflicts.length > 0 && (
        <div>
          <p className="text-sm font-medium text-warning-strong">
            {conflicts.length + 1} transactions at #{tx.nonce}
          </p>
          <p className="text-xs text-muted-foreground">
            Only one can execute. Once it does, the {conflicts.length === 1 ? 'other becomes' : 'others become'}{' '}
            invalid.
          </p>
        </div>
      )}
      {conflicts.map((other) => (
        <PanelLinkRow key={other.id} onClick={() => onReview(other)}>
          <NonceMark tx={other} />
          <span className="min-w-0 flex-1 truncate text-sm">{getHeadline(other)}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {getSignatureCount(other)} of {getAccount(other).threshold} signed
          </span>
        </PanelLinkRow>
      ))}
      {flags.length > 0 && (
        <PanelRow label="Checks">
          <span className="flex flex-wrap justify-end gap-1">
            {flags.map((flag) => (
              <RiskFlagBadge key={flag.key} flag={flag} />
            ))}
          </span>
        </PanelRow>
      )}
    </PanelSection>
  )
}

type Simulation = 'idle' | 'running' | 'success' | 'failed'

type CheckResult = 'notRun' | 'running' | 'passed' | 'issue'

// "2 of 3 passed". Issues, then running checks, win over the count.
function SecurityVerdict({
  tx,
  hypernative,
  simulation,
}: {
  tx: Proposal
  hypernative: Hypernative
  simulation: Simulation
}) {
  const safenet = getSafenetCheck(tx)
  const results: CheckResult[] = [
    safenet === 'notStarted' ? 'notRun' : safenet === 'checking' ? 'running' : safenet === 'risk' ? 'issue' : 'passed',
    simulation === 'idle'
      ? 'notRun'
      : simulation === 'running'
        ? 'running'
        : simulation === 'failed'
          ? 'issue'
          : 'passed',
    ...(hypernative === 'none'
      ? []
      : [hypernative === 'out' ? 'notRun' : getWarnings(tx).length > 0 ? 'issue' : ('passed' as CheckResult)]),
  ]
  const count = (result: CheckResult) => results.filter((item) => item === result).length
  const issues = count('issue')
  const passed = `${count('passed')} of ${results.length}`
  const [Icon, tone, label] = issues
    ? [ShieldAlert, SAFENET_TONES.risk, `${issues} ${issues === 1 ? 'issue' : 'issues'}`]
    : count('running')
      ? [ShieldEllipsis, SAFENET_TONES.checking, `Checking… ${passed}`]
      : count('passed') === results.length
        ? [ShieldCheck, SAFENET_TONES.passed, `${passed} passed`]
        : [ShieldEllipsis, SAFENET_TONES.notStarted, `${passed} passed`]
  return (
    <span className={`flex items-center gap-1 tabular-nums ${tone}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

export function SecuritySection({ tx, hypernative }: { tx: Proposal; hypernative: Hypernative }) {
  const [simulation, setSimulation] = useState<Simulation>('idle')
  useEffect(() => setSimulation('idle'), [tx.id])
  useEffect(() => {
    if (simulation !== 'running') return
    const fails = getWarnings(tx).some((warning) => warning === 'unverifiedContract' || warning === 'unknownNetwork')
    const timer = setTimeout(() => setSimulation(fails ? 'failed' : 'success'), 800)
    return () => clearTimeout(timer)
  }, [simulation, tx])
  const safenet = getSafenetCheck(tx)
  const SafenetIcon = SAFENET_ICONS[safenet]
  const issues = getWarnings(tx).length > 0
  const section = useSectionOpen(hasSecurityIssue(tx))
  return (
    <PanelSection
      collapsible
      {...section}
      title="Security"
      rightNode={<SecurityVerdict tx={tx} hypernative={hypernative} simulation={simulation} />}
    >
      {[
        ...(hypernative === 'none'
          ? []
          : [
              {
                key: 'Hypernative',
                label: 'Hypernative',
                content:
                  hypernative === 'out' ? (
                    <Button size="xs" variant="outline">
                      Log in to view scan
                    </Button>
                  ) : (
                    <span className={issues ? 'text-warning-strong' : 'text-success-strong'}>
                      {issues ? 'Issues found' : 'No issues found'}
                    </span>
                  ),
              },
            ]),
        {
          key: 'Simulation',
          label: 'Simulation',
          content:
            simulation === 'idle' ? (
              <Button size="xs" variant="outline" onClick={() => setSimulation('running')}>
                Simulate
              </Button>
            ) : simulation === 'running' ? (
              'Simulating…'
            ) : (
              <span className={simulation === 'success' ? 'text-success-strong' : 'text-destructive'}>
                {simulation === 'success' ? 'Simulation successful' : 'Simulation failed'} ·{' '}
                <ExternalLink href="https://dashboard.tenderly.co" noIcon>
                  Tenderly
                </ExternalLink>
              </span>
            ),
        },
        {
          key: 'Safenet',
          label: (
            <span className="flex items-center gap-1.5">
              <SafenetLogo role="img" aria-label="Safenet" className="h-2.5 w-auto text-foreground" />
              <Tooltip {...TOOLTIP_TIMING}>
                <TooltipTrigger
                  aria-label="About Safenet"
                  className="flex cursor-default text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent className="max-w-64 whitespace-normal">
                  Independent checks by Safenet validators ·{' '}
                  <ExternalLink href={SAFENET_URL} noIcon className="text-background underline">
                    Learn more
                  </ExternalLink>
                </TooltipContent>
              </Tooltip>
            </span>
          ),
          content: (
            <span className={`flex items-center gap-1.5 ${SAFENET_TONES[safenet]}`}>
              <SafenetIcon className="size-4" aria-hidden="true" />
              {SAFENET_LABELS[safenet]}
            </span>
          ),
        },
      ].map((item) => (
        <PanelRow key={item.key} label={item.label}>
          {item.content}
        </PanelRow>
      ))}
    </PanelSection>
  )
}

const Mono = ({ value }: { value: string | number }) => (
  <span className="block break-all text-right font-mono text-xs">{value}</span>
)

export function TransactionDataSection({ tx, open, onToggle }: { tx: Proposal; open: boolean; onToggle: () => void }) {
  const data = getTechnicalData(tx)
  const method = getMethodName(tx)
  return (
    <PanelSection
      collapsible
      title="Transaction data"
      open={open}
      onOpenChange={() => onToggle()}
      rightNode={method && <MethodName method={method} />}
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Cross-verify your transaction data with{' '}
          <ExternalLink href="https://safeutils.openzeppelin.com">Safe Utils</ExternalLink> and{' '}
          <ExternalLink href="https://transaction-decoder.pages.dev">Transaction Decoder</ExternalLink>. Values in this
          preview are placeholders.
        </p>
        <Tabs defaultValue="data">
          <TabsList aria-label="Transaction data views">
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="hashes">Hashes</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <DrawerList
              mobileStack
              items={[
                { label: 'To', content: <Mono value={data.to} /> },
                { label: 'Value', content: <Mono value={data.value} /> },
                {
                  label: 'Data',
                  content: <Mono value={data.data.length > 142 ? `${data.data.slice(0, 140)}…` : data.data} />,
                },
                { label: 'Operation', content: data.operation },
                { label: 'SafeTxGas', content: <Mono value={data.safeTxGas} /> },
                { label: 'BaseGas', content: <Mono value={data.baseGas} /> },
                { label: 'GasPrice', content: <Mono value={data.gasPrice} /> },
                { label: 'GasToken', content: <Mono value={data.gasToken} /> },
                { label: 'RefundReceiver', content: <Mono value={data.refundReceiver} /> },
                { label: 'Nonce', content: <Mono value={data.nonce} /> },
                ...data.signatures.map((signature, index) => ({
                  label: `Signature ${index + 1}`,
                  content: <Mono value={`${signature.bytes.slice(0, 42)}…`} />,
                })),
              ]}
            />
          </TabsContent>
          <TabsContent value="hashes">
            <DrawerList
              mobileStack
              items={[
                { label: 'Domain hash', content: <Mono value={data.domainHash} /> },
                { label: 'Message hash', content: <Mono value={data.messageHash} /> },
                { label: 'safeTxHash', content: <Mono value={data.safeTxHash} /> },
              ]}
            />
          </TabsContent>
          <TabsContent value="json">
            <pre className="max-w-full overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </div>
    </PanelSection>
  )
}

export function ChangeSection({
  tx,
  layout,
  onProposeAlternative,
}: {
  tx: Proposal
  layout: ReviewLayout
  onProposeAlternative: (kind: 'cancellation' | 'replacement') => void
}) {
  const { replacement } = layout
  if (!layout.reject) return null
  return (
    <PanelSection collapsible title={replacement ? 'Replace with a transfer' : 'Reject'}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {replacement
            ? `Sends a transfer at nonce #${tx.nonce} instead. It needs signatures and execution. Only one of the two can execute.`
            : `Creates an on-chain rejection at nonce #${tx.nonce}. It needs ${getAccount(tx).threshold} signatures and execution like any transaction. Once it executes, this proposal can't.`}
        </p>
        {replacement &&
          (['recipient', 'amount'] as const).map((field) => (
            <label key={field} className="block space-y-1 text-sm">
              <span>{field === 'recipient' ? 'Recipient' : 'Amount'}</span>
              <Input
                value={replacement[field]}
                onChange={(event) =>
                  layout.setReplacement({ ...(replacement as Replacement), [field]: event.target.value })
                }
              />
            </label>
          ))}
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!!replacement && (!replacement.recipient.trim() || !replacement.amount.trim())}
            onClick={() => onProposeAlternative(replacement ? 'replacement' : 'cancellation')}
          >
            {replacement ? 'Propose replacement in preview' : 'Reject in preview'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              layout.setReject(false)
              layout.setReplacement(null)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </PanelSection>
  )
}
