import { useEffect, useState, type ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Input } from '@safe-global/views/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { DrawerList, DrawerSection } from '@/components/common/Drawer'
import { formatDateTime } from '@safe-global/utils/utils/date'
import { getHeadline } from '../../../services/columns'
import { getStatusHint } from '../../../services/actions'
import {
  getAccount,
  getConflicts,
  getCreatedAt,
  getSignerIdentity,
  getState,
  getStepsStatus,
  getWarnings,
  WARNING_DETAILS,
  WARNING_LABELS,
} from '../../../services/model'
import { getTechnicalData } from '../../../services/technical'
import type { Persona, Proposal } from '../../../types'
import { BatchActions, getDetailItems } from '../../ProposalDetails'
import { NonceMark } from '../../QueueTable/NonceCell'
import { chainLogoUrl, StepsStatusChip } from '../../shared'
import type { Hypernative } from '../../ScenarioBar'
import type { Replacement, ReviewLayout } from '../ReviewDrawer'
import { IdentityRow } from './IdentityRow'

const SECTION_TITLES: Record<Proposal['kind']['type'], string> = {
  transfer: 'Transfer',
  swap: 'Swap order',
  bridge: 'Bridge',
  batch: 'Batch',
  contract: 'Contract call',
  settings: 'Settings change',
  nested: 'Nested Safe approval',
  rejection: 'On-chain rejection',
}

const Right = ({ children }: { children: ReactNode }) => <span className="flex min-w-0 justify-end">{children}</span>

export function StatusAlerts({ tx, items, persona }: { tx: Proposal; items: Proposal[]; persona: Persona }) {
  const state = getState(tx, persona)
  const conflicts = getConflicts(tx, items)
  const options = items.filter((other) => other.account === tx.account && other.nonce === tx.nonce)
  const optionIndex = options.indexOf(tx) + 1
  const blocking = state.waiting || (!state.canSign && !state.ready)
  return (
    <>
      {blocking && (
        <Alert variant={state.waiting && !state.canSign ? 'warning' : 'subtle'} outlined={false}>
          <AlertSeverityIcon variant={state.waiting && !state.canSign ? 'warning' : 'info'} />
          <AlertTitle>
            {state.canSign
              ? `Executes after #${getAccount(tx).nextNonce}`
              : state.waiting
                ? getStepsStatus(tx, persona).label
                : 'Waiting on others'}
          </AlertTitle>
          <AlertDescription>{getStatusHint(tx, items, persona)}</AlertDescription>
        </Alert>
      )}
      {conflicts.length > 0 && (
        <Alert variant="warning" outlined={false}>
          <AlertSeverityIcon variant="warning" />
          <AlertTitle>Conflicting transactions</AlertTitle>
          <AlertDescription>
            Option {optionIndex} of {conflicts.length + 1} at #{tx.nonce}. Only one can execute; executing it replaces
            the others.{' '}
            <ExternalLink href={HelpCenterArticle.CONFLICTING_TRANSACTIONS}>Why did this happen?</ExternalLink>
          </AlertDescription>
        </Alert>
      )}
      {getWarnings(tx).map((warning) => (
        <Alert key={warning} variant="warning" outlined={false}>
          <AlertSeverityIcon variant="warning" />
          <AlertTitle>{WARNING_LABELS[warning]}</AlertTitle>
          <AlertDescription>{WARNING_DETAILS[warning]}</AlertDescription>
        </Alert>
      ))}
    </>
  )
}

export function SummarySection({ tx }: { tx: Proposal }) {
  const account = getAccount(tx)
  const creatorId = tx.signers[0]
  const creator = creatorId ? getSignerIdentity(creatorId) : undefined
  return (
    <DrawerSection collapsible title="Summary">
      <DrawerList
        mobileStack
        items={[
          {
            label: 'Network',
            content: (
              <span className="flex items-center justify-end gap-2">
                <Avatar size="xs">
                  <AvatarImage src={chainLogoUrl(account.chainId)} alt="" />
                  <AvatarFallback>{account.network[0]}</AvatarFallback>
                </Avatar>
                {account.network}
              </span>
            ),
          },
          { label: 'Proposed', content: `${formatDateTime(getCreatedAt(tx))} · ${tx.age}` },
          {
            label: 'Created by',
            content: tx.proposedBy ? (
              tx.proposedBy
            ) : creator ? (
              <Right>
                <IdentityRow name={creator.name} address={creator.address} chainId={account.chainId} />
              </Right>
            ) : (
              'Unknown'
            ),
          },
        ]}
      />
    </DrawerSection>
  )
}

export function WhatItDoesSection({ tx }: { tx: Proposal }) {
  const { kind } = tx
  return (
    <DrawerSection
      collapsible
      title={SECTION_TITLES[kind.type]}
      rightNode={kind.type === 'batch' ? `${kind.actions.length} actions` : undefined}
    >
      <DrawerList
        mobileStack
        items={[
          ...(tx.origin === 'replacement' ? [{ label: 'Proposed as', content: 'Replacement' }] : []),
          // The flow block above shows the recipient and address.
          ...getDetailItems(tx, true).filter((item) => item.label !== 'Recipient' && item.label !== 'Address'),
        ]}
      />
      {kind.type === 'contract' && kind.steps && (
        <ol className="list-decimal space-y-1 rounded-lg bg-muted p-3 pl-7 text-sm">
          {kind.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {kind.type === 'batch' && <BatchActions actions={kind.actions} />}
    </DrawerSection>
  )
}

export function NoteSection({ tx }: { tx: Proposal }) {
  if (!tx.note) return null
  return (
    <DrawerSection collapsible title="Note">
      <div className="space-y-2 rounded-lg bg-muted p-3">
        <p className="text-sm leading-relaxed">{tx.note.text}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <LockKeyhole className="size-3" aria-hidden="true" />
          By {tx.note.author} · {tx.note.date} · Off-chain
        </p>
      </div>
    </DrawerSection>
  )
}

function QueueRow({
  tx,
  persona,
  competing,
  onReview,
}: {
  tx: Proposal
  persona: Persona
  competing?: number
  onReview: (tx: Proposal) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onReview(tx)}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-background/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <NonceMark tx={tx} persona={persona} competing={competing} />
      <span className="min-w-0 flex-1 truncate">{getHeadline(tx)}</span>
      <StepsStatusChip tx={tx} persona={persona} />
    </button>
  )
}

export function QueueContextSection({
  tx,
  items,
  persona,
  onReview,
}: {
  tx: Proposal
  items: Proposal[]
  persona: Persona
  onReview: (tx: Proposal) => void
}) {
  const state = getState(tx, persona)
  const { nextNonce } = getAccount(tx)
  const conflicts = getConflicts(tx, items)
  const earlier = state.waiting
    ? Array.from({ length: Math.min(tx.nonce - nextNonce, 10) }, (_, index) => nextNonce + index)
    : []
  if (!earlier.length && !conflicts.length) return null
  return (
    <>
      {earlier.length > 0 && (
        <DrawerSection collapsible title="Runs after" rightNode={`${earlier.length} earlier`}>
          <div className="rounded-lg bg-muted p-1">
            {earlier.map((nonce) => {
              const atNonce = items.filter((other) => other.account === tx.account && other.nonce === nonce)
              return atNonce.length ? (
                atNonce.map((other) => (
                  <QueueRow
                    key={other.id}
                    tx={other}
                    persona={persona}
                    competing={atNonce.length - 1}
                    onReview={onReview}
                  />
                ))
              ) : (
                <p key={nonce} className="px-2 py-2 text-sm text-warning-strong">
                  #{nonce} has no proposal. Nothing after it can execute.
                </p>
              )
            })}
          </div>
        </DrawerSection>
      )}
      {conflicts.length > 0 && (
        <DrawerSection
          collapsible
          title="Conflicting transactions"
          rightNode={`#${tx.nonce} · ${conflicts.length + 1} options`}
        >
          <div className="rounded-lg bg-muted p-1">
            {conflicts.map((other) => (
              <QueueRow key={other.id} tx={other} persona={persona} competing={conflicts.length} onReview={onReview} />
            ))}
          </div>
        </DrawerSection>
      )}
    </>
  )
}

type Simulation = 'idle' | 'running' | 'success' | 'failed'

export function SecuritySection({ tx, hypernative }: { tx: Proposal; hypernative: Hypernative }) {
  const [simulation, setSimulation] = useState<Simulation>('idle')
  useEffect(() => setSimulation('idle'), [tx.id])
  useEffect(() => {
    if (simulation !== 'running') return
    const fails = getWarnings(tx).some((warning) => warning === 'unverifiedContract' || warning === 'unknownNetwork')
    const timer = setTimeout(() => setSimulation(fails ? 'failed' : 'success'), 800)
    return () => clearTimeout(timer)
  }, [simulation, tx])
  const { kind } = tx
  const checks = [
    tx.proposedBy && tx.signers.length === 0 && <Badge variant="destructive">Untrusted transaction</Badge>,
    kind.type === 'batch' &&
      kind.delegateCall &&
      (kind.delegateCall === 'untrusted' ? (
        <Badge variant="warning">Unexpected delegate call</Badge>
      ) : (
        <Badge variant="outline">Delegate call</Badge>
      )),
    kind.type === 'settings' && ['addOwner', 'removeOwner', 'changeThreshold'].includes(kind.change.kind) && (
      <Badge variant="warning">Confirmation policy change</Badge>
    ),
  ].filter(Boolean)
  const issues = getWarnings(tx).length > 0
  return (
    <DrawerSection collapsible title="Security">
      <DrawerList
        mobileStack
        items={[
          {
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
          ...(hypernative === 'none'
            ? []
            : [
                {
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
            label: 'Checks',
            content: checks.length ? (
              <span className="flex flex-wrap justify-end gap-1">{checks}</span>
            ) : (
              <span className="text-muted-foreground">No flags</span>
            ),
          },
        ]}
      />
    </DrawerSection>
  )
}

const Mono = ({ value }: { value: string | number }) => (
  <span className="block break-all text-right font-mono text-xs">{value}</span>
)

export function TransactionDataSection({ tx, open, onToggle }: { tx: Proposal; open: boolean; onToggle: () => void }) {
  const data = getTechnicalData(tx)
  return (
    <DrawerSection collapsible title="Transaction data" open={open} onOpenChange={() => onToggle()}>
      <div className="space-y-3">
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
        <p className="text-xs text-muted-foreground">
          Cross-verify your transaction data with{' '}
          <ExternalLink href="https://safeutils.openzeppelin.com">Safe Utils</ExternalLink> and{' '}
          <ExternalLink href="https://transaction-decoder.pages.dev">Transaction Decoder</ExternalLink>. Values in this
          preview are placeholders.
        </p>
      </div>
    </DrawerSection>
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
    <DrawerSection collapsible title={replacement ? 'Replace with a transfer' : 'Reject'}>
      <div className="space-y-3 rounded-lg bg-muted p-3">
        <p className="text-sm text-muted-foreground">
          {replacement
            ? `Sends a transfer at nonce #${tx.nonce} instead. It needs signatures and execution. Whichever executes first replaces the other.`
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
    </DrawerSection>
  )
}
