import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListTree } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@safe-global/views/components/ui/table'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import type { BulkBatch, PreviewAction } from '../../services/queue'
import type { MenuAction } from '../../services/actions'
import type { RowSecondaryAction } from '../../services/model'
import type { Filter, Persona, Proposal } from '../../types'
import {
  CONFLICTING_META,
  HINT_CLASS,
  HintContent,
  SafeIdentity,
  STATUS_META,
  STATUS_ORDER,
  type GroupBy,
} from '../shared'
import { QueueRow } from './QueueRow'
import { getColumns, type QueueSectionData } from './sections'
import { getOwnerWallet } from '../../services/nextSteps'
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
const summarise = (section: QueueSectionData, persona: Persona) => {
  const rows = new Map<keyof typeof SUMMARY_LABELS, number>()
  const nonces = new Map<keyof typeof SUMMARY_LABELS, Set<string>>()
  section.items.forEach((tx) => {
    const status = getPrimaryStatus(tx, persona)
    rows.set(status, (rows.get(status) ?? 0) + 1)
    nonces.set(status, (nonces.get(status) ?? new Set()).add(`${tx.account}:${tx.nonce}`))
  })
  const parts = STATUS_ORDER.filter((status) => rows.has(status)).map((status) => {
    const count = nonces.get(status)!.size
    const options = rows.get(status)!
    return `${count} ${SUMMARY_LABELS[status]}${options > count ? ` · ${options} options` : ''}`
  })
  return [section.urgency === undefined ? 'Nothing for you' : undefined, ...parts].filter(Boolean).join(' · ')
}

function SectionHeader({
  section,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
  steps,
  persona,
  recoveryCount = 0,
}: Pick<
  QueueSectionProps,
  'section' | 'collapsed' | 'onToggle' | 'safeBatch' | 'onBulkExecute' | 'steps' | 'persona'
> & { recoveryCount?: number }) {
  const safeAccount = section.account
  const wallet = safeAccount && getOwnerWallet(safeAccount)
  const conflicting = section.category === 'conflicting'
  const status = conflicting
    ? { ...CONFLICTING_META, tone: '' }
    : section.category in STATUS_META
      ? STATUS_META[section.category as keyof typeof STATUS_META]
      : null
  const count = conflicting
    ? new Set(section.items.map((tx) => `${tx.account}:${tx.nonce}`)).size
    : section.items.length
  return (
    <div
      data-slot="section-header"
      className="group/section flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/[0.04] has-[:focus-visible]:bg-foreground/[0.04]"
      onClick={onToggle}
    >
      {safeAccount ? (
        <SafeIdentity address={safeAccount.iconAddress} size={32} className="flex min-w-0 items-center gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{section.label}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {safeAccount.network} · <span className="font-mono">{safeAccount.address}</span>
              {steps && (
                <>
                  {' '}
                  · {safeAccount.threshold} of {safeAccount.owners.length} · next nonce{' '}
                  <span className="font-mono">#{safeAccount.nextNonce}</span>
                  {wallet && ` · you sign with ${wallet.name}`}
                </>
              )}
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
                        ? SECTION_STYLES[section.category as Filter | 'conflicting']
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
        {steps && safeAccount && (
          <span className="text-xs font-normal text-muted-foreground">
            {[
              recoveryCount ? `${recoveryCount} ${recoveryCount === 1 ? 'recovery' : 'recoveries'}` : '',
              summarise(section, persona),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
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
  )
}

export function QueueSection({
  section,
  items,
  persona,
  groupBy,
  steps,
  isWide,
  showNoteText,
  collapsed,
  onToggle,
  safeBatch,
  onBulkExecute,
  onGroupByChange,
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
  recoveries,
}: QueueSectionProps) {
  const grouped = groupBy !== 'none'
  const columns = getColumns(groupBy, isWide, steps)
  const safeRecoveries =
    steps && groupBy === 'safe' && section.account ? (recoveries?.forAccount(section.account.id) ?? []) : []
  // When the note text shows, the note column fills the extra width.
  const widths = showNoteText ? { ...columnWidths(isWide, steps), Note: undefined } : columnWidths(isWide, steps)
  const scroller = useRef<HTMLDivElement>(null)
  const [conflictHover, setConflictHover] = useState<string | null>(null)
  const [overflowing, setOverflowing] = useState(false)
  // The pinned Action column shows its shadow only when content scrolls under it.
  useEffect(() => {
    const container = scroller.current?.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (!steps || !container) return
    const update = () => setOverflowing(container.scrollLeft + container.clientWidth < container.scrollWidth - 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    container.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      container.removeEventListener('scroll', update)
    }
  }, [steps, collapsed])
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
                  <TableHeader>
                    <TableRow data-no-hover>
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
                            className={`text-xs text-muted-foreground ${index === 0 ? 'max-md:sticky max-md:left-0 max-md:z-20' : ''} ${steps && label === 'Action' ? 'sticky right-0 z-20 group-data-[overflow]/queue:shadow-[-12px_0_12px_-12px_rgba(0,0,0,0.25)]' : ''}`}
                          >
                            {label === 'Action' ? (
                              <span className="sr-only">{label}</span>
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
                            ) : (
                              label
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeRecoveries.length > 0 && recoveries && (
                      <>
                        <RecoveryNoticeRow columnCount={columns.length} count={safeRecoveries.length} />
                        {safeRecoveries.map((recovery) => (
                          <RecoveryRow
                            key={recovery.id}
                            recovery={recovery}
                            columns={columns}
                            controller={recoveries}
                          />
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
