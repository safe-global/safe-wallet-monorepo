import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Check, CircleHelp, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@safe-global/views/components/ui/tabs'
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
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Kbd } from '@safe-global/views/components/ui/kbd'
import { useIsMobile } from '@safe-global/views/hooks/use-mobile'
import useMediaQuery from '@/hooks/useMediaQuery'
import {
  accounts as fixtureAccounts,
  getAccount,
  getTransactionLabel,
  getTypeLabel,
  type RowSecondaryAction,
} from '../services/model'
import {
  applyPreviewAction,
  createPreviewQueue,
  executePreviewBatches,
  getBulkExecutable,
  proposePreviewAlternative,
  type PreviewAction,
} from '../services/queue'
import type { Direction, Persona, Proposal } from '../types'
import { PrototypeFrame } from './PrototypeFrame'
import { TYPE_ICONS, type GroupBy } from './shared'
import { useQueueFilters } from './QueueFilters/useQueueFilters'
import { AppliedFilters, QueueToolbar } from './QueueFilters/QueueFilters'
import { QueueSection } from './QueueTable/QueueSection'
import { buildSections } from './QueueTable/sections'
import { ReviewDrawer, type Replacement } from './ReviewDrawer/ReviewDrawer'
import { BulkExecuteDrawer } from './BulkExecuteDrawer'
import { SCENARIOS, ScenarioBar, type Hypernative } from './ScenarioBar'
import { PinCommentLayer } from './PinComments/PinCommentLayer'
import { CommentFab } from './PinComments/CommentFab'
import { PENDING_QUEUE_FEEDBACK } from './PinComments/linearIssue'

const HISTORY_HOVER: Partial<Record<ReturnType<typeof getTypeLabel>, string>> = {
  Send: 'group-hover/history:text-destructive group-focus-visible/history:text-destructive',
}

export default function PendingQueue() {
  const router = useRouter()
  return <PendingQueueView key={String(router.query.scenario ?? 'everyday')} />
}

function PendingQueueView() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isWide = useMediaQuery('(min-width: 1280px)')
  const direction: Direction = router.query.option === 'inbox' ? 'inbox' : 'queues'
  const scenario = SCENARIOS.find((item) => item.value === router.query.scenario)?.value ?? 'everyday'
  const persona: Persona = router.query.persona === 'observer' ? 'observer' : 'owner'
  const hypernative: Hypernative = router.query.hn === 'out' || router.query.hn === 'none' ? router.query.hn : 'in'

  const [queue, setQueue] = useState(() => createPreviewQueue(scenario))
  const items = queue.items
  const accounts = fixtureAccounts.map((account) => ({ ...account, nextNonce: queue.nextNonces[account.id] }))
  const filters = useQueueFilters(items, accounts, persona)
  const [pageTab, setPageTab] = useState('queue')
  const [groupBy, setGroupBy] = useState<GroupBy>(
    router.query.groupBy === 'status' || router.query.groupBy === 'safe' ? router.query.groupBy : 'none',
  )
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [replaceHover, setReplaceHover] = useState<string | null>(null)
  const [commenting, setCommenting] = useState(false)
  const toggleCommenting = () => setCommenting(!commenting)

  const [review, setReview] = useState<Proposal | null>(null)
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [reviewSections, setReviewSections] = useState<string[]>([])
  const [signersOpen, setSignersOpen] = useState(true)
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
      setSignersOpen(true)
    }
    setFeedback('')
    setCursorId(tx.id)
    setReview(tx)
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

  const sections = buildSections({
    visible: filters.visible,
    accounts,
    accountFilter: filters.accountFilter,
    persona,
    direction,
    groupBy,
  })
  const isCollapsed = (id: string) => groupBy !== 'none' && collapsedSections.includes(id)
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
      // Cmd/Ctrl+C only means "comment" when nothing is selected, so copying text still works.
      if (event.key === 'c' && !event.altKey && (!command || window.getSelection()?.isCollapsed !== false)) {
        if (command) event.preventDefault()
        setCommenting(true)
        return
      }
      if (command || event.altKey || commenting || bulkScope !== null) return
      const offset = event.key === 'j' ? 1 : event.key === 'k' ? -1 : 0
      if (review) {
        if (offset) stepReview(offset)
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
              <QueueToolbar
                filters={filters}
                accounts={accounts}
                persona={persona}
                hasItems={items.length > 0}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
              />
              <AppliedFilters filters={filters} groupBy={groupBy} onGroupByChange={setGroupBy} />
              {!filters.visible.length && (
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
              {filters.visible.length > 0 && (
                <div className="flex flex-col gap-10">
                  {sections.map((section) => (
                    <QueueSection
                      key={section.id}
                      section={section}
                      items={items}
                      persona={persona}
                      groupBy={groupBy}
                      isWide={isWide}
                      collapsed={isCollapsed(section.id)}
                      onToggle={() =>
                        setCollapsedSections(
                          isCollapsed(section.id)
                            ? collapsedSections.filter((id) => id !== section.id)
                            : [...collapsedSections, section.id],
                        )
                      }
                      safeBatch={
                        section.account
                          ? bulkBatches.find((batch) => batch.account.id === section.account?.id)
                          : undefined
                      }
                      onBulkExecute={setBulkScope}
                      onGroupByChange={setGroupBy}
                      reviewId={review?.id}
                      cursorId={review ? undefined : (cursorId ?? undefined)}
                      bulkHover={bulkHover}
                      replaceHover={replaceHover}
                      onReplaceHover={setReplaceHover}
                      onReview={reviewTx}
                      onSecondaryAction={runSecondaryAction}
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
          }}
          feedback={feedback}
          onStep={stepReview}
          onClose={() => setReview(null)}
          onReview={reviewTx}
          onAction={performAction}
          onProposeAlternative={proposeAlternative}
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
        <CommentFab active={commenting} onToggle={toggleCommenting} />
        <PinCommentLayer
          active={commenting}
          onEnter={() => setCommenting(true)}
          onExit={() => setCommenting(false)}
          target={PENDING_QUEUE_FEEDBACK}
          transaction={
            review
              ? { id: review.id, label: `${getTransactionLabel(review)} · ${getAccount(review).name} #${review.nonce}` }
              : undefined
          }
        />
      </PrototypeFrame>
    </div>
  )
}
