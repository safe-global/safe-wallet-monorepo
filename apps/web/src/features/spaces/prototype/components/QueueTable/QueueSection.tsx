import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Info } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { TableHeader, TableHead, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import type { BulkBatch, PreviewAction } from '../../services/queue'
import type { MenuAction } from '../../services/actions'
import type { Account, Filter, Persona, Proposal } from '../../types'
import { SafeIdentity, STATUS_ORDER, chainLogoUrl } from '../shared'
import { QueueRow } from './QueueRow'
import type { QueueSectionData } from './sections'
import { getOwnerWallet } from '../../services/nextSteps'
import { isSignerOf } from '../../services/personas'
import { RecoveryNoticeRow, RecoveryRow, type RecoveryController } from '../Recovery/RecoveryPanel'
import { getPrimaryStatus } from '../../services/model'

// Action has no width so it takes the slack and right-aligns its buttons.
// Widths include 16px cell padding on each side.
const STEPS_WIDTHS: Record<string, string> = {
  Nonce: 'w-16',
  // Type, what happens and the other party on one line.
  Transaction: 'w-[26rem]',
  To: 'w-56',
  Safe: 'w-48',
  Chain: 'w-20',
  Proposed: 'w-24',
  Note: 'w-[68px]',
  Signatures: 'w-28',
  Status: 'w-44',
  // Fixed widths make the table scroll before columns overlap.
  Action: 'w-36',
}

export type QueueSectionProps = {
  section: QueueSectionData
  items: Proposal[]
  persona: Persona
  isWide: boolean
  showNoteText?: boolean
  collapsed: boolean
  onToggle: () => void
  safeBatch?: BulkBatch
  onBulkExecute: (accountId: string) => void
  reviewId?: string
  cursorId?: string
  bulkHover: string[]
  replaceHover: string | null
  onReplaceHover: (id: string | null) => void
  onReview: (tx: Proposal) => void
  remindedIds?: string[]
  onRemind?: (tx: Proposal) => void
  onGoTo?: (tx: Proposal) => void
  onStartFlow?: (tx: Proposal, flow: PreviewAction) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  // Safe view: this Safe's recoveries show at the top of its table.
  recoveries?: RecoveryController
  // Fleet admin: a button by the Safe name opens its registry record.
  onOpenSafe?: (account: Account) => void
  // Option C: the other party gets its own column.
  alignTo?: boolean
}

const SUMMARY_LABELS = {
  ready: 'to execute',
  sign: 'to sign',
  awaiting: 'waiting on others',
  waiting: 'blocked',
} as const

// Proposals at the same nonce count once. Only one can execute.
export const getSummary = (section: QueueSectionData, persona: Persona) => {
  const rows = new Map<Filter, number>()
  const nonces = new Map<Filter, Set<string>>()
  section.items.forEach((tx) => {
    const status = getPrimaryStatus(tx, persona)
    rows.set(status, (rows.get(status) ?? 0) + 1)
    nonces.set(status, (nonces.get(status) ?? new Set()).add(`${tx.account}:${tx.nonce}`))
  })
  return STATUS_ORDER.filter((status) => rows.has(status)).map((status) => ({
    status,
    count: nonces.get(status)!.size,
    options: rows.get(status)!,
  }))
}

// One pill per status, in the tones of the row status chips.
function SafeSummary({
  section,
  persona,
  recoveryCount,
}: {
  section: QueueSectionData
  persona: Persona
  recoveryCount: number
}) {
  const summary = getSummary(section, persona)
  if (!summary.length && !recoveryCount)
    return <span className="text-xs font-normal text-muted-foreground">No pending transactions</span>
  return (
    <span className="truncate text-xs font-normal tabular-nums text-muted-foreground">
      {recoveryCount > 0 && (
        <span className="text-warning-strong">
          {recoveryCount} {recoveryCount === 1 ? 'recovery' : 'recoveries'}
          {summary.length > 0 && ' · '}
        </span>
      )}
      {summary.map(({ status, count }) => `${count} ${SUMMARY_LABELS[status]}`).join(' · ')}
    </span>
  )
}

// The Safe name and chain. The other Safe facts are in the avatar tooltip.
export function SafeTitle({ account, persona, size }: { account: Account; persona: Persona; size: number }) {
  const wallet = isSignerOf(account, persona) ? getOwnerWallet(account) : undefined
  return (
    <SafeIdentity
      address={account.iconAddress}
      size={size}
      className="flex min-w-0 items-center gap-3"
      title={account.name}
      details={[
        { label: 'Network', value: account.network },
        { label: 'Threshold', value: `${account.threshold} of ${account.owners.length} signers` },
        { label: 'Next nonce', value: <span className="font-mono">#{account.nextNonce}</span> },
        ...(wallet ? [{ label: 'You sign with', value: wallet.name }] : []),
      ]}
    >
      <span className="truncate font-medium text-foreground">{account.name}</span>
      <Badge variant="outline" className="shrink-0 gap-1 font-normal text-muted-foreground">
        <img src={chainLogoUrl(account.chainId)} alt="" className="size-3.5 rounded-full" />
        {account.network}
      </Badge>
    </SafeIdentity>
  )
}

type SectionHeaderProps = Pick<
  QueueSectionProps,
  'section' | 'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute' | 'persona' | 'onOpenSafe'
> & {
  recoveryCount?: number
}

// The chevron button. It sits in the Nonce column, so the Safe lines up with the type icons.
export function SectionToggle({ section, collapsed }: Pick<QueueSectionProps, 'section' | 'collapsed'>) {
  return (
    <Button
      size="icon-sm"
      variant="ghost-muted"
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${section.label}`}
      aria-expanded={!collapsed}
      aria-controls={`section-${section.id}`}
    >
      <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
    </Button>
  )
}

// The header is a band inside the table, after the chevron.
export function SectionHeader({
  section,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
  persona,
  recoveryCount = 0,
  onOpenSafe,
}: SectionHeaderProps) {
  return (
    <div
      data-slot="section-header"
      className="group/section flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium transition-colors"
      onClick={onToggle}
    >
      <SafeTitle account={section.account} persona={persona} size={24} />
      {onOpenSafe && (
        <Button
          size="2xs"
          variant="ghost"
          aria-label={`Details for ${section.account.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onOpenSafe(section.account)
          }}
        >
          <Info /> Details
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {/* Open Safes show each status in their rows. */}
        {collapsed && <SafeSummary section={section} persona={persona} recoveryCount={recoveryCount} />}
        {safeBatch && safeBatch.proposals.length > 1 && (
          <Button
            size="2xs"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              onBulkExecute(safeBatch.account.id)
            }}
          >
            Bulk execute {safeBatch.proposals.length}
          </Button>
        )}
      </div>
    </div>
  )
}

export type CollapseAll = { allCollapsed: boolean; onToggle: () => void; count?: number }

// Column header: chevrons always, outline and word on header hover. The wrapper undoes the header's capitals.
export function CollapseAllButton({ allCollapsed, onToggle, count }: CollapseAll) {
  const label = allCollapsed ? 'Expand all' : 'Collapse all'
  const icon = allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />
  return (
    <span className="normal-case [&>button]:border-transparent [&>button]:shadow-none group-hover/head:[&>button]:border-border group-hover/head:[&>button]:shadow-xs group-focus-within/head:[&>button]:border-border group-focus-within/head:[&>button]:shadow-xs">
      <Button size="2xs" variant="outline" aria-label={label} onClick={onToggle}>
        <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
          {allCollapsed ? 'Expand' : 'Collapse'}
          {count !== undefined && ` ${count} ${count === 1 ? 'Safe' : 'Safes'}`}
        </span>
        {icon}
      </Button>
    </span>
  )
}

// When the note text shows, the note column fills the extra width.
export const getColumnWidths = (
  showNoteText: boolean | undefined,
  alignTo = false,
): Record<string, string | undefined> => ({
  ...STEPS_WIDTHS,
  // Option C: the other party moves to its own column.
  ...(alignTo ? { Transaction: 'w-72' } : {}),
  ...(showNoteText ? { Note: undefined } : {}),
})

// The pinned Action column shows its shadow only when content scrolls under it.
export function useScrollOverflow(layoutKey: unknown) {
  const scroller = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const container = scroller.current?.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (!container) return
    const update = () => setOverflowing(container.scrollLeft + container.clientWidth < container.scrollWidth - 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    container.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', update)
    }
  }, [layoutKey])
  return { scroller, overflowing }
}

export function QueueTableHead({ columns, collapse }: { columns: string[]; collapse?: CollapseAll }) {
  return (
    <TableHeader>
      <TableRow data-no-hover className={collapse ? 'group/head' : undefined}>
        {columns.map((label, index) => (
          <TableHead
            key={label}
            scope="col"
            className={`text-xs text-muted-foreground ${label === 'Nonce' ? 'px-0! text-center' : ''} ${index === 0 ? 'max-md:sticky max-md:left-0 max-md:z-20' : ''} ${label === 'Action' ? 'sticky right-0 z-20 group-data-[overflow]/queue:shadow-[-12px_0_12px_-12px_rgba(0,0,0,0.25)]' : ''}`}
          >
            {label === 'Action' ? (
              <span className="flex items-center justify-end">
                <span className="sr-only">{label}</span>
                {collapse && <CollapseAllButton {...collapse} />}
              </span>
            ) : label === 'To' ? (
              // Option C: the names speak for themselves, so the title is for screen readers only.
              <span className="sr-only">{label}</span>
            ) : (
              label
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

export type QueueSectionRowsProps = Omit<
  QueueSectionProps,
  'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute' | 'recoveries'
> & { columns: string[]; safeRecoveries: ReturnType<RecoveryController['forAccount']>; recoveries?: RecoveryController }

// The body rows of one section: its recoveries, then its proposals.
export function QueueSectionRows({
  section,
  items,
  persona,
  isWide,
  showNoteText,
  columns,
  safeRecoveries,
  recoveries,
  reviewId,
  cursorId,
  bulkHover,
  replaceHover,
  onReplaceHover,
  onReview,
  remindedIds = [],
  onRemind,
  onGoTo,
  onStartFlow,
  onMenuAction,
}: QueueSectionRowsProps) {
  const [conflictHover, setConflictHover] = useState<string | null>(null)
  return (
    <>
      {safeRecoveries.length > 0 && recoveries && (
        <>
          <RecoveryNoticeRow columnCount={columns.length} count={safeRecoveries.length} />
          {safeRecoveries.map((recovery) => (
            <RecoveryRow key={recovery.id} recovery={recovery} columns={columns} controller={recoveries} />
          ))}
        </>
      )}
      {section.items.map((tx) => (
        <QueueRow
          key={tx.id}
          conflictHover={conflictHover}
          onConflictHover={setConflictHover}
          tx={tx}
          sectionItems={section.items}
          items={items}
          persona={persona}
          isWide={isWide}
          showNoteText={showNoteText}
          columns={columns}
          selected={reviewId === tx.id}
          cursor={cursorId === tx.id}
          highlighted={bulkHover.includes(tx.id)}
          replaceHover={replaceHover}
          onReplaceHover={onReplaceHover}
          onReview={onReview}
          remindedIds={remindedIds}
          onRemind={onRemind}
          onGoTo={onGoTo}
          onStartFlow={onStartFlow}
          onMenuAction={onMenuAction}
        />
      ))}
      {!section.items.length && !safeRecoveries.length && (
        <TableRow data-no-hover data-no-divider>
          <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
            No matching proposals
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
