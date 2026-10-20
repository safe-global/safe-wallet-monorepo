import { useState, type ReactNode } from 'react'
import { Check, Copy, Plus } from 'lucide-react'
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
import { formatAuditDateTime, useCopyToClipboard } from '@/components/common/AuditLog'
import Identicon from '@/components/common/Identicon'
import { Avatar, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  getAccount,
  getState,
  getCreatedAt,
  getCreator,
  getSignedAt,
  getRecipientAddress,
  getRecipientName,
  getSignerIdentity,
  getToken,
  getTransactionLabel,
  shortAddress,
} from '../services/model'
import { getYou, isYou } from '../services/personas'
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

function Address({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="break-all font-mono text-xs">{value}</span>
      {!value.includes('…') && <CopyValue value={value} label={label} />}
    </div>
  )
}

const ORDER_LABELS = { market: 'Market', limit: 'Limit', twap: 'TWAP' } as const

const getAmountValue = (amount: string) => Number(amount.split(' ')[0].replace(/,/g, ''))
const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">{children}</code>
)

// `extended` adds the fields of the production expanded view. Next steps drawer only.
export const getDetailItems = (proposal: Proposal, extended = false): { label: string; content: ReactNode }[] => {
  const account = getAccount(proposal)
  const { kind, amount } = proposal
  const address = getRecipientAddress(proposal)
  const addressItem = address ? [{ label: 'Address', content: <Address value={address} label="address" /> }] : []
  const thisSafe = { label: 'Recipient', content: 'This Safe account' }
  switch (kind.type) {
    case 'transfer':
      return [
        kind.toSelf ? thisSafe : { label: 'Recipient', content: getRecipientName(proposal) },
        ...addressItem,
        { label: 'Token', content: getToken(amount) },
      ]
    case 'batch':
      return [
        ...(kind.delegateCall
          ? [
              {
                label: 'Operation',
                content:
                  kind.delegateCall === 'trusted' ? (
                    <Badge variant="outline">Delegate call</Badge>
                  ) : (
                    <Badge variant="warning">Unexpected delegate call</Badge>
                  ),
              },
            ]
          : []),
        {
          label: 'Call',
          content: (
            <span>
              <Code>multiSend</Code> on {getRecipientName(proposal)}
            </span>
          ),
        },
        ...addressItem,
        ...(amount ? [{ label: 'Total value', content: amount }] : []),
      ]
    case 'contract':
      return [
        {
          label: 'Call',
          content: (
            <span className="flex flex-wrap items-center gap-1.5 md:justify-end">
              <Code>{kind.method}</Code> on {kind.contract}
              <Badge variant={kind.verified ? 'outline' : 'warning'}>{kind.verified ? 'Verified' : 'Unverified'}</Badge>
            </span>
          ),
        },
        ...addressItem,
        ...(amount ? [{ label: 'Value', content: amount }] : []),
      ]
    case 'swap': {
      const price = getAmountValue(kind.buy) / getAmountValue(kind.sell)
      return [
        { label: 'Order', content: `${ORDER_LABELS[kind.order]} sell order` },
        {
          label: kind.order === 'market' ? 'Price' : 'Limit price',
          content: `1 ${getToken(kind.sell)} = ${price.toLocaleString('en-US', { maximumSignificantDigits: 4 })} ${getToken(kind.buy)}`,
        },
        { label: 'Expiry', content: kind.expiry },
        { label: 'Status', content: kind.expired ? 'Expired' : 'Open' },
        ...(extended
          ? [
              { label: 'Filled', content: '0%' },
              { label: 'Surplus', content: 'Shown once the order fills' },
              { label: 'Total fees', content: 'Shown once the order fills' },
              {
                label: 'Order ID',
                content: (
                  <Address
                    value={`0x${proposal.id.replace(/\W/g, '').padEnd(12, '0').slice(0, 12)}…`}
                    label="order ID"
                  />
                ),
              },
            ]
          : []),
      ]
    }
    case 'bridge':
      return [
        { label: 'From', content: account.network },
        { label: 'To', content: kind.destination ?? `Unknown network · chain ${kind.destinationChainId}` },
        thisSafe,
        { label: 'Fees', content: kind.fees },
        { label: 'Via', content: getRecipientName(proposal) },
      ]
    case 'settings': {
      const { change } = kind
      if (change.kind === 'addOwner')
        return [
          { label: 'Add signer', content: getRecipientName(proposal) },
          ...addressItem,
          {
            label: extended ? 'Required confirmations for new transactions' : 'Required confirmations',
            content: `${account.threshold} (unchanged)`,
          },
        ]
      if (change.kind === 'changeThreshold')
        return [
          {
            label: extended ? 'Required confirmations for new transactions' : 'Required confirmations',
            content: `${account.threshold} → ${change.threshold}`,
          },
        ]
      return [{ label: 'Change', content: getTransactionLabel(proposal) }, ...addressItem]
    }
    case 'nested':
      return [
        {
          label: 'Call',
          content: (
            <span>
              <Code>approveHash</Code> on {kind.parentSafe}
            </span>
          ),
        },
        { label: 'Nested transaction', content: `#${kind.parentNonce} on ${kind.parentSafe}` },
        ...addressItem,
      ]
    case 'rejection':
      return [
        {
          label: 'Effect',
          content: `Sends no funds. Executing it replaces every awaiting transaction with nonce #${proposal.nonce}.`,
        },
        { label: 'Cost', content: 'Gas only' },
      ]
  }
}

export function ProposalDetails({ proposal }: { proposal: Proposal }) {
  const { kind } = proposal
  return (
    <section className="space-y-3">
      <DrawerList
        mobileStack
        items={[
          ...(proposal.origin === 'replacement' ? [{ label: 'Proposed as', content: 'Replacement' }] : []),
          ...getDetailItems(proposal),
        ]}
      />
      {kind.type === 'contract' && kind.steps && (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium">What it does</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm">
            {kind.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {kind.type === 'batch' && (
        <div className="space-y-1">
          <p className="text-sm font-medium">All actions ({kind.actions.length})</p>
          <BatchActions actions={kind.actions} />
        </div>
      )}
    </section>
  )
}

export function BatchActions({ actions }: { actions: BatchAction[] }) {
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

export function ProposalAdvanced({ proposal }: { proposal: Proposal }) {
  const account = getAccount(proposal)
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
              { label: 'To', content: proposal.recipient },
              { label: 'Value', content: proposal.amount || '0' },
              {
                label: 'Operation',
                content:
                  proposal.kind.type === 'batch' && proposal.kind.delegateCall ? '1 (delegate call)' : '0 (call)',
              },
              { label: 'Nonce', content: proposal.nonce },
              { label: 'Safe', content: <Address value={account.iconAddress} label="sample Safe address" /> },
              ...['Data', 'SafeTxGas', 'BaseGas', 'GasPrice', 'GasToken', 'RefundReceiver', 'Signature bytes'].map(
                (label) => ({ label, content: 'Not supplied' }),
              ),
            ]}
          />
        </TabsContent>
        <TabsContent value="hashes">
          <p className="text-sm text-muted-foreground">
            Domain hash, message hash, and Safe transaction hash are not supplied. The on-chain transaction hash is
            available only after execution.
          </p>
        </TabsContent>
        <TabsContent value="json">
          <p className="mb-2 text-xs text-muted-foreground">
            Prototype summary data, not a signable transaction payload.
          </p>
          <pre className="max-w-full overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(raw, null, 2)}</pre>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">
        Decoded contract calls and verification links require the full transaction payload. In the live wallet these
        views use the existing transaction decoder and receipt components.
      </p>
    </section>
  )
}

const getSigners = (proposal: Proposal, persona: Persona) => {
  const signed = proposal.signers.filter((name) => getAccount(proposal).owners.includes(name))
  return { signed, youNeedToSign: getState(proposal, persona).canSign }
}

function SignerIdentity({ id, persona }: { id: string; persona: Persona }) {
  const { name, address } = getSignerIdentity(id)
  const [copied, copy] = useCopyToClipboard(address)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={<button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={copy} />}
      >
        <Identicon address={address} size={24} />
        <span className="min-w-0">
          <span className="block truncate text-sm">
            {name ?? shortAddress(address)}
            {isYou(id, persona) && ' (you)'}
          </span>
          {name && (
            <span className="block truncate font-mono text-xs text-muted-foreground">{shortAddress(address)}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : 'Click to copy address'}</TooltipContent>
    </Tooltip>
  )
}

export function SignerList({ proposal, persona }: { proposal: Proposal; persona: Persona }) {
  const { signed, youNeedToSign } = getSigners(proposal, persona)
  const creator = getCreator(proposal)
  return (
    <ul aria-label="Signers" className="flex flex-col gap-2">
      <li className="flex min-h-9 items-center gap-2 text-sm">
        <Avatar size="xs" aria-hidden="true">
          <AvatarFallback>
            <Plus className="size-3.5" />
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate">{creator ? `Created by ${creator}` : 'Created'}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatAuditDateTime(getCreatedAt(proposal))}
        </span>
      </li>
      {signed.map((id, index) => (
        <li key={id} className="flex min-h-9 items-center gap-2">
          <SignerIdentity id={id} persona={persona} />
          <span className="flex shrink-0 flex-col items-end text-xs">
            <span className="flex items-center gap-1 text-success-strong">
              <Check className="size-3.5" aria-hidden="true" />
              Signed
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatAuditDateTime(getSignedAt(proposal, index))}
            </span>
          </span>
        </li>
      ))}
      {youNeedToSign && (
        <li className="flex min-h-9 items-center gap-2">
          <div className="flex min-w-0 flex-1 opacity-50">
            <SignerIdentity id={getYou(persona)!} persona={persona} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">Your signature needed</span>
        </li>
      )}
    </ul>
  )
}

export function CopyTransactionLink({ proposal }: { proposal: Proposal }) {
  const href =
    typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}?tx=${proposal.id}`
  const [copied, copy] = useCopyToClipboard(href)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <Button
            variant="ghost-muted"
            size="icon-sm"
            aria-label={copied ? 'Transaction link copied' : 'Copy transaction link'}
            onClick={copy}
          />
        }
      >
        <Copy />
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : 'Copy transaction link'}</TooltipContent>
    </Tooltip>
  )
}
