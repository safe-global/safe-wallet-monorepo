import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Check, CircleHelp, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
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
import { Typography } from '@safe-global/views/components/ui/typography'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import useMediaQuery from '@/hooks/useMediaQuery'
import { getScenarioAccounts, getTransactionLabel, type RowSecondaryAction } from '../services/model'
import {
  applyPreviewAction,
  createPreviewQueue,
  executePreviewBatches,
  getBulkExecutable,
  proposePreviewAlternative,
  type PreviewAction,
} from '../services/queue'
import { getOutsiders, getRemindable, type MenuAction } from '../services/actions'
import { parsePersona } from '../services/personas'
import { ConfirmActionDialog, type PendingConfirm } from './ConfirmActionDialog'
import type { Direction, Persona, Proposal } from '../types'
import { PrototypeFrame } from './PrototypeFrame'
import { type GroupBy } from './shared'
import { useQueueFilters } from './QueueFilters/useQueueFilters'
import { AppliedFilters, QueueToolbar } from './QueueFilters/QueueFilters'
import { CollapseAllButton, QueueSection } from './QueueTable/QueueSection'
import { QueueGroupedTable } from './QueueTable/QueueGroupedTable'
import { buildSections, rankAccounts } from './QueueTable/sections'
import { ReviewDrawer, type Replacement, type SectionsMode } from './ReviewDrawer/ReviewDrawer'
import { BulkExecuteDrawer } from './BulkExecuteDrawer'
import { SCENARIOS, ScenarioBar, type Hypernative } from './ScenarioBar'
import { RecoveryPanel, useRecoveries } from './Recovery/RecoveryPanel'
import { RecoveryDrawer } from './Recovery/RecoveryDrawer'
import { QueueError, QueueSkeleton } from './QueueStates'

export default function PendingQueue() {
  const router = useRouter()
  return <PendingQueueView key={`${router.query.scenario ?? 'everyday'}:${router.query.option ?? 'table'}`} />
}

function PendingQueueView() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isExtraWide = useMediaQuery('(min-width: 2160px)')
  // One table is the default direction.
  const direction: Direction =
    router.query.option === 'queues' || router.query.option === 'inbox' || router.query.option === 'steps'
      ? router.query.option
      : 'table'
  // One table builds on next steps. Only the table layout differs.
  const steps = direction === 'steps' || direction === 'table'
  const consolidated = direction === 'table'
  const scenario = SCENARIOS.find((item) => item.value === router.query.scenario)?.value ?? 'everyday'
  const persona: Persona = parsePersona(router.query.persona)
  const hypernative: Hypernative = router.query.hn === 'out' || router.query.hn === 'none' ? router.query.hn : 'in'

  const [queue, setQueue] = useState(() => createPreviewQueue(scenario))
  const items = queue.items
  const accounts = getScenarioAccounts(scenario).map((account) => ({
    ...account,
    nextNonce: queue.nextNonces[account.id],
  }))
  const [groupBy, setGroupBy] = useState<GroupBy>(
    consolidated
      ? 'safe'
      : router.query.groupBy === 'status' || router.query.groupBy === 'safe' || router.query.groupBy === 'none'
        ? router.query.groupBy
        : steps
          ? 'safe'
          : 'none',
  )
  const unavailable = scenario === 'loading' || scenario === 'error'
  // Next steps: Safes with nothing for you start collapsed.
  const idleSafeIds = () =>
    steps
      ? buildSections({ visible: items, accounts, accountFilter: [], persona, direction: 'steps', groupBy: 'safe' })
          .filter((section) => section.urgency === undefined)
          .map((section) => section.id)
      : []
  const [collapsedSections, setCollapsedSections] = useState<string[]>(idleSafeIds)
  // Re-seed when the persona changes. The page does not remount for it.
  const [seededPersona, setSeededPersona] = useState(persona)
  if (seededPersona !== persona) {
    setSeededPersona(persona)
    setCollapsedSections(idleSafeIds())
  }
  const [feedback, setFeedback] = useState('')
  const allRecoveries = useRecoveries({ enabled: scenario === 'recovery', persona, onFeedback: setFeedback })
  const filters = useQueueFilters(items, accounts, persona, {}, allRecoveries.visible, steps)
  // A new status filter opens every Safe. Clearing it leaves them as they are.
  const statusKey = filters.stateFilter.join(',')
  const [seededStatus, setSeededStatus] = useState(statusKey)
  if (seededStatus !== statusKey) {
    setSeededStatus(statusKey)
    if (statusKey) setCollapsedSections([])
  }
  // Safe order is set on load and when the person or filters change. Acting on a transaction doesn't move its Safe.
  const rankSafes = () => rankAccounts(accounts, items, persona).map((account) => account.id)
  const [safeOrder, setSafeOrder] = useState(rankSafes)
  const orderKey = [
    persona,
    statusKey,
    filters.accountFilter,
    filters.typeFilter,
    filters.networkFilter,
    filters.conflicting,
    filters.search,
  ].join('|')
  const [seededOrder, setSeededOrder] = useState(orderKey)
  if (seededOrder !== orderKey) {
    setSeededOrder(orderKey)
    setSafeOrder(rankSafes())
  }
  const orderedAccounts = safeOrder.flatMap((id) => accounts.filter((account) => account.id === id))
  const recoveries = {
    ...allRecoveries,
    visible: filters.visibleRecoveries,
    forAccount: (accountId: string) => filters.visibleRecoveries.filter((item) => item.accountId === accountId),
  }
  const [replaceHover, setReplaceHover] = useState<string | null>(null)

  const [review, setReview] = useState<Proposal | null>(null)
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [reviewSections, setReviewSections] = useState<string[]>([])
  const [signersOpen, setSignersOpen] = useState(!steps)
  const [showTechnical, setShowTechnical] = useState(false)
  const [sectionsMode, setSectionsMode] = useState<SectionsMode>('default')
  const [sectionsVersion, setSectionsVersion] = useState(0)
  const toggleAllSections = () => {
    const next = sectionsMode === 'expanded' ? 'collapsed' : 'expanded'
    setSectionsMode(next)
    setSectionsVersion(sectionsVersion + 1)
    setShowTechnical(next === 'expanded')
    setSignersOpen(next === 'expanded')
  }
  const [reject, setReject] = useState(false)
  const [pendingAction, setPendingAction] = useState<PreviewAction | null>(null)
  const [replacement, setReplacement] = useState<Replacement | null>(null)

  const [bulkScope, setBulkScope] = useState<string | null>(null)
  const [bulkHover, setBulkHover] = useState<string[]>([])
  const bulkBatches = getBulkExecutable(items)
  const bulkIds = bulkBatches.flatMap((batch) => batch.proposals.map((tx) => tx.id))
  const reviewBatches =
    bulkScope === null ? [] : bulkBatches.filter((batch) => bulkScope === 'all' || batch.account.id === bulkScope)

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
      setSignersOpen(!steps)
      setSectionsMode('default')
      setShowTechnical(false)
    }
    setFeedback('')
    setCursorId(tx.id)
    setReview(tx)
  }

  const [remindedIds, setRemindedIds] = useState<string[]>([])
  // Remind and Delete ask for confirmation first.
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const remindSigners = (tx: Proposal) => setPendingConfirm({ kind: 'remind', tx })
  const sendReminder = (tx: Proposal) => {
    const names = getRemindable(tx, persona)
    setRemindedIds((ids) => (ids.includes(tx.id) ? ids : [...ids, tx.id]))
    setFeedback(
      `Reminder sent to ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]} in this preview.`,
    )
  }

  // Next steps: Sign and Execute open the drawer confirm step. It replaces the production flow.
  const startFlow = (tx: Proposal, flow: PreviewAction) => {
    reviewTx(tx)
    setPendingAction(flow)
  }

  const runMenuAction = (tx: Proposal, action: MenuAction) => {
    if (action === 'remind') return remindSigners(tx)
    if (action === 'invite') {
      const names = getOutsiders(tx, persona)
      return setFeedback(`Invite sent to ${names.join(', ')} in this preview. They get reminders once they join.`)
    }
    if (action === 'replace' || action === 'reject') {
      reviewTx(tx)
      setReject(true)
      setReviewSections(['cancel'])
      setReplacement(action === 'replace' ? { recipient: tx.recipient, amount: tx.amount } : null)
      return
    }
    if (action === 'delete') return setPendingConfirm({ kind: 'delete', tx })
    const link = new URL(window.location.href)
    link.searchParams.set('tx', tx.id)
    void navigator.clipboard?.writeText(link.toString()).catch(() => undefined)
    setFeedback('Link copied.')
  }

  const deleteTx = (tx: Proposal) => {
    setQueue({ ...queue, items: queue.items.filter((item) => item.id !== tx.id) })
    if (review?.id === tx.id) setReview(null)
    setFeedback(
      `${getTransactionLabel(tx)} deleted from the queue in this preview. Signatures already given stay valid.`,
    )
  }

  const runSecondaryAction = (tx: Proposal, action: RowSecondaryAction) => {
    reviewTx(tx)
    setReject(true)
    setReviewSections(['cancel'])
    if (action === 'replace') setReplacement({ recipient: tx.recipient, amount: tx.amount })
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

  const runBulkExecute = () => {
    const executable = reviewBatches.filter((batch) => batch.proposals.length > 0)
    const count = executable.reduce((total, batch) => total + batch.proposals.length, 0)
    setQueue(executePreviewBatches(queue, executable))
    setBulkScope(null)
    setBulkHover([])
    setFeedback(
      `${count} ${count === 1 ? 'transaction' : 'transactions'} executed in this preview across ${executable.length} ${executable.length === 1 ? 'Safe' : 'Safes'}.`,
    )
  }

  const filtering = filters.applied.length > 0 || filters.search.length > 0
  // Next steps: while filtering, hide Safes with no matches.
  const sections = buildSections({
    visible: filters.visible,
    accounts,
    accountFilter: filters.accountFilter,
    persona,
    direction: steps ? 'steps' : direction,
    groupBy,
    order: steps ? safeOrder : undefined,
  }).filter(
    (section) =>
      !steps ||
      !filtering ||
      section.category !== 'safe' ||
      section.items.length > 0 ||
      recoveries.forAccount(section.account!.id).length > 0,
  )
  const isCollapsed = (id: string) => groupBy !== 'none' && collapsedSections.includes(id)
  const toggleSection = (id: string) =>
    setCollapsedSections((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  const allCollapsed = sections.length > 0 && sections.every((section) => isCollapsed(section.id))
  const toggleAll = () => setCollapsedSections(allCollapsed ? [] : sections.map((section) => section.id))
  const safeBatchFor = (section: { account?: { id: string } }) =>
    section.account ? bulkBatches.find((batch) => batch.account.id === section.account?.id) : undefined
  // "Go to #N": open the section of the blocking transaction, then select it and open its review.
  const goTo = (tx: Proposal) => {
    const section = sections.find((candidate) => candidate.items.some((item) => item.id === tx.id))
    if (section && isCollapsed(section.id)) toggleSection(section.id)
    reviewTx(tx)
  }
  const reviewOrder = sections.filter((section) => !isCollapsed(section.id)).flatMap((section) => section.items)
  const reviewIndex = review ? reviewOrder.findIndex((tx) => tx.id === review.id) : -1
  const stepReview = (offset: number) => {
    const next = reviewIndex >= 0 ? reviewOrder[reviewIndex + offset] : undefined
    if (next) reviewTx(next, true)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))
        return
      const command = event.metaKey || event.ctrlKey
      if (command || event.altKey || bulkScope !== null) return
      const offset = event.key === 'j' ? 1 : event.key === 'k' ? -1 : 0
      if (review) {
        if (offset) stepReview(offset)
        if (event.key === 'e' && steps) toggleAllSections()
        return
      }
      const cursorIndex = reviewOrder.findIndex((tx) => tx.id === cursorId)
      if (offset) {
        const next = cursorIndex < 0 ? reviewOrder[0] : reviewOrder[cursorIndex + offset]
        if (next) setCursorId(next.id)
      }
      // Enter on a focused button already opens its own target.
      if (
        event.key === 'Enter' &&
        cursorIndex >= 0 &&
        !(event.target instanceof Element && event.target.closest('button, a'))
      )
        reviewTx(reviewOrder[cursorIndex])
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

  useEffect(() => {
    if (!review) document.querySelector('tr[data-cursor]')?.scrollIntoView?.({ block: 'nearest' })
  }, [cursorId, review])

  const sectionProps = {
    items,
    persona,
    groupBy,
    steps,
    isWide,
    showNoteText: steps && isExtraWide,
    onBulkExecute: setBulkScope,
    onGroupByChange: setGroupBy,
    reviewId: review?.id,
    cursorId: review ? undefined : (cursorId ?? undefined),
    bulkHover,
    replaceHover,
    onReplaceHover: setReplaceHover,
    onReview: reviewTx,
    onSecondaryAction: runSecondaryAction,
    remindedIds,
    onRemind: steps ? remindSigners : undefined,
    onGoTo: steps ? goTo : undefined,
    onStartFlow: steps ? startFlow : undefined,
    onMenuAction: steps ? runMenuAction : undefined,
    recoveries: steps ? recoveries : undefined,
  }

  return (
    <div className="min-h-screen bg-secondary text-foreground">
      <PrototypeFrame>
        <main className="min-w-0 px-6 pb-8 pt-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Typography as="h1" variant="h3">
              Transactions
            </Typography>
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
          </div>
          {feedback && !review && (
            <p role="status" className="mb-4 text-sm">
              {feedback}
            </p>
          )}
          <section aria-label="Queue">
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
            <QueueToolbar
              filters={filters}
              accounts={steps ? orderedAccounts : accounts}
              hasItems={items.length > 0}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              groupingAsView={steps}
              hideViewSwitch={consolidated}
            />
            <AppliedFilters filters={filters} groupBy={groupBy} onGroupByChange={setGroupBy} groupingAsView={steps} />
            {!(steps && groupBy === 'safe') && <RecoveryPanel controller={recoveries} isWide={isWide} />}
            {scenario === 'loading' && <QueueSkeleton />}
            {scenario === 'error' && <QueueError onRetry={() => setOption({ scenario: 'everyday' })} />}
            {!unavailable && !filters.visible.length && !recoveries.visible.length && (
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
                    <Button variant="outline" onClick={filters.reset}>
                      Clear filters
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            )}
            {!unavailable && (filters.visible.length > 0 || recoveries.visible.length > 0) && consolidated && (
              <QueueGroupedTable
                sections={sections}
                isCollapsed={isCollapsed}
                onToggle={toggleSection}
                getSafeBatch={safeBatchFor}
                collapse={{ allCollapsed, onToggle: toggleAll }}
                {...sectionProps}
              />
            )}
            {!unavailable && (filters.visible.length > 0 || recoveries.visible.length > 0) && !consolidated && (
              <div className={`flex flex-col ${steps ? 'gap-6' : 'gap-10'}`}>
                {/* Next steps: right-aligned over the section chevrons. */}
                {steps && groupBy !== 'none' && (
                  <div className="-mb-4 flex justify-end">
                    <CollapseAllButton allCollapsed={allCollapsed} onToggle={toggleAll} />
                  </div>
                )}
                {sections.map((section) => (
                  <QueueSection
                    key={section.id}
                    section={section}
                    collapsed={isCollapsed(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    safeBatch={safeBatchFor(section)}
                    {...sectionProps}
                  />
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CircleHelp className="size-4" />A proposal can need your signature and still wait on earlier
                transactions.
              </span>
              {!isMobile && filters.visible.length > 0 && (
                <span className="flex items-center gap-1">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd> to move, <Kbd>Enter</Kbd> to open
                </span>
              )}
            </div>
          </section>
        </main>
        <ScenarioBar
          direction={direction}
          scenario={scenario}
          hypernative={hypernative}
          persona={persona}
          onChange={setOption}
        />
        <ReviewDrawer
          review={review}
          items={items}
          persona={persona}
          isMobile={isMobile}
          position={{ index: reviewIndex, count: reviewOrder.length }}
          layout={{
            sections: reviewSections,
            setSections: setReviewSections,
            signersOpen,
            setSignersOpen,
            reject,
            setReject,
            pendingAction,
            setPendingAction,
            replacement,
            setReplacement,
            sectionsMode,
            sectionsVersion,
            toggleAllSections,
          }}
          feedback={feedback}
          onStep={stepReview}
          onClose={() => setReview(null)}
          onReview={reviewTx}
          onAction={performAction}
          onProposeAlternative={proposeAlternative}
          steps={steps}
          remindedIds={remindedIds}
          onRemind={remindSigners}
          onMenuAction={runMenuAction}
          hypernative={hypernative}
          showTechnical={showTechnical}
          onToggleTechnical={() => setShowTechnical(!showTechnical)}
        />
        <RecoveryDrawer
          recovery={recoveries.open}
          primary={recoveries.open ? recoveries.getPrimary(recoveries.open) : undefined}
          canCancel={recoveries.open ? recoveries.canCancel(recoveries.open) : false}
          onCancel={() => recoveries.open && recoveries.cancel(recoveries.open)}
          onClose={() => recoveries.setOpenId(null)}
        />
        <ConfirmActionDialog
          confirm={pendingConfirm}
          persona={persona}
          onCancel={() => setPendingConfirm(null)}
          onConfirm={({ kind, tx }) => {
            setPendingConfirm(null)
            if (kind === 'delete') deleteTx(tx)
            else sendReminder(tx)
          }}
        />
        <BulkExecuteDrawer
          open={bulkScope !== null}
          batches={reviewBatches}
          isMobile={isMobile}
          onClose={() => {
            setBulkScope(null)
            setBulkHover([])
          }}
          onExecute={runBulkExecute}
        />
      </PrototypeFrame>
    </div>
  )
}
