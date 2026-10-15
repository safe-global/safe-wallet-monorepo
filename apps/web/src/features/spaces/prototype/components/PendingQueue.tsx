import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowUpRight,
  ArrowRightLeft,
  FileCode2,
  Network,
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
  CircleHelp,
  Clock3,
  Copy,
  FlaskConical,
  LockKeyhole,
  StickyNote,
  TriangleAlert,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Chip } from '@safe-global/views/components/ui/chip'
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
import { CopyTransactionLink, ProposalDetails, ProposalAdvanced, SignerList } from './ProposalDetails'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import { Drawer, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerList } from '@/components/common/Drawer'
import Identicon from '@/components/common/Identicon'
import useMediaQuery from '@/hooks/useMediaQuery'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { Separator } from '@safe-global/views/components/ui/separator'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { formatDateTime } from '@safe-global/utils/utils/date'

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
  getSignerSummary,
  getWarnings,
  WARNING_LABELS,
  WARNING_DETAILS,
  getExecutionReason,
  getCreatedAt,
  getCounterparty,
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
  { value: 'realistic', label: 'Realistic mix' },
  { value: 'conflict', label: 'Competing proposals' },
  { value: 'conflict-heavy', label: 'Many competing' },
  { value: 'gap', label: 'Missing dependency' },
  { value: 'partial', label: 'Partial loading' },
  { value: 'empty', label: 'Empty workspace' },
]
const STATUS_ORDER: Filter[] = ['ready', 'sign', 'awaiting', 'waiting']
const QUICK_FILTERS: Filter[] = ['sign', 'ready', 'waiting']
const STATUS_META: Record<Filter, { label: string; description: string; icon: LucideIcon; tone: string }> = {
  ready: {
    label: 'Ready to execute',
    description: 'Fully signed and next in line',
    icon: CircleCheck,
    tone: 'bg-success-subtle text-success-strong',
  },
  sign: {
    label: 'Ready to sign',
    description: 'Proposals waiting for you to sign',
    icon: PenLine,
    tone: 'bg-success-subtle text-success-strong',
  },
  awaiting: {
    label: 'Waiting on others',
    description: 'Waiting on other signers',
    icon: Users,
    tone: 'bg-warning-subtle text-warning-strong',
  },
  waiting: {
    label: 'Blocked',
    description: 'Waiting on an earlier transaction',
    icon: Clock3,
    tone: 'bg-warning-subtle text-warning-strong',
  },
}

const TYPE_ICONS: Record<TypeLabel, LucideIcon> = {
  Send: ArrowUpRight,
  Swap: Repeat2,
  Bridge: ArrowRightLeft,
  Batch: Layers,
  Contract: FileCode2,
  Update: Settings,
  Nested: Network,
  'On-chain rejection': CircleX,
}
const HISTORY_HOVER: Partial<Record<TypeLabel, string>> = {
  Send: 'group-hover/history:text-destructive group-focus-visible/history:text-destructive',
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

const APPLIED_PILL = 'h-7 bg-card pr-2.5 pl-3 shadow-xs transition-colors hover:bg-muted'
type FilterSection = 'accounts' | 'networks' | 'types' | 'statuses'
const inSelection = <T,>(selection: T[], value: T) => selection.length === 0 || selection.includes(value)
const toggled = <T,>(selection: T[], value: T) =>
  selection.includes(value) ? selection.filter((item) => item !== value) : [...selection, value]

function FilterOption({
  label,
  checked,
  count,
  icon,
  onToggle,
}: {
  label: string
  checked: boolean
  count: number
  icon: ReactNode
  onToggle: () => void
}) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onToggle}
      className="group/option pr-2 [&>[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden"
    >
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded border border-border opacity-0 group-data-[highlighted]/option:opacity-100 group-data-[checked]/option:border-primary group-data-[checked]/option:bg-primary group-data-[checked]/option:text-primary-foreground group-data-[checked]/option:opacity-100"
      >
        {/* The menu item recolours every child on focus; the check must stay white on the filled box. */}
        {checked && <Check className="size-3 text-primary-foreground!" />}
      </span>
      <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </DropdownMenuCheckboxItem>
  )
}

function FilterSectionTitle({ title, summary }: { title: string; summary?: string }) {
  return (
    <span className="flex flex-1 items-center gap-2 pr-2">
      {title}
      {summary && (
        <>
          <span className="size-1.5 rounded-full bg-success-strong" aria-hidden="true" />
          <Badge variant="secondary" className="ml-auto font-normal" aria-hidden="true">
            {summary}
          </Badge>
        </>
      )}
    </span>
  )
}

function PanelSection({
  value,
  title,
  meta,
  children,
}: {
  value: string
  title: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <span className="flex items-center gap-2">
          {title}
          {meta}
        </span>
      </AccordionTrigger>
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
  const [auditOpen, setAuditOpen] = useState(true)
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
  const [accountFilter, setAccountFilter] = useState<string[]>([])
  const networks = [...new Set(accounts.map((account) => account.network))]
  const [networkFilter, setNetworkFilter] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<Filter[]>([])
  const [review, setReview] = useState<Proposal | null>(null)
  const [reject, setReject] = useState(false)
  const [pendingAction, setPendingAction] = useState<PreviewAction | null>(null)
  const [replacement, setReplacement] = useState<{ recipient: string; amount: string } | null>(null)
  const [reviewSections, setReviewSections] = useState<string[]>([])
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
  // An empty selection means the section isn't filtering.
  const passes = (tx: Proposal, skip?: FilterSection) =>
    (skip === 'accounts' || inSelection(accountFilter, tx.account)) &&
    (skip === 'networks' || inSelection(networkFilter, getAccount(tx).network)) &&
    (skip === 'types' || inSelection(typeFilter, getTypeLabel(tx))) &&
    (skip === 'statuses' || !stateFilter.length || stateFilter.some((status) => matchesFilter(tx, status, persona))) &&
    `${getTransactionLabel(tx)} ${tx.recipient} ${tx.amount} ${tx.nonce} ${getAccount(tx).name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  const visible = items.filter((tx) => passes(tx))
  const optionCount = (skip: FilterSection, match: (tx: Proposal) => boolean) =>
    items.filter((tx) => passes(tx, skip) && match(tx)).length
  const setOption = (changes: Record<string, string>) => {
    setReview(null)
    setFeedback('')
    void router.replace({ pathname: router.pathname, query: { ...router.query, ...changes } }, undefined, {
      shallow: true,
    })
  }
  const reviewTx = (tx: Proposal, keepLayout = false) => {
    setReject(false)
    setPendingAction(null)
    setReplacement(null)
    if (!keepLayout) {
      setReviewSections([])
      setAuditOpen(true)
    }
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

  const statusLabel = (status: Filter) => STATUS_META[status].label
  const appliedFilters = [
    {
      section: 'accounts' as const,
      title: 'Safe',
      values: accounts.filter((account) => accountFilter.includes(account.id)).map((account) => account.name),
      clear: () => setAccountFilter([]),
    },
    { section: 'networks' as const, title: 'Network', values: networkFilter, clear: () => setNetworkFilter([]) },
    { section: 'types' as const, title: 'Type', values: typeFilter, clear: () => setTypeFilter([]) },
    {
      section: 'statuses' as const,
      title: 'Status',
      values: stateFilter.map(statusLabel),
      clear: () => setStateFilter([]),
    },
  ].filter((filter) => filter.values.length > 0)
  const selectionSummary = (values: string[]) =>
    values.length === 0 ? undefined : values.length === 1 ? values[0] : String(values.length)
  const filterSummaries = {
    accounts: selectionSummary(accountFilter),
    networks: selectionSummary(networkFilter),
    types: selectionSummary(typeFilter),
    status: selectionSummary(stateFilter.map(statusLabel)),
    grouping: groupBy === 'none' ? undefined : groupBy === 'safe' ? 'Safe' : 'Status',
  }
  const activeFilterCount = appliedFilters.length
  const resetFilters = () => {
    setAccountFilter([])
    setNetworkFilter([])
    setTypeFilter([])
    setSearch('')
    setStateFilter([])
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
          .filter((account) => inSelection(accountFilter, account.id))
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
        : STATUS_ORDER.map((status) => ({
            id: `status-${status}`,
            category: status,
            label: STATUS_META[status].label,
            next: undefined,
            account: undefined,
            items: groups.flatMap((group) => group.items).filter((tx) => getPrimaryStatus(tx, persona) === status),
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
    if (next) reviewTx(next, true)
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

  const linkedTx = typeof router.query.tx === 'string' ? router.query.tx : undefined
  const openedLink = useRef<string>(undefined)
  useEffect(() => {
    const linked = queue.items.find((tx) => tx.id === linkedTx)
    if (!linked || openedLink.current === linkedTx) return
    openedLink.current = linkedTx
    setReview(linked)
  }, [linkedTx, queue.items])

  useEffect(() => {
    document.querySelector('tr[data-state="selected"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [review?.id])
  const columnWidths: Record<string, string | undefined> = {
    Type: isWide ? 'w-56' : 'w-44',
    Safe: isWide ? 'w-[18%]' : 'w-[22%]',
    Network: 'w-16',
    Signatures: isWide ? 'w-40' : 'w-24',
    Note: 'w-16',
    Action: 'w-24',
  }

  const renderWarnings = (tx: Proposal) =>
    getWarnings(tx).map((warning) => (
      <Alert key={warning} variant="warning" outlined={false}>
        <AlertSeverityIcon variant="warning" />
        <AlertTitle>{WARNING_LABELS[warning]}</AlertTitle>
        <AlertDescription>{WARNING_DETAILS[warning]}</AlertDescription>
      </Alert>
    ))
  const getSignerFootnote = (tx: Proposal) => {
    const { missing } = getState(tx, persona)
    if (tx.kind.type === 'swap' && tx.kind.expired)
      return 'This order has expired. Reject this transaction and try again.'
    if (tx.proposedBy && tx.signers.length === 0)
      return 'This transaction was created by a proposer. Review it, then confirm or reject it.'
    if (missing && tx.kind.type === 'rejection')
      return 'This rejection can execute once the required approvals are collected.'
    return missing ? 'Can be executed once the threshold is reached.' : undefined
  }
  const renderSummary = (tx: Proposal) => {
    const counterparty = getCounterparty(tx)
    const counterpartyRow = counterparty && { label: counterparty.label, content: counterparty.value }
    const state = getState(tx, persona)
    const account = getAccount(tx)
    const conflicts = getConflicts(tx, items)
    return (
      <div role="group" aria-label="Transaction summary">
        <DrawerList
          mobileStack
          items={[
            {
              label: 'Safe',
              content: (
                <span className="flex min-w-0 items-center gap-2">
                  <Identicon address={account.iconAddress} size={20} />
                  <span className="truncate">
                    {account.name} · {account.network}
                  </span>
                </span>
              ),
            },
            ...(counterpartyRow ? [counterpartyRow] : []),
            {
              label: 'Signatures',
              content: (
                <span className="tabular-nums">
                  {getSignatureCount(tx)}/{account.threshold}
                  {state.missing > 0 && (
                    <span className="text-muted-foreground"> · {getSignerSummary(tx, persona)}</span>
                  )}
                </span>
              ),
            },
            { label: 'Nonce', content: <span className="tabular-nums">#{tx.nonce}</span> },
            {
              label: 'Proposed',
              content: (
                <span className="tabular-nums">
                  {formatDateTime(getCreatedAt(tx))}
                  <span className="text-muted-foreground"> · {tx.age}</span>
                </span>
              ),
            },
            {
              label: 'Status',
              content: (
                <div className="flex flex-col md:items-end">
                  <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                    <Badge variant={getStatusTone(tx, persona)}>{getStatusLabel(tx, persona)}</Badge>
                    {conflicts.length > 0 && (
                      <Badge variant="warning">{conflicts.length + 1} competing proposals</Badge>
                    )}
                    {tx.proposedBy && tx.signers.length === 0 && <Badge variant="outline">Proposal</Badge>}
                  </div>
                </div>
              ),
            },
          ]}
        />
        <Alert variant="info" outlined={false} role="note" className="mt-3" data-testid="execution-reason">
          <AlertSeverityIcon variant="info" />
          <AlertDescription>{getExecutionReason(tx, persona, items)}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const reviewState = review ? getState(review, persona) : undefined
  const reviewConflicts = review ? getConflicts(review, items) : []
  const signerFootnote = review ? getSignerFootnote(review) : undefined
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
                {items.length > 0 && (
                  <div role="group" aria-label="Quick filters" className="flex flex-wrap items-center gap-2">
                    {QUICK_FILTERS.map((status) => {
                      const filter = { value: status, ...STATUS_META[status] }
                      const count = optionCount('statuses', (tx) => matchesFilter(tx, status, persona))
                      const pressed = stateFilter.includes(status)
                      const FilterIcon = filter.icon
                      return (
                        <Tooltip key={filter.value} delay={300}>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                aria-pressed={pressed}
                                aria-label={`${filter.label}, ${count}`}
                                onClick={() => setStateFilter(toggled(stateFilter, filter.value))}
                                className={`flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-card pr-3 pl-1.5 text-sm shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${pressed ? 'border-foreground' : 'border-border'}`}
                              />
                            }
                          >
                            <span
                              className={`flex size-6 items-center justify-center rounded ${filter.tone}`}
                              aria-hidden="true"
                            >
                              <FilterIcon className="size-3.5" strokeWidth={ICON_STROKE} />
                            </span>
                            {filter.label}
                            <span className="tabular-nums text-muted-foreground">{count}</span>
                          </TooltipTrigger>
                          <TooltipContent>{filter.description}</TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" />}>
                    <ListFilter />
                    Filter
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="tabular-nums">
                        {activeFilterCount}
                        <span className="sr-only"> applied</span>
                      </Badge>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilterSectionTitle title="Safe account" summary={filterSummaries.accounts} />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-64">
                        {accounts.map((account) => (
                          <FilterOption
                            key={account.id}
                            label={account.name}
                            checked={accountFilter.includes(account.id)}
                            count={optionCount('accounts', (tx) => tx.account === account.id)}
                            icon={<Identicon address={account.iconAddress} size={16} />}
                            onToggle={() => setAccountFilter(toggled(accountFilter, account.id))}
                          />
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilterSectionTitle title="Network" summary={filterSummaries.networks} />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56">
                        {networks.map((network) => {
                          const chainId = accounts.find((account) => account.network === network)?.chainId
                          return (
                            <FilterOption
                              key={network}
                              label={network}
                              checked={networkFilter.includes(network)}
                              count={optionCount('networks', (tx) => getAccount(tx).network === network)}
                              icon={
                                <Avatar className="size-4">
                                  <AvatarImage
                                    src={`https://safe-transaction-assets.safe.global/chains/${chainId}/chain_logo.png`}
                                    alt=""
                                  />
                                  <AvatarFallback className="text-[10px]">{network[0]}</AvatarFallback>
                                </Avatar>
                              }
                              onToggle={() => setNetworkFilter(toggled(networkFilter, network))}
                            />
                          )
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilterSectionTitle title="Type" summary={filterSummaries.types} />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-60">
                        {TYPE_LABELS.map((type) => {
                          const TypeIcon = TYPE_ICONS[type]
                          return (
                            <FilterOption
                              key={type}
                              label={type}
                              checked={typeFilter.includes(type)}
                              count={optionCount('types', (tx) => getTypeLabel(tx) === type)}
                              icon={<TypeIcon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                              onToggle={() => setTypeFilter(toggled(typeFilter, type))}
                            />
                          )
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilterSectionTitle title="Status" summary={filterSummaries.status} />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-64">
                        {STATUS_ORDER.map((status) => {
                          const StatusIcon = STATUS_META[status].icon
                          return (
                            <FilterOption
                              key={status}
                              label={STATUS_META[status].label}
                              checked={stateFilter.includes(status)}
                              count={optionCount('statuses', (tx) => matchesFilter(tx, status, persona))}
                              icon={<StatusIcon className="size-4 text-muted-foreground" strokeWidth={ICON_STROKE} />}
                              onToggle={() => setStateFilter(toggled(stateFilter, status))}
                            />
                          )
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <FilterSectionTitle title="Group by" summary={filterSummaries.grouping} />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-44">
                        <DropdownMenuRadioGroup
                          value={groupBy}
                          onValueChange={(value) => setGroupBy(value as 'none' | 'status' | 'safe')}
                        >
                          <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="safe">Safe</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="action" aria-label="New transaction">
                  New
                </Button>
              </div>
              {(appliedFilters.length > 0 || groupBy !== 'none') && (
                <div role="group" aria-label="Applied filters" className="-mt-2 mb-5 flex flex-wrap items-center gap-2">
                  {[
                    ...appliedFilters,
                    ...(groupBy === 'none'
                      ? []
                      : [
                          {
                            section: 'grouping',
                            title: 'Group by',
                            values: [groupBy === 'safe' ? 'Safe' : 'Status'],
                            clear: () => setGroupBy('none'),
                          },
                        ]),
                  ].map((filter) => (
                    <Chip
                      key={filter.section}
                      variant="outline"
                      size="lg"
                      onDelete={filter.clear}
                      className={APPLIED_PILL}
                    >
                      <span className="text-muted-foreground">{filter.title}:</span>
                      {filter.values.length > 2
                        ? `${filter.values.slice(0, 2).join(', ')} +${filter.values.length - 2}`
                        : filter.values.join(', ')}
                    </Chip>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetFilters()
                      setGroupBy('none')
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
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
                                {section.category in STATUS_META &&
                                  (() => {
                                    const meta = STATUS_META[section.category as Filter]
                                    return (
                                      <span
                                        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${meta.tone}`}
                                        aria-hidden="true"
                                      >
                                        <meta.icon className="size-4" strokeWidth={ICON_STROKE} />
                                      </span>
                                    )
                                  })()}
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
                                      const warnings = getWarnings(tx)
                                      const warningMarker = warnings.length > 0 && (
                                        <Tooltip delay={150}>
                                          <TooltipTrigger
                                            aria-label={`Warnings: ${warnings.map((warning) => WARNING_LABELS[warning]).join(', ')}`}
                                            className="flex shrink-0 items-center text-warning-strong"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              reviewTx(tx)
                                            }}
                                          >
                                            <TriangleAlert
                                              className="size-4"
                                              strokeWidth={ICON_STROKE}
                                              aria-hidden="true"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {warnings.map((warning) => (
                                              <p key={warning}>{WARNING_LABELS[warning]}</p>
                                            ))}
                                          </TooltipContent>
                                        </Tooltip>
                                      )
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
                                                  {warningMarker}
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
                                                    aria-label={`${signatureCount} of ${account.threshold} signatures, ${getSignerSummary(tx, persona)}`}
                                                    className="max-w-full text-left text-xs tabular-nums"
                                                    onClick={(event) => event.stopPropagation()}
                                                  >
                                                    <span className="block">
                                                      {signatureCount}/{account.threshold}
                                                    </span>
                                                    {isWide && (
                                                      <span className="block max-w-36 truncate text-muted-foreground">
                                                        {getSignerSummary(tx, persona)}
                                                      </span>
                                                    )}
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
                                                  {tx.proposedBy && tx.signers.length === 0 && (
                                                    <Badge variant="outline">Proposal</Badge>
                                                  )}
                                                  {conflicts.length > 0 && groupSize < 2 && (
                                                    <Badge variant="warning">
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
                                                  <Tooltip delay={150}>
                                                    <TooltipTrigger
                                                      render={
                                                        <Badge
                                                          variant="outline"
                                                          size="default"
                                                          shape="pill"
                                                          className="text-muted-foreground"
                                                          aria-label={`Proposed ${tx.age}`}
                                                        >
                                                          {tx.age}
                                                        </Badge>
                                                      }
                                                    />
                                                    <TooltipContent>{formatDateTime(getCreatedAt(tx))}</TooltipContent>
                                                  </Tooltip>
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
          headerActions={({ fullScreen }) => (
            <>
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
              <span
                className={fullScreen ? 'text-xs tabular-nums text-muted-foreground max-md:sr-only' : 'sr-only'}
                aria-live="polite"
              >
                {reviewIndex >= 0 && `${reviewIndex + 1} of ${reviewOrder.length}`}
              </span>
            </>
          )}
        >
          <DrawerHeader>
            <div className="flex min-w-0 flex-1 flex-col gap-4 pr-22 md:pr-36">
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
                      <DrawerTitle size="lg">{getTypeLabel(review)}</DrawerTitle>
                      <p className="truncate text-xs tabular-nums text-muted-foreground">{getAmountLabel(review)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DrawerHeader>
          <DrawerBody>
            {review && (
              <div className="flex flex-col gap-3">
                {renderWarnings(review)}
                <Accordion multiple value={reviewSections} onValueChange={setReviewSections}>
                  <PanelSection value="summary" title="Transaction summary">
                    {renderSummary(review)}
                  </PanelSection>
                  {review.note && (
                    <PanelSection value="note" title="Note">
                      <div className="space-y-2 rounded-lg bg-muted p-3">
                        <p className="text-sm leading-relaxed">{review.note.text}</p>
                        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                          <LockKeyhole className="size-3" aria-hidden="true" />
                          {review.note.author} · {review.note.date} · Off-chain, not verified
                        </p>
                      </div>
                    </PanelSection>
                  )}
                  <PanelSection value="details" title="Details">
                    <ProposalDetails key={review.id} proposal={review} />
                  </PanelSection>
                  {reviewState?.waiting && (
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
                  {reviewConflicts.length > 0 && (
                    <PanelSection value="conflicts" title="Competing proposals">
                      <p className="text-sm text-muted-foreground">
                        These proposals use the same nonce. Executing one makes the others invalid.
                      </p>
                      {reviewConflicts.map((tx) => (
                        <button
                          key={tx.id}
                          className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted p-3 text-left text-sm hover:underline"
                          onClick={() => reviewTx(tx)}
                        >
                          <span>{getTransactionLabel(tx)}</span>
                          <Badge variant="secondary">{getAmountLabel(tx)}</Badge>
                        </button>
                      ))}
                    </PanelSection>
                  )}
                  <PanelSection value="advanced" title="Advanced transaction data">
                    <ProposalAdvanced key={review.id} proposal={review} />
                  </PanelSection>
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
              </div>
            )}
          </DrawerBody>
          <div className="@container shrink-0 border-t border-border bg-background" data-testid="proposal-fixed-footer">
            <DrawerFooter safeArea>
              {review && (
                <>
                  <section aria-label="Signers">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="flex cursor-pointer items-center gap-2 py-4 text-sm font-medium"
                        onClick={() => setAuditOpen(!auditOpen)}
                      >
                        Signers
                        <Badge variant="outline">
                          {getSignatureCount(review)} of {getAccount(review).threshold} required
                        </Badge>
                      </button>
                      <CopyTransactionLink proposal={review} />
                      <button
                        type="button"
                        aria-label="Signers"
                        aria-expanded={auditOpen}
                        aria-controls="proposal-signers"
                        className="flex flex-1 cursor-pointer items-center justify-end gap-3 self-stretch rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        onClick={() => setAuditOpen(!auditOpen)}
                      >
                        {auditOpen ? (
                          <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <div
                      id="proposal-signers"
                      hidden={!auditOpen}
                      className="max-h-[24vh] space-y-3 overflow-y-auto overscroll-contain pb-3"
                    >
                      <SignerList proposal={review} persona={persona} />
                      {signerFootnote && (
                        <Alert
                          variant="subtle"
                          role="note"
                          className="*:data-[slot=alert-description]:text-muted-foreground"
                        >
                          <AlertDescription>{signerFootnote}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </section>
                  <Separator className="mb-4" />
                </>
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
              {review && reviewState && !pendingAction && (
                <div className="flex flex-col gap-2 md:flex-row @2xl:justify-end">
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
                    className="w-full shrink-0 md:w-auto md:flex-1 @2xl:min-w-56 @2xl:flex-none"
                    disabled={!reviewState.ready && !reviewState.canSign}
                    onClick={() =>
                      setPendingAction(
                        reviewState.ready ? 'execute' : reviewState.finalSignature ? 'signAndExecute' : 'sign',
                      )
                    }
                  >
                    {reviewState.ready || reviewState.canSign
                      ? getAction(review, persona)
                      : getStatusLabel(review, persona)}
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
