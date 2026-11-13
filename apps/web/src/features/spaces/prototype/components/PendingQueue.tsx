import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Bell, Check, CircleHelp, LoaderCircle, ShieldAlert, ShieldCheck, UserPlus, Wallet } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
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
import { useElementWidth } from '../hooks/useElementWidth'
import {
  getConflicts,
  getOutstandingSigners,
  getScenario,
  getScenarioAccounts,
  getSignerName,
  getState,
  getTransactionLabel,
} from '../services/model'
import { getSignerLoad } from '../services/flags'
import {
  applyPreviewAction,
  createPreviewQueue,
  executePreviewBatches,
  getBulkExecutable,
  ALL_FAILED,
  getFailedAccounts,
  getUndeployedAccounts,
  CAPPED_EXTRA,
  getIncomingProposal,
  proposePreviewAlternative,
  type PreviewAction,
} from '../services/queue'
import { LoadStatusChip, NothingLoaded } from './LoadWarnings'
import { FAILED_COUNTS, UNDEPLOYED_COUNTS } from './ScenarioBar'
import { getOutsiders, getRemindable, type MenuAction } from '../services/actions'
import {
  advanceExecution,
  getLockingTx,
  getInitialExecutions,
  speedUpExecution,
  startExecution,
  type Executions,
} from '../services/execution'
import { canInvite, isYou, parsePersona } from '../services/personas'
import { ConfirmActionDialog, type PendingConfirm } from './ConfirmActionDialog'
import type { Persona, Proposal, Milestone, QueueView, WalletState } from '../types'
import { PrototypeFrame } from './PrototypeFrame'
import { useQueueFilters } from './QueueFilters/useQueueFilters'
import { AppliedFilters, QueueToolbar, type AppliedPill } from './QueueFilters/QueueFilters'
import { QueueGroupedTable, QueueOrderedTable } from './QueueTable/QueueGroupedTable'
import { CompactQueueList } from './QueueTable/CompactQueueList'
import { DisplayMenu } from './QueueTable/DisplayMenu'
import { GROUP_SORT, groupQueue, loadDisplay, orderQueue, saveDisplay, type QueueDisplay } from '../services/order'
import { buildSections, rankAccounts } from './QueueTable/sections'
import { ReviewDrawer, type Replacement, type SectionsMode } from './ReviewDrawer/ReviewDrawer'
import { BulkExecuteDrawer } from './BulkExecuteDrawer'
import { parseScenario, ScenarioBar, type Hypernative, type LoadReason } from './ScenarioBar'
import { useRecoveries } from './Recovery/RecoveryPanel'
import { RecoveryDrawer } from './Recovery/RecoveryDrawer'
import { QueueError, QueueSkeleton } from './QueueStates'
import { SignerFilterMenu } from './QueueFilters/SignerFilterMenu'

export default function PendingQueue() {
  const router = useRouter()
  const { scenario, state } = parseScenario(router.query)
  return <PendingQueueView key={`${scenario}:${state}:${router.query.failed ?? 4}:${router.query.m ?? 1}`} />
}

function PendingQueueView() {
  const router = useRouter()
  const isMobile = useIsMobile()
  // Columns follow the content width, so opening the sidebar drops them too.
  const [mainRef, contentWidth] = useElementWidth<HTMLElement>()
  const isWide = contentWidth >= 1050
  const isExtraWide = contentWidth >= 1880
  // Opens as the Status list, most urgent first. Group by changes it. Old `?option=` links open the same page.
  const [display, setDisplay] = useState(loadDisplay)
  // Grouped by Safe: each Safe, then each network, so nonces stay in order.
  const safeView = display.groupBy === 'safe'
  const changeDisplay = (next: QueueDisplay) => {
    setDisplay(next)
    saveDisplay(next)
  }
  const { scenario, state } = parseScenario(router.query)
  // M1 by default: no drawer, bulk execute, Remind or Safenet marks. `?m=2` shows them.
  const milestone: Milestone = router.query.m === '2' ? 2 : 1
  const pickedPersona: Persona = parsePersona(router.query.persona)
  const wallet: WalletState = router.query.wallet === 'none' ? 'none' : 'connected'
  // Phones get the compact list. `?view=table` keeps the table there to compare. Wider screens always get the table.
  const view: QueueView = isMobile && router.query.view !== 'table' ? 'compact' : 'table'
  // Option: the Safe, type and summary line up in fixed widths.
  const aligned = router.query.align === 'fixed'
  // Without a wallet, nobody is "you": rows show what anyone can see, and no row asks for your signature.
  const persona: Persona = wallet === 'none' ? 'guest' : pickedPersona
  const hypernative: Hypernative = router.query.hn === 'out' || router.query.hn === 'none' ? router.query.hn : 'in'
  // Partial loading: how many Safes fail (`?failed=3`). 4 by default.
  // Undeployed Safes (`?undeployed=1|2`) are skipped quietly.
  const failedCount =
    router.query.failed === 'all'
      ? ALL_FAILED
      : (FAILED_COUNTS.find((count) => String(count) === router.query.failed) ?? 4)
  // Why the Safes didn't load (`?reason=limit`): past the 100 Safes one queue request covers, Reload can't help.
  const loadReason: LoadReason = router.query.reason === 'limit' ? 'limit' : 'error'
  const undeployedCount = UNDEPLOYED_COUNTS.find((count) => String(count) === router.query.undeployed) ?? 0
  const undeployedIds =
    state === 'partial'
      ? getUndeployedAccounts(scenario, failedCount, undeployedCount).map((account) => account.id)
      : []

  const [queue, setQueue] = useState(() => createPreviewQueue(scenario, state, { failedCount, undeployedCount }))
  const [failedIds, setFailedIds] = useState(() =>
    state === 'partial' ? getFailedAccounts(scenario, failedCount).map((account) => account.id) : [],
  )
  const [retrying, setRetrying] = useState<string[]>([])
  const retryTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => retryTimers.current.forEach(clearTimeout), [])
  // Try again succeeds after a short wait, and the Safe's rows join the queue.
  const retryLoad = (ids: string[]) => {
    setRetrying((current) => [...new Set([...current, ...ids])])
    retryTimers.current.push(
      setTimeout(() => {
        const rows = getScenario(scenario).filter((tx) => ids.includes(tx.account))
        setQueue((current) => ({ ...current, items: [...current.items, ...rows] }))
        setFailedIds((current) => current.filter((id) => !ids.includes(id)))
        setRetrying((current) => current.filter((id) => !ids.includes(id)))
      }, 900),
    )
  }
  // Execute runs through Processing and Indexing before the queue updates.
  const [executions, setExecutions] = useState<Executions>(() => getInitialExecutions(queue.items, state, Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const executing = Object.keys(executions).length > 0
  useEffect(() => {
    if (!executing) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [executing])
  const items = queue.items
  const accounts = getScenarioAccounts(scenario).map((account) => ({
    ...account,
    nextNonce: queue.nextNonces[account.id],
  }))
  const unavailable = state === 'loading' || state === 'error'
  // When no Safe loads, the page says why instead of showing an empty queue.
  const nothingLoaded =
    state === 'partial' && failedIds.length > 0 && failedIds.length + undeployedIds.length >= accounts.length
  // Safes with nothing for you start collapsed.
  const idleSafeIds = () =>
    buildSections({ visible: items, accounts, accountFilter: [], persona })
      .filter((section) => section.urgency === undefined)
      .map((section) => section.id)
  const [collapsedSections, setCollapsedSections] = useState<string[]>(idleSafeIds)
  // Re-seed when the persona changes. The page does not remount for it.
  const [seededPersona, setSeededPersona] = useState(persona)
  if (seededPersona !== persona) {
    setSeededPersona(persona)
    setCollapsedSections(idleSafeIds())
  }
  const [feedback, setFeedback] = useState('')
  // New proposal arrives: the refresh adds a transaction that needs you, and says so, as production's poll does.
  useEffect(() => {
    if (state !== 'incoming') return
    const timer = setTimeout(() => {
      setQueue((current) => {
        const incoming = getIncomingProposal(current.items, persona)
        return incoming && !current.items.some((tx) => tx.id === incoming.id)
          ? { ...current, items: [...current.items, incoming] }
          : current
      })
      setFeedback('A transaction requires your confirmation.')
    }, 4000)
    return () => clearTimeout(timer)
  }, [state, persona])
  // Recoveries come with the 20 and 50 Safe mixes, on their first three Safes, in the Safe view.
  const allRecoveries = useRecoveries({
    enabled: (scenario === '20-safes' || scenario === '50-safes') && state === 'normal' && safeView,
    accountIds: getScenarioAccounts(scenario)
      .slice(0, 3)
      .map((account) => account.id),
    persona,
    onFeedback: setFeedback,
  })
  // A signer narrows the queue on top of the toolbar filters.
  const [signerFocus, setSignerFocus] = useState<string | null>(null)
  const signerOptions = [...new Set(accounts.flatMap((account) => account.owners))].map((id) => ({
    title: 'Signer',
    label: getSignerName(id),
    names: [getSignerName(id)],
    apply: () => setSignerFocus(id),
    test: (tx: Proposal) => getState(tx, persona).missing > 0 && getOutstandingSigners(tx).includes(id),
  }))
  const filters = useQueueFilters(items, accounts, persona, {}, allRecoveries.visible, signerOptions)
  const visible = filters.visible.filter(
    (tx) => !signerFocus || (getState(tx, persona).missing > 0 && getOutstandingSigners(tx).includes(signerFocus)),
  )
  // A new status filter, or text that previews one, opens every Safe. Clearing it leaves them as they are.
  const statusKey = [
    filters.stateFilter.join(','),
    filters.flags.join(','),
    signerFocus,
    filters.searchMatch?.labels.join(','),
  ].join('|')
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
    filters.flags,
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
  // The J/K cursor stays after the drawer closes only for keyboard users. A click clears it on close.
  const usingKeys = useRef(false)
  const [reviewSections, setReviewSections] = useState<string[]>([])
  // The drawer opens on the signatures list, with every section above it collapsed.
  const [signersOpen, setSignersOpen] = useState(true)
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
  // A transaction that is executing, or locked by one, can't join a bulk execute.
  const bulkBatches = getBulkExecutable(
    items.filter((tx) => !executions[tx.id] && !getLockingTx(tx, items, executions)),
  )
  const reviewBatches =
    bulkScope === null ? [] : bulkBatches.filter((batch) => bulkScope === 'all' || batch.account.id === bulkScope)

  const setOption = (changes: Record<string, string>) => {
    setReview(null)
    setFeedback('')
    void router.replace({ pathname: router.pathname, query: { ...router.query, ...changes } }, undefined, {
      shallow: true,
    })
  }

  // M1 has no drawer: the action opens the transaction on its Safe's transaction page
  const openTxPage = (tx: Proposal) =>
    setFeedback(`${getTransactionLabel(tx)} opens on its transaction page in the product.`)
  const reviewTx = (tx: Proposal, keepLayout = false) => {
    setReject(false)
    setPendingAction(null)
    setReplacement(null)
    if (!keepLayout) {
      setReviewSections([])
      setSignersOpen(true)
      setSectionsMode('default')
      setShowTechnical(false)
    }
    setFeedback('')
    setCursorId(tx.id)
    // M1 has no drawer: Go to and the keyboard only move the highlight
    if (milestone === 2) setReview(tx)
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

  // Sign and Execute open the drawer confirm step. It replaces the production flow.
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

  const performAction = (action: PreviewAction, target = review) => {
    if (!target) return
    const updated = applyPreviewAction(queue, target.id, persona, action)
    if (updated === queue || executions[target.id]) {
      setFeedback('This action is no longer available. Review the current queue state.')
      setPendingAction(null)
      return
    }
    setPendingAction(null)
    if (action === 'sign') {
      setQueue(updated)
      if (review) setReview(updated.items.find((item) => item.id === target.id) ?? null)
      setFeedback('Signature added in this preview. Execution may still need other signatures or earlier transactions.')
      return
    }
    // The transaction stays in the queue while it executes. Sign and execute adds your signature first.
    const signed = action === 'signAndExecute' ? applyPreviewAction(queue, target.id, persona, 'sign') : queue
    setQueue(signed)
    setExecutions({ ...executions, [target.id]: startExecution(target.id, Date.now()) })
    setNow(Date.now())
    setReview(null)
    setFeedback(`${getTransactionLabel(target)} submitted in this preview. The queue updates once it's indexed.`)
  }
  const speedUp = (id: string) => {
    setExecutions({ ...executions, [id]: speedUpExecution(executions[id], Date.now()) })
    setFeedback('Speed up sent in this preview. The same transaction is resubmitted with a higher fee.')
  }
  // Each tick moves executions on. One that finishes indexing leaves the queue, with any conflicts at its nonce.
  const [advancedAt, setAdvancedAt] = useState(now)
  if (advancedAt !== now) {
    setAdvancedAt(now)
    let next = queue
    const remaining: Executions = {}
    const finished: Proposal[] = []
    for (const [id, execution] of Object.entries(executions)) {
      const result = advanceExecution(execution, now)
      const tx = next.items.find((item) => item.id === id)
      if (result !== 'done' && tx) remaining[id] = result
      else if (tx) {
        next = applyPreviewAction(next, id, persona, 'execute')
        finished.push(tx)
      }
    }
    const ids = Object.keys(executions)
    if (ids.length !== Object.keys(remaining).length || ids.some((id) => remaining[id] !== executions[id]))
      setExecutions(remaining)
    if (finished.length) {
      setQueue(next)
      if (review && finished.some((tx) => tx.id === review.id)) setReview(null)
      const [tx] = finished
      const invalid = getConflicts(tx, queue.items).length
      setFeedback(
        `${getTransactionLabel(tx)} executed in this preview. Next nonce is #${tx.nonce + 1}.${invalid ? ` ${invalid === 1 ? 'The conflicting transaction is' : `${invalid} conflicting transactions are`} now invalid.` : ''}`,
      )
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

  const filtering = filters.applied.length > 0 || filters.search.length > 0 || !!signerFocus
  // While filtering, hide Safes with no matches.
  const sections = buildSections({
    visible,
    accounts,
    accountFilter: filters.accountFilter,
    persona,
    order: safeOrder,
  }).filter((section) => !filtering || section.items.length > 0 || recoveries.forAccount(section.account.id).length > 0)
  const signerLoad = getSignerLoad(filters.visible, accounts, persona)
  const focusedLoad = signerLoad.find((signer) => signer.id === signerFocus)
  const signerPills: AppliedPill[] = [
    ...(signerFocus
      ? [
          {
            section: 'signer',
            title: 'Signer',
            values: [getSignerName(signerFocus)],
            clear: () => setSignerFocus(null),
          },
        ]
      : []),
  ]
  const resetFilters = () => {
    filters.reset()
    setSignerFocus(null)
  }
  const isCollapsed = (id: string) => collapsedSections.includes(id)
  const toggleSection = (id: string) =>
    setCollapsedSections((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  const allCollapsed = sections.length > 0 && sections.every((section) => isCollapsed(section.id))
  const toggleAll = () => setCollapsedSections(allCollapsed ? [] : sections.map((section) => section.id))
  const safeBatchFor = (section: { account: { id: string } }) =>
    bulkBatches.find((batch) => batch.account.id === section.account.id)
  // "Go to #N": open the section of the blocking transaction, then select it and open its review.
  const goTo = (tx: Proposal) => {
    const section = sections.find((candidate) => candidate.items.some((item) => item.id === tx.id))
    if (section && isCollapsed(section.id)) toggleSection(section.id)
    reviewTx(tx)
  }
  const orderedRows = !safeView
    ? orderQueue(visible, { sort: GROUP_SORT[display.groupBy], accounts: orderedAccounts })
    : []
  const orderedGroups = !safeView
    ? groupQueue(
        orderedRows,
        display.groupBy === 'safe' || display.groupBy === 'none' ? 'status' : display.groupBy,
        persona,
      )
    : []
  const reviewOrder = !safeView
    ? orderedGroups.flatMap((group) => group.rows)
    : sections.filter((section) => !isCollapsed(section.id)).flatMap((section) => section.items)
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
      if (offset || event.key === 'Enter') usingKeys.current = true
      if (review) {
        if (offset) stepReview(offset)
        if (event.key === 'e') toggleAllSections()
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
    const onPointerDown = () => {
      usingKeys.current = false
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  })

  const linkedTx = typeof router.query.tx === 'string' ? router.query.tx : undefined
  const openedLink = useRef<string>(undefined)
  useEffect(() => {
    const linked = queue.items.find((tx) => tx.id === linkedTx)
    if (!linked || openedLink.current === linkedTx) return
    openedLink.current = linkedTx
    if (milestone === 2) setReview(linked)
  }, [linkedTx, queue.items, milestone])

  useEffect(() => {
    document.querySelector('tr[data-state="selected"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [review?.id])

  useEffect(() => {
    if (!review) document.querySelector('tr[data-cursor]')?.scrollIntoView?.({ block: 'nearest' })
  }, [cursorId, review])

  const sectionProps = {
    items,
    persona,
    isWide,
    showNoteText: isExtraWide,
    onBulkExecute: setBulkScope,
    reviewId: review?.id,
    cursorId: review ? undefined : (cursorId ?? undefined),
    bulkHover,
    replaceHover,
    onReplaceHover: setReplaceHover,
    // M1: the action button opens the transaction page instead of the drawer
    onReview: milestone === 2 ? reviewTx : openTxPage,
    remindedIds,
    onRemind: remindSigners,
    onGoTo: goTo,
    onStartFlow: milestone === 2 ? startFlow : openTxPage,
    onMenuAction: runMenuAction,
    recoveries,
    executions,
    now,
    onSpeedUp: speedUp,
    safeTable: safeView,
    // D and E share one row: the Safe tag (icon, name and network) and the other party as tags, no Safe column
    partyTags: true,
    aligned,
    compact: isMobile,
    milestone,
  }

  return (
    <div className="min-h-screen bg-secondary text-foreground">
      <PrototypeFrame>
        <main ref={mainRef} className="@container min-w-0 px-6 pb-8 pt-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Typography as="h1" variant="h3">
                Transactions
              </Typography>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* With many Safes the executing row can be off screen. This jumps to it. */}
              {executing && (
                <Button
                  size="2xs"
                  variant="outline"
                  onClick={() => {
                    const tx = items.find((item) => executions[item.id])
                    if (!tx) return
                    setCollapsedSections((ids) => ids.filter((id) => id !== `safe-${tx.account}`))
                    setCursorId(tx.id)
                  }}
                >
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                  {Object.keys(executions).length} executing
                </Button>
              )}
              {hypernative === 'in' && (
                // Under 600px of content, only the shield shows. Its tooltip names it.
                <Tooltip delay={300}>
                  <TooltipTrigger render={<span className="flex items-center gap-1.5 text-xs text-muted-foreground" />}>
                    <ShieldCheck className="size-4 text-success-strong" aria-hidden="true" />
                    <span className="@max-[600px]:sr-only">Logged in to Hypernative</span>
                  </TooltipTrigger>
                  <TooltipContent>Logged in to Hypernative</TooltipContent>
                </Tooltip>
              )}
              {hypernative === 'out' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldAlert className="size-4 text-warning-strong" aria-hidden="true" />
                  <span className="@max-[600px]:sr-only">Hypernative not connected</span>
                  <Button size="2xs" variant="outline">
                    Log in
                  </Button>
                </span>
              )}
              {/* Safes that didn't load, next to Hypernative so it reads as page status. */}
              {!nothingLoaded && (
                <LoadStatusChip
                  failed={accounts.filter((account) => failedIds.includes(account.id))}
                  overLimit={loadReason === 'limit'}
                  retrying={retrying}
                  onRetry={retryLoad}
                />
              )}
              {wallet === 'none' && (
                <Tooltip delay={300}>
                  <TooltipTrigger
                    render={<Button size="2xs" variant="outline" onClick={() => setOption({ wallet: 'connected' })} />}
                  >
                    <Wallet aria-hidden="true" />
                    Connect wallet
                  </TooltipTrigger>
                  <TooltipContent>See what needs your signature</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {feedback && !review && (
            <p role="status" className="mb-4 text-sm">
              {feedback}
            </p>
          )}
          {/* Over 500 transactions: only without filters, which ask the gateway for a narrower queue. */}
          {state === 'capped' && filters.applied.length === 0 && !filters.search && (
            <p className="mb-4 text-xs text-muted-foreground">
              Showing {items.length} of {items.length + CAPPED_EXTRA} pending transactions.
            </p>
          )}
          <section aria-label="Queue">
            <QueueToolbar
              filters={filters}
              accounts={orderedAccounts}
              status={<DisplayMenu display={display} onChange={changeDisplay} />}
              extraMenu={
                <SignerFilterMenu
                  load={signerLoad}
                  persona={persona}
                  signer={signerFocus}
                  onSignerChange={setSignerFocus}
                />
              }
            />
            <AppliedFilters
              filters={filters}
              extra={signerPills}
              actions={
                focusedLoad &&
                !isYou(focusedLoad.id, persona) &&
                (focusedLoad.member || canInvite(persona)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFeedback(
                        focusedLoad.member
                          ? `Reminder sent to ${getSignerName(focusedLoad.id)} for ${focusedLoad.txs.length} ${focusedLoad.txs.length === 1 ? 'transaction' : 'transactions'} in this preview.`
                          : `Invite sent to ${getSignerName(focusedLoad.id)} in this preview. They get reminders once they join.`,
                      )
                    }
                  >
                    {focusedLoad.member ? <Bell /> : <UserPlus />}
                    {focusedLoad.member ? 'Remind' : 'Invite'} {getSignerName(focusedLoad.id)}
                  </Button>
                )
              }
            />
            {state === 'loading' && <QueueSkeleton />}
            {state === 'error' && <QueueError onRetry={() => setOption({ state: 'normal' })} />}
            {nothingLoaded && (
              <NothingLoaded
                failed={accounts.filter((account) => failedIds.includes(account.id))}
                retrying={retrying}
                onRetry={retryLoad}
              />
            )}
            {!unavailable && !nothingLoaded && !visible.length && !recoveries.visible.length && (
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
            {!unavailable && view === 'compact' && reviewOrder.length > 0 && (
              <CompactQueueList
                rows={reviewOrder}
                items={items}
                persona={persona}
                milestone={milestone}
                remindedIds={remindedIds}
                executions={executions}
                now={now}
                onReview={sectionProps.onReview}
                onStartFlow={sectionProps.onStartFlow}
                onGoTo={goTo}
                onRemind={remindSigners}
                onMenuAction={runMenuAction}
                onSpeedUp={speedUp}
              />
            )}
            {!unavailable && view === 'table' && !safeView && visible.length > 0 && (
              <QueueOrderedTable
                groups={orderedGroups}
                groupBy={display.groupBy === 'safe' || display.groupBy === 'none' ? 'status' : display.groupBy}
                plain={display.groupBy === 'none'}
                {...sectionProps}
              />
            )}
            {!unavailable && view === 'table' && safeView && (visible.length > 0 || recoveries.visible.length > 0) && (
              <QueueGroupedTable
                sections={sections}
                isCollapsed={isCollapsed}
                onToggle={toggleSection}
                getSafeBatch={milestone === 2 ? safeBatchFor : () => undefined}
                collapse={{ allCollapsed, onToggle: toggleAll, count: sections.length }}
                failedSafes={{
                  accounts: accounts.filter((account) => failedIds.includes(account.id)),
                  retrying,
                  onRetry: retryLoad,
                }}
                {...sectionProps}
              />
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <CircleHelp className="size-4" />A proposal can need your signature and still wait on earlier
                transactions.
              </span>
              {!isMobile && visible.length > 0 && milestone === 2 && (
                <span className="flex items-center gap-1">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd> to move, <Kbd>Enter</Kbd> to open
                </span>
              )}
            </div>
          </section>
        </main>
        <ScenarioBar
          wallet={wallet}
          view={isMobile ? view : undefined}
          aligned={isMobile ? undefined : aligned}
          scenario={scenario}
          state={state}
          hypernative={hypernative}
          persona={pickedPersona}
          milestone={milestone}
          failedCount={failedCount}
          loadReason={loadReason}
          undeployedCount={undeployedCount}
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
          onClose={() => {
            setReview(null)
            if (!usingKeys.current) setCursorId(null)
          }}
          onReview={reviewTx}
          onAction={performAction}
          onProposeAlternative={proposeAlternative}
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
