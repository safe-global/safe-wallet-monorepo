import { useCallback, useMemo, useState, type SyntheticEvent } from 'react'
import { useRouter } from 'next/router'
import { Plus } from 'lucide-react'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AddCustomAppModal } from '@/components/safe-apps/AddCustomAppModal'
import SafeAppsZeroResultsPlaceholder from '@/components/safe-apps/SafeAppsZeroResultsPlaceholder'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import { getUniqueTags } from '@/components/safe-apps/utils'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS } from '@/services/analytics/events/safeApps'
import { SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import { IDLE_MIX, OPPORTUNITIES, TREASURY_TOTAL } from '../../opportunities'
import { idleByAsset, summariseTreasury } from '../../shelf'
import { initialPositions } from '../../components/DefiV1Page'
import { MoveFundsDialog, type HubTab } from '../../components/MoveFundsDialog'
import { SetUpInvestmentFlow } from '../../components/SetUpInvestmentStepper'
import { buildRows, groupApps, type AppRow, type AppsGroupBy } from '../catalogue'
import type { AppsV1Config, AppsView } from '../context'
import { APPS_V1_COPY } from '../copy'
import { AppPreviewDrawer } from './AppPreviewDrawer'
import { AppsGrid } from './AppsGrid'
import { AppsTable } from './AppsTable'
import { AppsToolbar } from './AppsToolbar'

const COPY = APPS_V1_COPY
const IDLE_BALANCES = idleByAsset(summariseTreasury(TREASURY_TOTAL, initialPositions()).idle, IDLE_MIX)
const INVEST_OPTIONS = OPPORTUNITIES.filter((item) => item.access === 'all')

/** DES-201 prototype: the Apps list on the Treasury table, grouped by job, with built-in features listed first. */
export const AppsV1View = ({
  config,
  allApps,
  filteredApps,
  customApps,
  query,
  onQuery,
  selectedCategories,
  onCategories,
  batchOnly,
  onBatchOnly,
  pinnedIds,
  onTogglePin,
  onAddCustom,
  onRemoveCustom,
}: {
  config: AppsV1Config
  allApps: SafeApp[]
  filteredApps: SafeApp[]
  customApps: SafeApp[]
  query: string
  onQuery: (value: string) => void
  selectedCategories: string[]
  onCategories: (value: string[]) => void
  batchOnly: boolean
  onBatchOnly: (value: boolean) => void
  pinnedIds: Set<number>
  onTogglePin: (appId: number) => void
  onAddCustom: (app: SafeApp) => void
  onRemoveCustom?: (app: SafeApp) => void
}) => {
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const chainId = useChainId()
  const { configs } = useChains()
  const { openedSafeAppIds } = useOpenedSafeApps()
  const [previewRow, setPreviewRow] = useState<AppRow | null>(null)
  const [groupBy, setGroupBy] = useState<AppsGroupBy>('job')
  const [view, setView] = useState<AppsView>(config.view)
  const [hubTab, setHubTab] = useState<HubTab>('swap')
  const [isMoving, setIsMoving] = useState(false)
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const categories = useMemo(() => getUniqueTags(allApps), [allApps])

  const chainName = useCallback(
    (id: string) => configs.find((chain) => chain.chainId === id)?.chainName ?? `Chain ${id}`,
    [configs],
  )
  const isPinned = (row: AppRow) => Boolean(row.app && pinnedIds.has(row.app.id))

  const groups = useMemo(
    () =>
      groupApps(buildRows({ filteredApps, customApps, query, categories: selectedCategories, batchOnly }), groupBy, {
        pinnedIds,
        jobTitle: (job) => COPY.jobs[job],
        chainName,
        currentChainId: chainId,
        titles: COPY.groups,
      }),
    [filteredApps, customApps, query, selectedCategories, batchOnly, groupBy, pinnedIds, chainName, chainId],
  )

  const launch = (app: SafeApp) => {
    trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: SAFE_APPS_LABELS.apps_all }, app, {
      launchLocation: SafeAppLaunchLocation.SAFE_APPS_LIST,
    })
  }

  const previewList = useMemo(() => groups.flatMap((group) => group.rows).filter((row) => row.app), [groups])
  const openPreview = (app: SafeApp) => setPreviewRow(previewList.find((row) => row.app?.id === app.id) ?? null)

  const isKnown = (app: SafeApp) => app.id < 1 || openedSafeAppIds.includes(app.id)

  const onClickApp = (event: SyntheticEvent, app: SafeApp) => {
    if (isKnown(app)) return launch(app)
    event.preventDefault()
    openPreview(app)
  }

  const openBuiltIn = (row: AppRow) => {
    if (row.builtIn === 'treasury') {
      router.push({ pathname: AppRoutes.earn, query: router.query })
      return
    }
    if (row.builtIn) {
      setHubTab(row.builtIn)
      setIsMoving(true)
    }
  }

  const onSelect = (row: AppRow) => (row.app ? setPreviewRow(row) : openBuiltIn(row))

  const onOpen = (row: AppRow) => {
    if (!row.app) return openBuiltIn(row)
    launch(row.app)
    router.push(getSafeAppUrl(router, safeLinkQuery, row.app.url))
  }

  const togglePin = (row: AppRow) => row.app && onTogglePin(row.app.id)

  return (
    <div className="flex flex-col gap-4 pt-5" data-testid="apps-v1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography as="h1" variant="h3">
          {COPY.title}
        </Typography>
        <Button variant="outline" onClick={() => setIsAddingCustom(true)} data-testid="add-custom-app">
          <Plus />
          {COPY.addCustom}
        </Button>
      </div>

      <AppsToolbar
        onQuery={onQuery}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategories={onCategories}
        batchOnly={batchOnly}
        onBatchOnly={onBatchOnly}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        view={view}
        onView={setView}
      />

      {view === 'table' ? (
        <AppsTable
          groups={groups}
          isPinned={isPinned}
          onSelect={onSelect}
          onOpen={onOpen}
          onTogglePin={togglePin}
          chainName={chainName}
        />
      ) : (
        <AppsGrid
          groups={groups}
          isPinned={isPinned}
          onOpen={onOpen}
          onTogglePin={togglePin}
          onClickApp={onClickApp}
          onPreview={openPreview}
          onRemoveCustom={onRemoveCustom}
        />
      )}

      {query && groups.length === 0 && <SafeAppsZeroResultsPlaceholder searchQuery={query} />}

      <AppPreviewDrawer
        row={previewRow}
        list={previewList}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onNavigate={setPreviewRow}
        onOpen={onOpen}
        onClose={() => setPreviewRow(null)}
        chainName={chainName}
      />

      <AddCustomAppModal
        open={isAddingCustom}
        onClose={() => setIsAddingCustom(false)}
        onSave={onAddCustom}
        safeAppsList={allApps}
      />

      <MoveFundsDialog
        open={isMoving}
        tab={hubTab}
        onTabChange={setHubTab}
        balances={IDLE_BALANCES}
        invest={(tabs) => (
          <SetUpInvestmentFlow
            tabs={tabs}
            opportunity={null}
            options={INVEST_OPTIONS}
            onClose={() => setIsMoving(false)}
            onCreate={() => undefined}
            onView={() => router.push({ pathname: AppRoutes.earn, query: router.query })}
          />
        )}
        onClose={() => setIsMoving(false)}
      />
    </div>
  )
}
