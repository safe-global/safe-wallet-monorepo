import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, ChevronUp, ListTree } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import type { BulkBatch, PreviewAction } from '../../services/queue'
import type { MenuAction } from '../../services/actions'
import type { RowSecondaryAction } from '../../services/model'
import type { Account, Filter, Persona, Proposal } from '../../types'
import {
  CONFLICTING_META,
  HINT_CLASS,
  HintContent,
  SafeIdentity,
  STATUS_META,
  STATUS_ORDER,
  chainLogoUrl,
  type GroupBy,
} from '../shared'
import { QueueRow } from './QueueRow'
import { getColumns, type QueueSectionData } from './sections'
import { getOwnerWallet } from '../../services/nextSteps'
import { isSignerOf } from '../../services/personas'
import { SECTION_STYLES } from './NonceCell'
import { RecoveryNoticeRow, RecoveryRow, type RecoveryController } from '../Recovery/RecoveryPanel'
import { getPrimaryStatus } from '../../services/model'

// Action has no width so it takes the slack and right-aligns its buttons.
// Next steps: widths include 16px cell padding on each side.
export const STEPS_WIDTHS: Record<string, string> = {
  Nonce: 'w-16',
  Transaction: 'w-56',
  With: 'w-48',
  Safe: 'w-48',
  Chain: 'w-20',
  Proposed: 'w-24',
  Note: 'w-[68px]',
  Signatures: 'w-28',
  Status: 'w-44',
  // Fixed widths make the table scroll before columns overlap.
  Action: 'w-36',
}

const columnWidths = (isWide: boolean, steps = false): Record<string, string | undefined> =>
  steps
    ? STEPS_WIDTHS
    : isWide
      ? {
          Type: 'w-64',
          Nonce: 'w-16',
          Safe: 'w-52',
          Network: 'w-20',
          Signatures: 'w-24',
          Note: 'w-16',
          Status: 'w-44',
          Proposed: 'w-24',
        }
      : {
          Type: 'w-44',
          Nonce: 'w-12',
          Safe: 'w-40',
          Signatures: 'w-20',
          Status: 'w-36',
          Proposed: 'w-20',
        }

export type QueueSectionProps = {
  section: QueueSectionData
  items: Proposal[]
  persona: Persona
  groupBy: GroupBy
  steps?: boolean
  isWide: boolean
  showNoteText?: boolean
  collapsed: boolean
  onToggle: () => void
  safeBatch?: BulkBatch
  onBulkExecute: (accountId: string) => void
  onGroupByChange: (groupBy: GroupBy) => void
  reviewId?: string
  cursorId?: string
  bulkHover: string[]
  replaceHover: string | null
  onReplaceHover: (id: string | null) => void
  onReview: (tx: Proposal) => void
  onSecondaryAction: (tx: Proposal, action: RowSecondaryAction) => void
  remindedIds?: string[]
  onRemind?: (tx: Proposal) => void
  onGoTo?: (tx: Proposal) => void
  onStartFlow?: (tx: Proposal, flow: PreviewAction) => void
  onMenuAction?: (tx: Proposal, action: MenuAction) => void
  // Safe view: this Safe's recoveries show at the top of its table.
  recoveries?: RecoveryController
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

// Next steps: one pill per status, in the tones of the row status chips.
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

// Next steps: the Safe name and chain. The other Safe facts are in the avatar tooltip.
function SafeTitle({ account, persona, size }: { account: Account; persona: Persona; size: number }) {
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
  'section' | 'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute' | 'steps' | 'persona'
> & {
  recoveryCount?: number
  // One table: the header is a band inside the table, with the chevron first.
  inTable?: boolean
}

// The chevron button. One table puts it in the Nonce column, so the Safe lines up with the type icons.
export function SectionToggle({
  section,
  collapsed,
  inTable = false,
}: Pick<QueueSectionProps, 'section' | 'collapsed'> & { inTable?: boolean }) {
  return (
    <Button
      size="icon-sm"
      variant="ghost-muted"
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${section.label}`}
      aria-expanded={!collapsed}
      aria-controls={`section-${section.id}`}
    >
      {inTable ? (
        <ChevronDown className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      ) : collapsed ? (
        <ChevronDown />
      ) : (
        <ChevronUp />
      )}
    </Button>
  )
}

export function SectionHeader({
  section,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
  steps,
  persona,
  recoveryCount = 0,
  inTable = false,
}: SectionHeaderProps) {
  const safeAccount = section.account
  const conflicting = section.category === 'conflicting'
  const status = conflicting
    ? { ...CONFLICTING_META, tone: '' }
    : section.category in STATUS_META
      ? STATUS_META[section.category as keyof typeof STATUS_META]
      : null
  const count = conflicting
    ? new Set(section.items.map((tx) => `${tx.account}:${tx.nonce}`)).size
    : section.items.length
  const toggle = <SectionToggle section={section} collapsed={collapsed} inTable={inTable} />
  return (
    <div
      data-slot="section-header"
      className={`group/section flex cursor-pointer items-center gap-3 text-sm font-medium transition-colors ${inTable ? 'min-h-11' : 'rounded-lg px-3 py-2 hover:bg-foreground/[0.04] has-[:focus-visible]:bg-foreground/[0.04]'}`}
      onClick={onToggle}
    >
      {safeAccount && steps ? (
        <SafeTitle account={safeAccount} persona={persona} size={inTable ? 24 : 28} />
      ) : safeAccount ? (
        <SafeIdentity address={safeAccount.iconAddress} size={32} className="flex min-w-0 items-center gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{section.label}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {safeAccount.network} · <span className="font-mono">{safeAccount.address}</span>
            </span>
          </span>
        </SafeIdentity>
      ) : (
        <>
          {status && (
            <Tooltip delay={150}>
              <TooltipTrigger
                render={
                  <span
                    className={
                      steps
                        ? `${SECTION_STYLES[section.category as Filter | 'conflicting']} ${inTable ? 'ml-0 size-6' : ''}`
                        : `flex size-6 shrink-0 items-center justify-center rounded-md ${status.tone}`
                    }
                  />
                }
                aria-label={`${status.label}. ${status.description}.`}
              >
                {steps && section.category === 'ready' ? (
                  <Check className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
                ) : (
                  <status.icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
                )}
              </TooltipTrigger>
              <TooltipContent className={HINT_CLASS}>
                <HintContent title={status.label} body={`${status.description}.`} />
              </TooltipContent>
            </Tooltip>
          )}
          {section.label}
          <Badge variant="outline">{count}</Badge>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        {/* Open Safes show each status in their rows. */}
        {steps && safeAccount && collapsed && (
          <SafeSummary section={section} persona={persona} recoveryCount={recoveryCount} />
        )}
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
        {!inTable && toggle}
      </div>
    </div>
  )
}

export type CollapseAll = { allCollapsed: boolean; onToggle: () => void }

export function CollapseAllButton({ allCollapsed, onToggle, iconOnly }: CollapseAll & { iconOnly?: boolean }) {
  const label = allCollapsed ? 'Expand all' : 'Collapse all'
  const icon = allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />
  if (!iconOnly)
    return (
      <Button size="2xs" variant="ghost-muted" onClick={onToggle}>
        {icon}
        {label}
      </Button>
    )
  // Column header: chevrons always, outline and word on header hover. The wrapper undoes the header's capitals.
  return (
    <span className="normal-case [&>button]:border-transparent [&>button]:shadow-none group-hover/head:[&>button]:border-border group-hover/head:[&>button]:shadow-xs group-focus-within/head:[&>button]:border-border group-focus-within/head:[&>button]:shadow-xs">
      <Button size="2xs" variant="outline" aria-label={label} onClick={onToggle}>
        <span className="opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">
          {allCollapsed ? 'Expand' : 'Collapse'}
        </span>
        {icon}
      </Button>
    </span>
  )
}

export const getColumnWidths = (isWide: boolean, steps: boolean | undefined, showNoteText: boolean | undefined) =>
  // When the note text shows, the note column fills the extra width.
  showNoteText ? { ...columnWidths(isWide, steps), Note: undefined } : columnWidths(isWide, steps)

// The pinned Action column shows its shadow only when content scrolls under it.
export function useScrollOverflow(enabled: boolean | undefined, layoutKey: unknown) {
  const scroller = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const container = scroller.current?.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (!enabled || !container) return
    const update = () => setOverflowing(container.scrollLeft + container.clientWidth < container.scrollWidth - 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    container.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', update)
    }
  }, [enabled, layoutKey])
  return { scroller, overflowing }
}

export function QueueTableHead({
  columns,
  groupBy,
  steps,
  onGroupByChange,
  collapse,
}: Pick<QueueSectionProps, 'groupBy' | 'steps' | 'onGroupByChange'> & { columns: string[]; collapse?: CollapseAll }) {
  const grouped = groupBy !== 'none'
  return (
    <TableHeader>
      <TableRow data-no-hover className={collapse ? 'group/head' : undefined}>
        {columns.map((label, index) => {
          // Next steps: the view switch sets grouping. Column headers do not.
          const groupTarget = steps
            ? null
            : label === 'Safe' && groupBy !== 'safe'
              ? 'safe'
              : label === 'Status' && !grouped
                ? 'status'
                : null
          return (
            <TableHead
              key={label}
              scope="col"
              className={`text-xs text-muted-foreground ${steps && label === 'Nonce' ? 'px-0! text-center' : ''} ${index === 0 ? 'max-md:sticky max-md:left-0 max-md:z-20' : ''} ${steps && label === 'Action' ? 'sticky right-0 z-20 group-data-[overflow]/queue:shadow-[-12px_0_12px_-12px_rgba(0,0,0,0.25)]' : ''}`}
            >
              {label === 'Action' ? (
                <span className="flex items-center justify-end">
                  <span className="sr-only">{label}</span>
                  {collapse && <CollapseAllButton {...collapse} iconOnly />}
                </span>
              ) : groupTarget ? (
                <span className="flex items-center gap-1">
                  {label}
                  <Tooltip delay={150}>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon-xs"
                          variant="ghost-muted"
                          aria-label={`Group by ${groupTarget === 'safe' ? 'Safe' : 'status'}`}
                          onClick={() => onGroupByChange(groupTarget)}
                        />
                      }
                    >
                      <ListTree />
                    </TooltipTrigger>
                    <TooltipContent>Group by {groupTarget === 'safe' ? 'Safe' : 'status'}</TooltipContent>
                  </Tooltip>
                </span>
              ) : steps && label === 'With' ? (
                // Next steps: the counterparty reads as part of the transaction, so its column has no visible title.
                <span className="sr-only">{label}</span>
              ) : (
                label
              )}
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
  )
}

export type QueueSectionRowsProps = Omit<
  QueueSectionProps,
  'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute' | 'onGroupByChange' | 'groupBy' | 'recoveries'
> & { columns: string[]; safeRecoveries: ReturnType<RecoveryController['forAccount']>; recoveries?: RecoveryController }

// The body rows of one section: its recoveries, then its proposals.
export function QueueSectionRows({
  section,
  items,
  persona,
  steps,
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
  onSecondaryAction,
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
          steps={steps}
          isWide={isWide}
          showNoteText={showNoteText}
          columns={columns}
          selected={reviewId === tx.id}
          cursor={cursorId === tx.id}
          highlighted={bulkHover.includes(tx.id)}
          replaceHover={replaceHover}
          onReplaceHover={onReplaceHover}
          onReview={onReview}
          onSecondaryAction={onSecondaryAction}
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

export function QueueSection(props: QueueSectionProps) {
  const { section, persona, groupBy, steps, isWide, showNoteText, collapsed, onToggle, safeBatch, onBulkExecute } =
    props
  const grouped = groupBy !== 'none'
  const columns = getColumns(groupBy, isWide, steps)
  const safeRecoveries =
    steps && groupBy === 'safe' && section.account ? (props.recoveries?.forAccount(section.account.id) ?? []) : []
  const widths = getColumnWidths(isWide, steps, showNoteText)
  const { scroller, overflowing } = useScrollOverflow(steps, collapsed)
  // Next steps: the header moves into its card after the collapse animation ends.
  const [headerInCard, setHeaderInCard] = useState(collapsed)
  useEffect(() => {
    if (!collapsed) return setHeaderInCard(false)
    const timer = setTimeout(() => setHeaderInCard(true), 200)
    return () => clearTimeout(timer)
  }, [collapsed])
  const header = (
    <SectionHeader
      section={section}
      collapsed={collapsed}
      onToggle={onToggle}
      safeBatch={safeBatch}
      onBulkExecute={onBulkExecute}
      steps={steps}
      persona={persona}
      recoveryCount={safeRecoveries.length}
    />
  )
  return (
    <section className={`flex flex-col ${steps ? '' : 'gap-2'}`}>
      {grouped &&
        // Next steps: a collapsed section keeps the card of the expanded table.
        (steps && headerInCard ? (
          <Card radius="xl" size="none" className="overflow-hidden">
            {header}
          </Card>
        ) : (
          header
        ))}
      <div
        id={`section-${section.id}`}
        hidden={!steps && collapsed}
        inert={collapsed}
        className={
          steps
            ? `grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`
            : undefined
        }
      >
        <div className={steps ? 'min-h-0 overflow-hidden pt-2' : undefined}>
          <Card radius="xl" size="none">
            <CardContent>
              <div ref={scroller} className="group/queue relative" data-overflow={overflowing || undefined}>
                <Table
                  aria-label={grouped ? `${section.label} transactions` : 'Pending transactions'}
                  variant="panel"
                  className={`table-fixed ${steps ? 'min-w-[1080px] [&_td]:px-4 [&_th]:px-4' : 'min-w-[920px]'}`}
                >
                  <colgroup>
                    {columns.map((label) => (
                      <col key={label} className={widths[label]} />
                    ))}
                  </colgroup>
                  <QueueTableHead
                    columns={columns}
                    groupBy={groupBy}
                    steps={steps}
                    onGroupByChange={props.onGroupByChange}
                  />
                  <TableBody>
                    <QueueSectionRows {...props} columns={columns} safeRecoveries={safeRecoveries} />
                  </TableBody>
                </Table>
                {!steps && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-card to-transparent md:hidden"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
