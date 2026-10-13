import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Repeat2,
  Settings,
  CircleX,
  ChevronDown,
  ChevronUp,
  Check,
  CircleCheck,
  PenLine,
  ListFilter,
  ListTree,
  X,
  CircleHelp,
  Clock3,
  Copy,
  FlaskConical,
  LockKeyhole,
  StickyNote,
  Users,
  Layers,
  ShieldCheck,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@safe-global/views/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@safe-global/views/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@safe-global/views/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@safe-global/views/components/ui/popover'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Input } from '@safe-global/views/components/ui/input'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@safe-global/views/components/ui/accordion'
import { PrototypeFrame } from './PrototypeFrame'
import { ProposalSummary, ProposalTransactionDetails, ProposalActivity } from './ProposalDetails'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import { Drawer, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter } from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import useMediaQuery from '@/hooks/useMediaQuery'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

import {
  accounts as fixtureAccounts,
  getAccount,
  getAction,
  getConflicts,
  getOutstandingSigners,
  getPrimaryStatus,
  getState,
  matchesFilter,
  clusterByNonce,
  getSignatureCount,
  getStatusTone,
  TYPE_LABELS,
  type TypeLabel,
  getAmountLabel,
  getTransactionLabel,
  getTypeLabel,
  getRowAction,
  getStatusLabel,
} from '../services/model'
import {
  applyPreviewAction,
  createPreviewQueue,
  executePreviewBatches,
  getBulkExecutable,
  proposePreviewAlternative,
  type PreviewAction,
} from '../services/queue'
import type { Direction, Filter, Persona, Proposal, Scenario } from '../types'

const scenarios: { value: Scenario; label: string }[] = [
  { value: 'everyday', label: 'Everyday queue' },
  { value: 'conflict', label: 'Competing proposals' },
  { value: 'conflict-heavy', label: 'Many competing' },
  { value: 'gap', label: 'Missing dependency' },
  { value: 'partial', label: 'Partial loading' },
  { value: 'empty', label: 'Empty workspace' },
]
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready to execute' },
  { value: 'sign', label: 'Ready to sign' },
  { value: 'awaiting', label: 'Waiting on signatures' },
  { value: 'waiting', label: 'Waiting on transactions' },
]

const TYPE_ICONS: Record<TypeLabel, LucideIcon> = {
  Send: ArrowUpRight,
  Receive: ArrowDownLeft,
  Swap: Repeat2,
  Batch: Layers,
  Update: Settings,
  'On-chain rejection': CircleX,
}
const HISTORY_HOVER: Partial<Record<TypeLabel, string>> = {
  Send: 'group-hover/history:text-destructive group-focus-visible/history:text-destructive',
  Receive: 'group-hover/history:text-success-strong group-focus-visible/history:text-success-strong',
}

function SafeIdentity({
  address,
  size,
  className,
  children,
}: {
  address: string
  size: number
  className: string
  children: ReactNode
}) {
  const avatarRef = useRef<HTMLSpanElement>(null)
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<div className={className} />}>
        <span ref={avatarRef} className="flex shrink-0">
          <Identicon address={address} size={size} />
        </span>
        {children}
      </TooltipTrigger>
      <TooltipContent anchor={avatarRef} className="break-all font-mono">
        {address}
      </TooltipContent>
    </Tooltip>
  )
}

function PanelSection({ value, title, children }: { value: string; title: string; children: ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pb-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default function PendingQueue() {
  const router = useRouter()
  return <PendingQueueView key={String(router.query.scenario ?? 'everyday')} />
}

function PendingQueueView() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isShortViewport = useMediaQuery('(max-height: 599px)')
  const collapseAudit = isMobile || isShortViewport
  const isWide = useMediaQuery('(min-width: 1280px)')
  const direction: Direction = router.query.option === 'inbox' ? 'inbox' : 'queues'
  const scenario = scenarios.find((item) => item.value === router.query.scenario)?.value ?? 'everyday'
  const persona: Persona = router.query.persona === 'observer' ? 'observer' : 'owner'
  const hypernative = router.query.hn === 'out' || router.query.hn === 'none' ? router.query.hn : 'in'
  const [queue, setQueue] = useState(() => createPreviewQueue(scenario))
  const accounts = fixtureAccounts.map((account) => ({ ...account, nextNonce: queue.nextNonces[account.id] }))
  const [pageTab, setPageTab] = useState('queue')
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'safe'>(
    router.query.groupBy === 'status' || router.query.groupBy === 'safe' ? router.query.groupBy : 'none',
  )
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const [accountFilter, setAccountFilter] = useState<string[]>(accounts.map((account) => account.id))
  const networks = [...new Set(accounts.map((account) => account.network))]
  const [networkFilter, setNetworkFilter] = useState<string[]>(networks)
  const [typeFilter, setTypeFilter] = useState<string[]>([...TYPE_LABELS])
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<Filter>('all')
  const [review, setReview] = useState<Proposal | null>(null)
  const [reject, setReject] = useState(false)
  const [pendingAction, setPendingAction] = useState<PreviewAction | null>(null)
  const [replacement, setReplacement] = useState<{ recipient: string; amount: string } | null>(null)
  const [reviewSections, setReviewSections] = useState<string[]>(['summary'])
  const [feedback, setFeedback] = useState('')
  const [copied, setCopied] = useState(false)
  const [replaceHover, setReplaceHover] = useState<string | null>(null)
  const [bulkScope, setBulkScope] = useState<string | null>(null)
  const [bulkHover, setBulkHover] = useState<string[]>([])
  const items = queue.items
  const bulkBatches = getBulkExecutable(items)
  const bulkIds = bulkBatches.flatMap((batch) => batch.proposals.map((tx) => tx.id))
  const reviewBatches =
    bulkScope === null ? [] : bulkBatches.filter((batch) => bulkScope === 'all' || batch.account.id === bulkScope)
  const executableBatches = reviewBatches.filter((batch) => batch.proposals.length > 0)
  const executableCount = executableBatches.reduce((total, batch) => total + batch.proposals.length, 0)
  const runBulkExecute = () => {
    const count = executableCount
    setQueue(executePreviewBatches(queue, executableBatches))
    setBulkScope(null)
    setBulkHover([])
    setFeedback(
      `${count} ${count === 1 ? 'transaction' : 'transactions'} executed in this preview across ${executableBatches.length} ${executableBatches.length === 1 ? 'Safe' : 'Safes'}.`,
    )
  }
  const scoped = items.filter((tx) => accountFilter.includes(tx.account))
  const visible = scoped.filter(
    (tx) =>
      networkFilter.includes(getAccount(tx).network) &&
      typeFilter.includes(getTypeLabel(tx)) &&
      matchesFilter(tx, stateFilter, persona) &&
      `${getTransactionLabel(tx)} ${tx.recipient} ${tx.amount} ${tx.nonce} ${getAccount(tx).name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const setOption = (changes: Record<string, string>) => {
    setReview(null)
    setFeedback('')
    void router.replace({ pathname: router.pathname, query: { ...router.query, ...changes } }, undefined, {
      shallow: true,
    })
  }
  const reviewTx = (tx: Proposal) => {
    setReject(false)
    setPendingAction(null)
    setReplacement(null)
    setReviewSections(['summary'])
    setFeedback('')
    setReview(tx)
  }

  const performAction = (action: PreviewAction) => {
    if (!review) return
    const updated = applyPreviewAction(queue, review.id, persona, action)
    if (updated === queue) {
      setFeedback('This action is no longer available. Review the current queue state.')
      setPendingAction(null)
      return
    }
    setQueue(updated)
    setPendingAction(null)
    if (action === 'sign') {
      setReview(updated.items.find((item) => item.id === review.id) ?? null)
      setFeedback('Signature added in this preview. Execution may still need other signatures or earlier transactions.')
    } else {
      setReview(null)
      setFeedback(`${getTransactionLabel(review)} executed in this preview. Next nonce is #${review.nonce + 1}.`)
    }
  }
  const proposeAlternative = (kind: 'cancellation' | 'replacement') => {
    if (!review) return
    const result = proposePreviewAlternative(queue, review.id, persona, kind, replacement ?? undefined)
    if (!result.proposal) return
    setQueue(result.queue)
    reviewTx(result.proposal)
    setFeedback(
      'Competing proposal created with your preview signature. The original remains valid until one executes.',
    )
  }

  const resetFilters = () => {
    setAccountFilter(accounts.map((account) => account.id))
    setNetworkFilter(networks)
    setTypeFilter([...TYPE_LABELS])
    setSearch('')
    setStateFilter('all')
  }
  const groups: { id: string; title: string; subtitle: string; items: Proposal[]; next?: number }[] =
    direction === 'queues'
      ? accounts.map((account) => ({
          id: account.id,
          title: account.name,
          subtitle: `${account.network} · ${account.address} · ${account.threshold} signatures required`,
          items: visible.filter((tx) => tx.account === account.id).sort((a, b) => a.nonce - b.nonce),
          next: account.nextNonce,
        }))
      : [
          {
            id: 'ready',
            title: 'Ready to move',
            subtitle: 'Execute a proposal or add the final signature and execute.',
            items: visible.filter((tx) => getState(tx, persona).ready || getState(tx, persona).finalSignature),
          },
          {
            id: 'sign',
            title: 'Your signature can help',
            subtitle: 'Review now, even when execution must wait.',
            items: visible.filter((tx) => getState(tx, persona).canSign && !getState(tx, persona).finalSignature),
          },
          {
            id: 'waiting',
            title: 'Follow up with the team',
            subtitle: 'Inspect dependencies and see whose approval is still needed.',
            items: visible.filter((tx) => !getState(tx, persona).canSign && !getState(tx, persona).ready),
          },
        ]

  const sections = (
    groupBy === 'safe'
      ? accounts
          .filter((account) => accountFilter.includes(account.id))
          .map((account) => ({
            id: `safe-${account.id}`,
            category: 'safe',
            label: account.name,
            next: account.nextNonce,
            account,
            items: visible.filter((tx) => tx.account === account.id).sort((a, b) => a.nonce - b.nonce),
          }))
      : groupBy === 'none'
        ? [
            {
              id: 'ungrouped',
              category: 'all',
              label: 'Pending',
              next: undefined,
              account: undefined,
              items: groups.flatMap((group) => group.items),
            },
          ]
        : filters
            .filter((filter) => filter.value !== 'all')
            .map((filter) => ({
              id: `status-${filter.value}`,
              category: filter.value,
              label: filter.label,
              next: undefined,
              account: undefined,
              items: groups
                .flatMap((group) => group.items)
                .filter((tx) => getPrimaryStatus(tx, persona) === filter.value),
            }))
  ).map((section) => ({ ...section, items: clusterByNonce(section.items) }))

  const columns = [
    'Type',
    ...(groupBy !== 'safe' ? ['Safe'] : []),
    ...(groupBy !== 'safe' && isWide ? ['Network'] : []),
    'Signatures',
    ...(isWide ? ['Note'] : []),
    'Status',
    'Action',
  ]
  const columnCount = columns.length
  const reviewOrder = sections
    .filter((section) => !(groupBy !== 'none' && collapsedSections.includes(section.id)))
    .flatMap((section) => section.items)
  const reviewIndex = review ? reviewOrder.findIndex((tx) => tx.id === review.id) : -1
  const stepReview = (offset: number) => {
    const next = reviewIndex >= 0 ? reviewOrder[reviewIndex + offset] : undefined
    if (next) reviewTx(next)
  }

  useEffect(() => {
    if (!review) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'j') stepReview(1)
      if (event.key === 'k') stepReview(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => {
    document.querySelector('tr[data-state="selected"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [review?.id])
  const columnWidths: Record<string, string | undefined> = {
    Type: isWide ? 'w-56' : 'w-44',
    Safe: isWide ? 'w-[18%]' : 'w-[22%]',
    Network: 'w-16',
    Signatures: 'w-24',
    Note: 'w-16',
    Action: 'w-24',
  }

  const renderNote = (tx: Proposal) => (
    <div className="space-y-2 rounded-lg bg-muted p-3">
      <Badge variant="outline">
        <LockKeyhole />
        Off-chain note
      </Badge>
      <p className="text-sm leading-relaxed">{tx.note?.text ?? 'No note was added to this proposal.'}</p>
      {tx.note && (
        <p className="mt-2 text-xs text-muted-foreground">
          {tx.note.author} · {tx.note.date}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Visible to Acme Inc members with access to {getAccount(tx).name}. This is the author’s context. It is not a
        verified approval and is not part of the signed transaction.
      </p>
    </div>
  )
  const renderConditions = (tx: Proposal) => {
    const state = getState(tx, persona)
    const account = getAccount(tx)
    return (
      <ul className="space-y-2 rounded-lg bg-muted p-3 text-sm">
        <li className="flex items-center gap-2">
          {state.missing ? <Users className="size-4" /> : <Check className="size-4" />}
          {state.missing
            ? `${state.missing} more ${state.missing === 1 ? 'signature' : 'signatures'} needed`
            : 'Signature threshold met'}
          {tx.signers.includes('Dev') && ' · You signed'}
        </li>
        <li className="flex items-center gap-2">
          {state.waiting ? <Clock3 className="size-4" /> : <Check className="size-4" />}
          {state.waiting
            ? `Execution waits for earlier nonces, starting at #${account.nextNonce}.`
            : `Nonce #${tx.nonce} is next in this Safe.`}
        </li>
        {getConflicts(tx, items).length > 0 && (
          <li className="flex items-center gap-2">
            <ListFilter className="size-4" />A competing proposal uses this nonce. Only one can execute.
          </li>
        )}
      </ul>
    )
  }

  const ReviewIcon = TYPE_ICONS[review ? getTypeLabel(review) : 'Send']
  return (
    <div className="min-h-screen bg-secondary text-foreground">
      <PrototypeFrame>
        <main className="min-w-0 px-6 pb-8 pt-5">
          <Typography as="h1" variant="h3" className="mb-6">
            Transactions
          </Typography>
          {feedback && !review && (
            <p role="status" className="mb-4 text-sm">
              {feedback}
            </p>
          )}
          <Tabs value={pageTab} onValueChange={(value) => setPageTab(String(value))}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <TabsList
                variant="underline"
                tone="brand"
                aria-label="Transaction views"
                // eslint-disable-next-line no-restricted-syntax -- Prototype-only text-width tabs; shared tab geometry stays unchanged until this design is chosen.
                className="h-11! w-auto! gap-8!"
              >
                {[
                  ['queue', 'Queue'],
                  ['history', 'History'],
                  ['messages', 'Messages'],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    // eslint-disable-next-line no-restricted-syntax -- Same prototype-only tab geometry as the list above.
                    className="h-11! flex-none items-end border-0 px-0! pt-0! pb-2.5! font-medium!"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {pageTab === 'queue' && (
                <div className="flex flex-wrap items-center gap-3">
                  {hypernative === 'in' && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-4 text-success-strong" aria-hidden="true" />
                      Logged in to Hypernative
                    </span>
                  )}
                  {hypernative === 'out' && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldAlert className="size-4 text-warning-strong" aria-hidden="true" />
                      Hypernative not connected
                      <Button size="2xs" variant="outline">
                        Log in
                      </Button>
                    </span>
                  )}
                  {bulkIds.length > 1 && (
                    <Tooltip delay={150}>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            onClick={() => setBulkScope('all')}
                            onMouseEnter={() => setBulkHover(bulkIds)}
                            onMouseLeave={() => setBulkHover([])}
                            onFocus={() => setBulkHover(bulkIds)}
                            onBlur={() => setBulkHover([])}
                          />
                        }
                      >
                        Bulk execute {bulkIds.length} transactions
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-normal">
                        Only fully signed transactions with consecutive nonces are included, as one batch per Safe.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
            <TabsContent value="queue">
              {scenario === 'partial' && (
                <Alert variant="warning" outlined={false} className="mb-5">
                  <AlertSeverityIcon variant="warning" />
                  <AlertTitle>Grants is unavailable</AlertTitle>
                  <AlertDescription>Showing proposals from 2 of 3 Safes. Counts are partial.</AlertDescription>
                  <AlertAction>
                    <Button variant="outline" size="sm" onClick={() => setOption({ scenario: 'everyday' })}>
                      Retry loading
                    </Button>
                  </AlertAction>
                </Alert>
              )}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <SearchInput
                  className="min-w-48 flex-1"
                  aria-label="Find a proposal"
                  placeholder="Search transactions…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onClear={() => setSearch('')}
                />
                {groupBy !== 'none' && (
                  <div className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-card pl-3 shadow-xs">
                    <ListTree className="size-4 text-muted-foreground" aria-hidden="true" />
                    <Select
                      value={groupBy}
                      items={{ status: 'Status', safe: 'Safe' }}
                      onValueChange={(value) => value && setGroupBy(value)}
                    >
                      <SelectTrigger variant="ghost" size="sm" aria-label="Grouped by">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="safe">Safe</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon-sm"
                      variant="ghost-muted"
                      className="ml-1"
                      aria-label="Remove grouping"
                      onClick={() => setGroupBy('none')}
                    >
                      <X />
                    </Button>
                  </div>
                )}
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" />}>
                    <ListFilter />
                    Filters
                    {(accountFilter.length !== accounts.length ||
                      networkFilter.length !== networks.length ||
                      typeFilter.length !== TYPE_LABELS.length ||
                      stateFilter !== 'all') && (
                      <Badge variant="secondary" size="default" shape="pill">
                        Active
                      </Badge>
                    )}
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">Filters</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          resetFilters()
                          setGroupBy('none')
                        }}
                      >
                        Clear all
                      </Button>
                    </div>
                    <Accordion multiple defaultValue={['accounts']}>
                      <AccordionItem value="accounts">
                        <AccordionTrigger>Safe account</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pb-3">
                            {accounts.map((account) => (
                              <label key={account.id} className="flex items-center gap-3 text-sm">
                                <Checkbox
                                  aria-label={account.name}
                                  checked={accountFilter.includes(account.id)}
                                  onCheckedChange={(checked) =>
                                    setAccountFilter(
                                      checked
                                        ? [...accountFilter, account.id]
                                        : accountFilter.filter((id) => id !== account.id),
                                    )
                                  }
                                />
                                {account.name}
                              </label>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="networks">
                        <AccordionTrigger>Network</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pb-3">
                            {networks.map((network) => (
                              <label key={network} className="flex items-center gap-3 text-sm">
                                <Checkbox
                                  aria-label={network}
                                  checked={networkFilter.includes(network)}
                                  onCheckedChange={(checked) =>
                                    setNetworkFilter(
                                      checked
                                        ? [...networkFilter, network]
                                        : networkFilter.filter((value) => value !== network),
                                    )
                                  }
                                />
                                {network}
                              </label>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="types">
                        <AccordionTrigger>Type</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pb-3">
                            {TYPE_LABELS.map((type) => (
                              <label key={type} className="flex items-center gap-3 text-sm">
                                <Checkbox
                                  aria-label={type}
                                  checked={typeFilter.includes(type)}
                                  onCheckedChange={(checked) =>
                                    setTypeFilter(
                                      checked ? [...typeFilter, type] : typeFilter.filter((value) => value !== type),
                                    )
                                  }
                                />
                                {type}
                              </label>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="status">
                        <AccordionTrigger>Status</AccordionTrigger>
                        <AccordionContent>
                          <Select
                            value={stateFilter}
                            items={filters}
                            onValueChange={(value) => value && setStateFilter(value)}
                          >
                            <SelectTrigger id="state-filter" aria-label="State" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {filters.map((filter) => (
                                <SelectItem key={filter.value} value={filter.value}>
                                  {filter.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="grouping">
                        <AccordionTrigger>Group by</AccordionTrigger>
                        <AccordionContent>
                          <Select
                            value={groupBy}
                            items={{ none: 'None', status: 'Status', safe: 'Safe' }}
                            onValueChange={(value) => value && setGroupBy(value)}
                          >
                            <SelectTrigger id="group-by" aria-label="Group by" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                              <SelectItem value="safe">Safe</SelectItem>
                            </SelectContent>
                          </Select>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </PopoverContent>
                </Popover>
                <Button size="action" aria-label="New transaction">
                  New
                </Button>
              </div>
              {!visible.length && (
                <Empty className="rounded-2xl border border-border bg-card">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Check />
                    </EmptyMedia>
                    <EmptyTitle>
                      <h2>{items.length ? 'No proposals match these filters' : 'Nothing pending'}</h2>
                    </EmptyTitle>
                    <EmptyDescription>
                      {items.length
                        ? 'Try another Safe or clear your filters.'
                        : 'New proposals will appear here for your team to review.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {items.length > 0 && (
                    <EmptyContent>
                      <Button variant="outline" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    </EmptyContent>
                  )}
                </Empty>
              )}
              {visible.length > 0 && (
                <div className="flex flex-col gap-10">
                  {sections.map((section) => {
                    const grouped = groupBy !== 'none'
                    const sectionItems = section.items
                    const collapsed = grouped && collapsedSections.includes(section.id)
                    const safeAccount = section.account
                    const safeBatch = safeAccount
                      ? bulkBatches.find((batch) => batch.account.id === safeAccount.id)
                      : undefined
                    return (
                      <section key={section.id} className="flex flex-col gap-2">
                        {grouped && (
                          <div
                            data-slot="section-header"
                            className="group/section flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/[0.04] has-[:focus-visible]:bg-foreground/[0.04]"
                            onClick={() =>
                              setCollapsedSections(
                                collapsed
                                  ? collapsedSections.filter((id) => id !== section.id)
                                  : [...collapsedSections, section.id],
                              )
                            }
                          >
                            {safeAccount ? (
                              <>
                                <SafeIdentity
                                  address={safeAccount.iconAddress}
                                  size={32}
                                  className="flex min-w-0 items-center gap-3"
                                >
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate">{section.label}</span>
                                    <span className="truncate text-xs font-normal text-muted-foreground">
                                      {safeAccount.network} · <span className="font-mono">{safeAccount.address}</span>
                                    </span>
                                  </span>
                                </SafeIdentity>
                              </>
                            ) : (
                              <>
                                <span
                                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${section.category === 'ready' || section.category === 'sign' ? 'bg-success-subtle text-success-strong' : 'bg-warning-subtle text-warning-strong'}`}
                                  aria-hidden="true"
                                >
                                  {section.category === 'ready' ? (
                                    <CircleCheck className="size-4" strokeWidth={ICON_STROKE} />
                                  ) : section.category === 'sign' ? (
                                    <PenLine className="size-4" strokeWidth={ICON_STROKE} />
                                  ) : section.category === 'waiting' ? (
                                    <Clock3 className="size-4" strokeWidth={ICON_STROKE} />
                                  ) : (
                                    <Users className="size-4" strokeWidth={ICON_STROKE} />
                                  )}
                                </span>
                                {section.label}
                                <Badge variant="outline">{sectionItems.length}</Badge>
                              </>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                              {safeBatch && safeBatch.proposals.length > 1 && (
                                <Button
                                  size="2xs"
                                  variant="outline"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setBulkScope(safeBatch.account.id)
                                  }}
                                >
                                  Bulk execute {safeBatch.proposals.length}
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant="ghost-muted"
                                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${section.label}`}
                                aria-expanded={!collapsed}
                                aria-controls={`section-${section.id}`}
                              >
                                {collapsed ? <ChevronDown /> : <ChevronUp />}
                              </Button>
                            </div>
                          </div>
                        )}
                        <div id={`section-${section.id}`} hidden={collapsed}>
                          <Card radius="xl" size="none">
                            <CardContent>
                              <div className="relative">
                                <Table
                                  aria-label={grouped ? `${section.label} transactions` : 'Pending transactions'}
                                  variant="panel"
                                  className="table-fixed max-md:min-w-[900px]"
                                >
                                  <colgroup>
                                    {columns.map((label) => (
                                      <col key={label} className={columnWidths[label]} />
                                    ))}
                                  </colgroup>
                                  <TableHeader>
                                    <TableRow data-no-hover>
                                      {columns.map((label, index) => (
                                        <TableHead
                                          key={label}
                                          scope="col"
                                          className={`text-xs text-muted-foreground ${index === 0 ? 'max-md:sticky max-md:left-0 max-md:z-20' : ''}`}
                                        >
                                          {label === 'Action' ? (
                                            <span className="sr-only">{label}</span>
                                          ) : (label === 'Safe' && groupBy !== 'safe') ||
                                            (label === 'Status' && !grouped) ? (
                                            <span className="flex items-center gap-1">
                                              {label}
                                              <Tooltip delay={150}>
                                                <TooltipTrigger
                                                  render={
                                                    <Button
                                                      size="icon-xs"
                                                      variant="ghost-muted"
                                                      aria-label={`Group by ${label === 'Safe' ? 'Safe' : 'status'}`}
                                                      onClick={() => setGroupBy(label === 'Safe' ? 'safe' : 'status')}
                                                    />
                                                  }
                                                >
                                                  <ListTree />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  Group by {label === 'Safe' ? 'Safe' : 'status'}
                                                </TooltipContent>
                                              </Tooltip>
                                            </span>
                                          ) : (
                                            label
                                          )}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sectionItems.map((tx) => {
                                      const state = getState(tx, persona)
                                      const conflicts = getConflicts(tx, items)
                                      const sameNonce = (other: Proposal) =>
                                        other.account === tx.account && other.nonce === tx.nonce
                                      const groupSize = sectionItems.filter(sameNonce).length
                                      const startsGroup = groupSize > 1 && sectionItems.find(sameNonce) === tx
                                      const willBeReplaced =
                                        !!replaceHover && conflicts.some((other) => other.id === replaceHover)
                                      const account = getAccount(tx)
                                      const transactionType = getTypeLabel(tx)
                                      const TransactionIcon = TYPE_ICONS[transactionType]
                                      const status = getStatusLabel(tx, persona)
                                      const rowAction = getRowAction(tx, persona)
                                      const signatureCount = getSignatureCount(tx)
                                      const transactionIcon = (
                                        <span
                                          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                                          role="img"
                                          aria-label={transactionType}
                                        >
                                          <TransactionIcon
                                            className="size-4"
                                            strokeWidth={ICON_STROKE}
                                            aria-hidden="true"
                                          />
                                        </span>
                                      )
                                      const noteButton = tx.note && (
                                        <Tooltip delay={150}>
                                          <TooltipTrigger
                                            aria-label={`Note for ${getTransactionLabel(tx)}`}
                                            className="flex shrink-0 items-center text-muted-foreground hover:text-foreground"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              reviewTx(tx)
                                            }}
                                          >
                                            <StickyNote
                                              className="size-4"
                                              strokeWidth={ICON_STROKE}
                                              aria-hidden="true"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-sm whitespace-normal">
                                            <p className="font-medium">Off-chain note</p>
                                            <p className="mt-1 leading-relaxed">{tx.note.text}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )
                                      const openButton = (
                                        <button
                                          className={`flex min-w-0 max-w-full items-center gap-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:underline ${willBeReplaced ? 'text-muted-foreground line-through' : ''}`}
                                          onClick={() => reviewTx(tx)}
                                          aria-label={`Open ${getTransactionLabel(tx)}`}
                                        >
                                          {transactionIcon}
                                          <span className="min-w-0">
                                            <span className="block truncate">{getTypeLabel(tx)}</span>
                                            {getAmountLabel(tx) && (
                                              <span className="mt-0.5 block truncate text-xs font-normal tabular-nums text-muted-foreground">
                                                {getAmountLabel(tx)}
                                              </span>
                                            )}
                                          </span>
                                        </button>
                                      )
                                      return (
                                        <Fragment key={tx.id}>
                                          {startsGroup && (
                                            <TableRow data-no-hover data-no-divider>
                                              <TableCell colSpan={columnCount} className="pt-4 pb-1">
                                                <div className="flex w-max flex-wrap items-center gap-x-2 gap-y-1 text-xs max-md:sticky max-md:left-4 max-md:w-[calc(100vw-5rem)] max-md:whitespace-normal">
                                                  <span
                                                    className="flex size-5 items-center justify-center rounded bg-warning-subtle text-warning-strong"
                                                    aria-hidden="true"
                                                  >
                                                    <ListFilter className="size-3" />
                                                  </span>
                                                  <span className="font-medium">
                                                    Nonce #{tx.nonce} · {conflicts.length + 1} competing proposals
                                                  </span>
                                                  <span className="text-muted-foreground">
                                                    Executing one replaces the others.
                                                  </span>
                                                  <ExternalLink
                                                    href={HelpCenterArticle.CONFLICTING_TRANSACTIONS}
                                                    className="text-muted-foreground"
                                                    noIcon
                                                  >
                                                    Why did this happen?
                                                  </ExternalLink>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                          <TableRow
                                            data-state={review?.id === tx.id ? 'selected' : undefined}
                                            data-conflict-group={groupSize > 1 || undefined}
                                            onClick={() => reviewTx(tx)}
                                            className={`group/transaction relative h-14 cursor-pointer data-[state=selected]:bg-transparent [&:focus-within>td]:bg-muted [&[data-state=selected]>td]:bg-muted [&[data-state=selected]>td:first-child]:rounded-l-lg [&[data-state=selected]>td:last-child]:rounded-r-lg ${bulkHover.includes(tx.id) ? '[&>td]:bg-muted' : ''}`}
                                          >
                                            <>
                                              <TableCell
                                                className={`py-2 max-md:sticky max-md:left-0 max-md:z-10 max-md:border-l-card! max-md:bg-card ${groupSize > 1 ? 'shadow-[inset_2px_0_0_var(--warning-accent)]' : ''}`}
                                              >
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                  {openButton}
                                                  {!isWide && noteButton}
                                                </div>
                                              </TableCell>
                                              {groupBy !== 'safe' && (
                                                <TableCell className="text-xs">
                                                  <SafeIdentity
                                                    address={account.iconAddress}
                                                    size={24}
                                                    className="flex min-w-0 items-center gap-2"
                                                  >
                                                    <div className="min-w-0">
                                                      <p className="truncate">{account.name}</p>
                                                      {!isWide && (
                                                        <p className="truncate text-muted-foreground">
                                                          {account.network}
                                                        </p>
                                                      )}
                                                      <p className="truncate font-mono text-muted-foreground">
                                                        {account.address}
                                                      </p>
                                                    </div>
                                                  </SafeIdentity>
                                                </TableCell>
                                              )}
                                              {groupBy !== 'safe' && isWide && (
                                                <TableCell>
                                                  <Tooltip delay={150}>
                                                    <TooltipTrigger
                                                      aria-label={account.network}
                                                      onClick={(event) => event.stopPropagation()}
                                                    >
                                                      <Avatar size="xs">
                                                        <AvatarImage
                                                          src={`https://safe-transaction-assets.safe.global/chains/${account.chainId}/chain_logo.png`}
                                                          alt={account.network}
                                                        />
                                                        <AvatarFallback>{account.network[0]}</AvatarFallback>
                                                      </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{account.network}</TooltipContent>
                                                  </Tooltip>
                                                </TableCell>
                                              )}
                                              <TableCell className="py-1">
                                                <Tooltip delay={150}>
                                                  <TooltipTrigger
                                                    aria-label={`${signatureCount} of ${account.threshold} signatures`}
                                                    className="text-xs tabular-nums"
                                                    onClick={(event) => event.stopPropagation()}
                                                  >
                                                    {signatureCount}/{account.threshold}
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <div className="space-y-1">
                                                      <p>
                                                        {state.missing
                                                          ? `${state.missing} more ${state.missing === 1 ? 'signature' : 'signatures'} needed`
                                                          : 'Signature threshold met'}
                                                      </p>
                                                      {tx.signers.length > 0 && <p>Signed: {tx.signers.join(', ')}</p>}
                                                      {state.missing > 0 && (
                                                        <p>Not yet signed: {getOutstandingSigners(tx).join(', ')}</p>
                                                      )}
                                                    </div>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TableCell>
                                              {isWide && <TableCell>{noteButton}</TableCell>}
                                              <TableCell>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <Badge
                                                    variant={getStatusTone(tx, persona)}
                                                    size="default"
                                                    shape="pill"
                                                  >
                                                    {status}
                                                  </Badge>
                                                  {conflicts.length > 0 && groupSize < 2 && (
                                                    <Badge variant="warning" size="default" shape="pill">
                                                      {conflicts.length + 1} competing proposals
                                                    </Badge>
                                                  )}
                                                  <Badge
                                                    variant="outline"
                                                    size="default"
                                                    shape="pill"
                                                    className="tabular-nums"
                                                    aria-label={`Nonce ${tx.nonce}`}
                                                  >
                                                    #{tx.nonce}
                                                  </Badge>
                                                  <Badge
                                                    variant="outline"
                                                    size="default"
                                                    shape="pill"
                                                    className="text-muted-foreground"
                                                    aria-label={`Proposed ${tx.age}`}
                                                  >
                                                    {tx.age}
                                                  </Badge>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Button
                                                  size="2xs"
                                                  variant="outline"
                                                  className="w-18"
                                                  aria-label={`${rowAction} ${getTransactionLabel(tx)}`}
                                                  onMouseEnter={() => conflicts.length && setReplaceHover(tx.id)}
                                                  onMouseLeave={() => setReplaceHover(null)}
                                                  onFocus={() => conflicts.length && setReplaceHover(tx.id)}
                                                  onBlur={() => setReplaceHover(null)}
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    reviewTx(tx)
                                                  }}
                                                >
                                                  {rowAction}
                                                </Button>
                                              </TableCell>
                                            </>
                                          </TableRow>
                                        </Fragment>
                                      )
                                    })}
                                    {!sectionItems.length && (
                                      <TableRow data-no-hover data-no-divider>
                                        <TableCell
                                          colSpan={columnCount}
                                          className="py-6 text-center text-muted-foreground"
                                        >
                                          No matching proposals
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-card to-transparent md:hidden"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <CircleHelp className="size-4" />A proposal can need your signature and still wait on earlier
                transactions.
              </div>
            </TabsContent>
            <TabsContent value="history">
              <Card radius="xl">
                <CardContent>
                  <Typography variant="paragraph-medium">Transaction history</Typography>
                  {queue.completed.length ? (
                    <ul className="mt-3 space-y-3">
                      {queue.completed.map((tx) => {
                        const type = getTypeLabel(tx)
                        const Icon = TYPE_ICONS[type]
                        const hoverColor =
                          HISTORY_HOVER[type] ??
                          'group-hover/history:text-foreground group-focus-visible/history:text-foreground'
                        return (
                          <li
                            key={tx.id}
                            tabIndex={0}
                            className="group/history flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors ${hoverColor}`}
                                role="img"
                                aria-label={type}
                              >
                                <Icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
                              </span>
                              <span>
                                {getTransactionLabel(tx, true)} · #{tx.nonce} · {getAccount(tx).name}
                              </span>
                            </span>
                            <Badge variant="success">Executed in preview</Badge>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No transactions executed in this preview yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="messages">
              <Card radius="xl">
                <CardContent>
                  <Typography variant="paragraph-medium">Messages</Typography>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Messages are not included in this queue design prototype.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <div className="border-t border-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FlaskConical className="size-4" />
              Preview · simulated
            </div>
            <Tabs value={direction} onValueChange={(value) => setOption({ option: String(value) })}>
              <TabsList aria-label="Design direction">
                <TabsTrigger value="queues">A · Safe queues</TabsTrigger>
                <TabsTrigger value="inbox">B · Action inbox</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="scenario">
                Scenario
              </label>
              <Select
                value={scenario}
                items={scenarios}
                onValueChange={(value) => value && setOption({ scenario: value })}
              >
                <SelectTrigger id="scenario" size="sm" variant="ghost" aria-label="Scenario">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="sr-only" htmlFor="hypernative">
                Hypernative
              </label>
              <Select
                value={hypernative}
                items={{
                  in: 'Hypernative · Connected',
                  out: 'Hypernative · Not connected',
                  none: 'Hypernative · Not eligible',
                }}
                onValueChange={(value) => value && setOption({ hn: value })}
              >
                <SelectTrigger id="hypernative" size="sm" variant="ghost" aria-label="Hypernative">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Hypernative · Connected</SelectItem>
                  <SelectItem value="out">Hypernative · Not connected</SelectItem>
                  <SelectItem value="none">Hypernative · Not eligible</SelectItem>
                </SelectContent>
              </Select>
              <label className="sr-only" htmlFor="persona">
                Preview as
              </label>
              <Select
                value={persona}
                items={{ owner: 'Dev · Signer', observer: 'Alex · Non-owner' }}
                onValueChange={(value) => value && setOption({ persona: value })}
              >
                <SelectTrigger id="persona" size="sm" variant="ghost" aria-label="Preview as">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Dev · Signer</SelectItem>
                  <SelectItem value="observer">Alex · Non-owner</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy this option link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href)
                    setCopied(true)
                  } catch {
                    setCopied(false)
                  }
                }}
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
        </div>

        <Drawer
          resizable
          mobileFullScreen
          open={!!review}
          onClose={() => setReview(null)}
          ariaLabel={review ? getTransactionLabel(review) : undefined}
        >
          <DrawerHeader>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex h-9 items-center gap-2 md:pr-12">
                <Tooltip delay={150}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="surface"
                        size="icon"
                        aria-label="Previous transaction"
                        disabled={reviewIndex <= 0}
                        onClick={() => stepReview(-1)}
                      />
                    }
                  >
                    <ChevronUp />
                  </TooltipTrigger>
                  <TooltipContent>
                    Previous <Kbd>K</Kbd>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delay={150}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="surface"
                        size="icon"
                        aria-label="Next transaction"
                        disabled={reviewIndex < 0 || reviewIndex >= reviewOrder.length - 1}
                        onClick={() => stepReview(1)}
                      />
                    }
                  >
                    <ChevronDown />
                  </TooltipTrigger>
                  <TooltipContent>
                    Next <Kbd>J</Kbd>
                  </TooltipContent>
                </Tooltip>
                <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                  {reviewIndex >= 0 && `${reviewIndex + 1} of ${reviewOrder.length}`}
                </span>
              </div>
              {review && (
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                      aria-hidden="true"
                    >
                      <ReviewIcon className="size-4" strokeWidth={ICON_STROKE} />
                    </span>
                    <div className="min-w-0">
                      <DrawerTitle size="lg">{getTransactionLabel(review)}</DrawerTitle>
                      <p className="truncate text-xs tabular-nums text-muted-foreground">{getAmountLabel(review)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Transaction summary">
                    <span className="mr-1 flex items-center gap-1.5 text-xs">
                      <Identicon address={getAccount(review).iconAddress} size={16} />
                      {getAccount(review).name} · {getAccount(review).network}
                    </span>
                    <Badge variant={getStatusTone(review, persona)} size="default" shape="pill">
                      {getStatusLabel(review, persona)}
                    </Badge>
                    <Badge variant="outline" size="default" shape="pill" className="tabular-nums">
                      #{review.nonce}
                    </Badge>
                    <Badge variant="outline" size="default" shape="pill" className="tabular-nums">
                      {getSignatureCount(review)}/{getAccount(review).threshold} signatures
                    </Badge>
                    <Badge variant="outline" size="default" shape="pill" className="text-muted-foreground">
                      {review.age}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </DrawerHeader>
          <DrawerBody>
            {review && (
              <Accordion multiple value={reviewSections} onValueChange={setReviewSections}>
                <PanelSection value="summary" title="Summary">
                  <ProposalSummary proposal={review} />
                </PanelSection>
                <PanelSection value="conditions" title="What happens next">
                  {renderConditions(review)}
                </PanelSection>
                <PanelSection value="note" title="Workspace note">
                  {renderNote(review)}
                </PanelSection>
                <PanelSection value="details" title="Transaction details">
                  <ProposalTransactionDetails key={review.id} proposal={review} />
                </PanelSection>
                {getState(review, persona).waiting && (
                  <PanelSection value="dependencies" title="Earlier transactions">
                    {Array.from(
                      { length: Math.min(review.nonce - getAccount(review).nextNonce, 10) },
                      (_, i) => getAccount(review).nextNonce + i,
                    ).map((nonce) => {
                      const dependencies = items.filter((tx) => tx.account === review.account && tx.nonce === nonce)
                      return (
                        <div key={nonce} className="rounded-lg bg-muted p-3">
                          <Typography variant="paragraph-small-medium">Nonce #{nonce}</Typography>
                          {dependencies.length ? (
                            dependencies.map((tx) => (
                              <button
                                key={tx.id}
                                className="mt-2 flex w-full items-center justify-between gap-2 text-left text-sm hover:underline"
                                onClick={() => reviewTx(tx)}
                              >
                                <span>{getTransactionLabel(tx)}</span>
                                <Badge variant="secondary">
                                  {tx.signers.length}/{getAccount(tx).threshold}
                                </Badge>
                              </button>
                            ))
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              No proposal found in available data. Refresh the queue before treating this as a nonce
                              gap.
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </PanelSection>
                )}
                {getConflicts(review, items).length > 0 && (
                  <PanelSection value="conflicts" title="Competing proposals">
                    <p className="text-sm text-muted-foreground">
                      These proposals use the same nonce. Executing one makes the others invalid.
                    </p>
                    {getConflicts(review, items).map((tx) => (
                      <button
                        key={tx.id}
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted p-3 text-left text-sm hover:underline"
                        onClick={() => reviewTx(tx)}
                      >
                        <span>{getTransactionLabel(tx)}</span>
                        <Badge variant="secondary">{tx.amount}</Badge>
                      </button>
                    ))}
                  </PanelSection>
                )}
                {reject && (
                  <PanelSection value="cancel" title="Replace or cancel">
                    <p className="text-sm text-muted-foreground">
                      A replacement or cancellation uses the same nonce. It needs signatures and on-chain execution
                      before the original proposal becomes invalid.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={persona !== 'owner' || !getAccount(review).owners.includes('Dev')}
                      onClick={() => setReplacement({ recipient: review.recipient, amount: review.amount })}
                    >
                      Replace with another transaction
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={persona !== 'owner' || !getAccount(review).owners.includes('Dev')}
                      onClick={() => proposeAlternative('cancellation')}
                    >
                      Propose on-chain cancellation
                    </Button>
                    {replacement && (
                      <div className="space-y-3 rounded-lg bg-muted p-3">
                        <p className="text-sm">
                          Review the replacement summary. This prototype does not build a signable transaction.
                        </p>
                        {(['recipient', 'amount'] as const).map((field) => (
                          <label key={field} className="block space-y-1 text-sm">
                            <span>{field === 'recipient' ? 'Recipient' : 'Amount'}</span>
                            <Input
                              value={replacement[field]}
                              onChange={(event) => setReplacement({ ...replacement, [field]: event.target.value })}
                            />
                          </label>
                        ))}
                        <Button
                          disabled={!replacement.recipient.trim() || !replacement.amount.trim()}
                          onClick={() => proposeAlternative('replacement')}
                        >
                          Propose replacement in preview
                        </Button>
                      </div>
                    )}
                  </PanelSection>
                )}
              </Accordion>
            )}
          </DrawerBody>
          <div className="shrink-0 border-t border-border bg-background" data-testid="proposal-fixed-footer">
            <DrawerFooter safeArea>
              {review && (
                <Accordion
                  key={`audit-${review.id}-${collapseAudit ? 'collapsed' : 'open'}`}
                  defaultValue={collapseAudit ? [] : ['audit']}
                >
                  <AccordionItem value="audit">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        Audit log
                        <Badge variant="outline">
                          {getSignatureCount(review)}/{getAccount(review).threshold}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-[24vh] overflow-y-auto overscroll-contain pb-3">
                        <ProposalActivity proposal={review} persona={persona} compact />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              {feedback && (
                <p role="status" className="mb-3 text-xs text-muted-foreground">
                  {feedback}
                </p>
              )}
              {review && pendingAction && (
                <div className="mb-3 space-y-2 rounded-lg bg-muted p-3">
                  <p className="text-sm">
                    {pendingAction === 'sign'
                      ? 'Add your preview signature to this proposal.'
                      : 'Executing this proposal advances the nonce and invalidates competing proposals at the same nonce.'}
                  </p>
                  <p className="text-xs text-muted-foreground">Simulated action · no wallet request</p>
                  <div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
                    <Button
                      variant="outline"
                      size={isMobile ? 'xl' : 'default'}
                      className="w-full shrink-0 md:w-auto"
                      onClick={() => setPendingAction(null)}
                    >
                      Back to review
                    </Button>
                    {pendingAction === 'signAndExecute' && (
                      <Button
                        variant="outline"
                        size={isMobile ? 'xl' : 'default'}
                        className="w-full shrink-0 md:w-auto"
                        onClick={() => performAction('sign')}
                      >
                        Sign only in preview
                      </Button>
                    )}
                    <Button
                      size={isMobile ? 'xl' : 'default'}
                      className="w-full shrink-0 md:w-auto"
                      onClick={() => performAction(pendingAction)}
                    >
                      {pendingAction === 'sign'
                        ? 'Sign in preview'
                        : pendingAction === 'signAndExecute'
                          ? 'Sign and execute in preview'
                          : 'Execute in preview'}
                    </Button>
                  </div>
                </div>
              )}
              {review && !pendingAction && (
                <div className="flex flex-col gap-2 md:flex-row">
                  <Button
                    variant="outline"
                    size={isMobile ? 'xl' : 'default'}
                    className="w-full shrink-0 md:w-auto"
                    onClick={() => {
                      setReject(!reject)
                      if (!reject) setReviewSections([...reviewSections, 'cancel'])
                    }}
                  >
                    {reject ? 'Hide replace or cancel' : 'Replace or cancel'}
                  </Button>
                  <Button
                    size={isMobile ? 'xl' : 'default'}
                    className="w-full shrink-0 md:w-auto md:flex-1"
                    disabled={!getState(review, persona).ready && !getState(review, persona).canSign}
                    onClick={() =>
                      setPendingAction(
                        getState(review, persona).ready
                          ? 'execute'
                          : getState(review, persona).finalSignature
                            ? 'signAndExecute'
                            : 'sign',
                      )
                    }
                  >
                    {getState(review, persona).ready || getState(review, persona).canSign
                      ? getAction(review, persona)
                      : getState(review, persona).waiting
                        ? `Waiting on #${getAccount(review).nextNonce}`
                        : 'Waiting on signatures'}
                  </Button>
                </div>
              )}
            </DrawerFooter>
          </div>
        </Drawer>
        <Drawer
          mobileFullScreen
          open={bulkScope !== null}
          onClose={() => {
            setBulkScope(null)
            setBulkHover([])
          }}
          ariaLabel="Bulk execute"
        >
          <DrawerHeader className="pr-20">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Layers className="size-4" strokeWidth={ICON_STROKE} />
            </span>
            <DrawerTitle>Bulk execute</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-muted-foreground">
              Only fully signed transactions with consecutive nonces are included. Each Safe executes its batch as a
              separate transaction from your wallet.
            </p>
            <div className="mt-4 space-y-3">
              {reviewBatches.map((batch) => (
                <Card
                  as="section"
                  key={batch.account.id}
                  aria-label={`${batch.account.name} batch`}
                  variant="outlined"
                  size="sm"
                >
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      <Identicon address={batch.account.iconAddress} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{batch.account.name}</p>
                        <p className="whitespace-nowrap text-xs text-muted-foreground">
                          {batch.account.network} · {batch.account.address}
                        </p>
                      </div>
                      {batch.proposals.length > 0 && (
                        <Badge variant="outline">
                          {batch.proposals.length} {batch.proposals.length === 1 ? 'transaction' : 'transactions'} · #
                          {batch.proposals[0].nonce}
                          {batch.proposals.length > 1 && `–#${batch.proposals[batch.proposals.length - 1].nonce}`}
                        </Badge>
                      )}
                    </div>
                    {batch.proposals.length > 0 && (
                      <ol className="mt-3 space-y-1.5">
                        {batch.proposals.map((tx) => (
                          <li key={tx.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate">{getTransactionLabel(tx)}</span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">#{tx.nonce}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                    {batch.blocked && (
                      <Alert variant="warning" outlined={false} className="mt-3">
                        <AlertSeverityIcon variant="warning" />
                        <AlertDescription>
                          {batch.proposals.length
                            ? `Stops before #${batch.blocked.nonce}: choose one of its ${batch.blocked.competing} competing proposals first.`
                            : `Not included. Choose one of the ${batch.blocked.competing} competing proposals at #${batch.blocked.nonce} first.`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DrawerBody>
          <DrawerFooter safeArea>
            <Button
              size={isMobile ? 'xl' : 'default'}
              className="w-full"
              disabled={!executableBatches.length}
              onClick={runBulkExecute}
            >
              Execute {executableCount} {executableCount === 1 ? 'transaction' : 'transactions'} in preview
            </Button>
          </DrawerFooter>
        </Drawer>
      </PrototypeFrame>
    </div>
  )
}
