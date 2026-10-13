import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@safe-global/views/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@safe-global/views/components/ui/tabs'
import { DrawerList } from '@/components/common/Drawer'
import { AuditLog, AuditLogHeader, AuditRow, useCopyToClipboard } from '@/components/common/AuditLog'
import { getAccount, getOutstandingSigners, getState, getTypeLabel, isSettingsChange } from '../services/model'
import type { BatchAction, Persona, Proposal } from '../types'

const INITIAL_ACTIONS = 10

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, copy] = useCopyToClipboard(value)
  return (
    <Button variant="ghost" size="icon-xs" aria-label={copied ? `${label} copied` : `Copy ${label}`} onClick={copy}>
      <Copy />
    </Button>
  )
}

export function ProposalSummary({ proposal }: { proposal: Proposal }) {
  const account = getAccount(proposal)
  return (
    <DrawerList
      mobileStack
      items={[
        { label: 'Recipient', content: proposal.recipient },
        {
          label: 'Safe address',
          content: (
            <div className="flex min-w-0 items-center gap-1">
              <span className="break-all font-mono text-xs">{account.iconAddress}</span>
              <CopyValue value={account.iconAddress} label="sample Safe address" />
            </div>
          ),
        },
      ]}
    />
  )
}

function BatchActions({ actions }: { actions: BatchAction[] }) {
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])
  const shown = showAll ? actions : actions.slice(0, INITIAL_ACTIONS)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => {
            setShowAll(true)
            setExpanded(actions.map((_, index) => String(index)))
          }}
        >
          Expand all
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <Accordion multiple value={expanded} onValueChange={setExpanded}>
        {shown.map((action, index) => (
          <AccordionItem key={`${index}-${action.to}`} value={String(index)}>
            <AccordionTrigger>
              <span className="min-w-0 truncate">
                <span className="tabular-nums text-muted-foreground">{index + 1}.</span> {action.method} · {action.to}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <DrawerList
                mobileStack
                items={[
                  { label: 'Method', content: action.method },
                  { label: 'To', content: action.to },
                  { label: 'Value', content: action.value ?? '0' },
                ]}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {!showAll && actions.length > INITIAL_ACTIONS && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAll(true)}>
          Show all {actions.length} actions
        </Button>
      )}
    </div>
  )
}

export function ProposalTransactionDetails({ proposal }: { proposal: Proposal }) {
  const account = getAccount(proposal)
  const change = proposal.settingsChange
  const actions = proposal.actions ?? []
  const type = proposal.kind === 'replacement' ? 'Replacement' : getTypeLabel(proposal)
  const settingsItems = change
    ? change.kind === 'addOwner'
      ? [
          { label: 'Change', content: 'Add signer' },
          { label: 'New signer', content: proposal.recipient },
          { label: 'Threshold', content: `${account.threshold} signatures (unchanged)` },
        ]
      : [
          { label: 'Change', content: 'Change threshold' },
          { label: 'Threshold', content: `${account.threshold} → ${change.threshold} signatures` },
        ]
    : [{ label: 'Change', content: 'Safe settings' }]
  const transferItems = [
    { label: 'Destination', content: proposal.recipient },
    ...(proposal.amount ? [{ label: 'Value', content: proposal.amount }] : []),
    ...(actions.length || proposal.recipient.includes('Batch')
      ? [{ label: 'Actions', content: actions.length ? `${actions.length} actions` : 'Not supplied' }]
      : []),
  ]
  const raw = {
    safe: account.iconAddress,
    nonce: proposal.nonce,
    recipientSummary: proposal.recipient,
    amountSummary: proposal.amount,
    calldata: null,
    operation: null,
    safeTxGas: null,
    baseGas: null,
    gasPrice: null,
    gasToken: null,
    refundReceiver: null,
    signatures: null,
  }
  return (
    <section className="space-y-3">
      <DrawerList
        mobileStack
        items={[{ label: 'Type', content: type }, ...(isSettingsChange(proposal) ? settingsItems : transferItems)]}
      />
      <Accordion defaultValue={[]}>
        {actions.length > 0 && (
          <AccordionItem value="actions">
            <AccordionTrigger>Actions ({actions.length})</AccordionTrigger>
            <AccordionContent>
              <BatchActions actions={actions} />
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced transaction data</AccordionTrigger>
          <AccordionContent>
            <Tabs defaultValue="data">
              <TabsList aria-label="Advanced transaction views">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="hashes">Hashes</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="data">
                <DrawerList
                  mobileStack
                  items={[
                    { label: 'Nonce', content: proposal.nonce },
                    ...[
                      'Calldata',
                      'Operation',
                      'SafeTxGas',
                      'BaseGas',
                      'GasPrice',
                      'GasToken',
                      'RefundReceiver',
                      'Signature bytes',
                    ].map((label) => ({ label, content: 'Not supplied' })),
                  ]}
                />
              </TabsContent>
              <TabsContent value="hashes">
                <p className="text-sm text-muted-foreground">
                  Domain hash, message hash, and Safe transaction hash are not supplied. The on-chain transaction hash
                  is available only after execution.
                </p>
              </TabsContent>
              <TabsContent value="json">
                <p className="mb-2 text-xs text-muted-foreground">
                  Prototype summary data, not a signable transaction payload.
                </p>
                <pre className="max-w-full overflow-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(raw, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
            <p className="mt-3 text-xs text-muted-foreground">
              Decoded contract calls and verification links require the full transaction payload. In the live wallet
              these views use the existing transaction decoder and receipt components.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

export function ProposalActivity({
  proposal,
  persona,
  compact = false,
}: {
  proposal: Proposal
  persona: Persona
  compact?: boolean
}) {
  const state = getState(proposal, persona)
  const account = getAccount(proposal)
  const confirmations = proposal.signers.filter((name) => account.owners.includes(name))
  return (
    <section className="space-y-3">
      <AuditLog>
        {!compact && (
          <AuditLogHeader
            chip={
              <Badge variant="outline">
                {confirmations.length}/{account.threshold}
              </Badge>
            }
          />
        )}
        <AuditRow label={`Created · ${proposal.age}`} actionType="created" />
        {confirmations.map((name, index) => (
          <AuditRow key={name} label={`Signed (${index + 1}/${account.threshold})`} actionType="signed" actor={name} />
        ))}
        <AuditRow
          label={
            state.ready
              ? 'Ready to execute'
              : state.waiting
                ? `Waiting on #${account.nextNonce}`
                : 'Waiting on signatures'
          }
          actionType={state.ready ? 'confirmed' : 'pending'}
          isLast
        />
      </AuditLog>
      {!compact && state.missing > 0 && (
        <p className="text-xs text-muted-foreground">
          Needs {state.missing} more · {getOutstandingSigners(proposal).join(', ')}
        </p>
      )}
      {!compact && (
        <>
          <p className="text-xs text-muted-foreground">
            Signer addresses and exact event timestamps are not supplied in this sample.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ExternalLink />
              Open in Safe
            </Button>
            <span className="text-xs text-muted-foreground">Live transaction link required</span>
          </div>
        </>
      )}
    </section>
  )
}
