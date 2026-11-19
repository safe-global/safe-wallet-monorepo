import { useCallback, useMemo, useState, type SyntheticEvent } from 'react'
import { useRouter } from 'next/router'
import { LayoutGrid, Rows3, Table2 } from 'lucide-react'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import SafeAppsZeroResultsPlaceholder from '@/components/safe-apps/SafeAppsZeroResultsPlaceholder'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'
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
import { AppsGrid } from './AppsGrid'
import { AppsTable } from './AppsTable'

const COPY = APPS_V1_COPY
const GROUP_OPTIONS = Object.keys(COPY.groupByOption) as AppsGroupBy[]
const VIEWS: { value: AppsView; icon: typeof Table2 }[] = [
  { value: 'table', icon: Table2 },
  { value: 'grid', icon: LayoutGrid },
]
const IDLE_BALANCES = idleByAsset(summariseTreasury(TREASURY_TOTAL, initialPositions()).idle, IDLE_MIX)
const INVEST_OPTIONS = OPPORTUNITIES.filter((item) => item.access === 'all')

const AppsToolbar = ({
  groupBy,
  onGroupBy,
  view,
  onView,
}: {
  groupBy: AppsGroupBy
  onGroupBy: (value: AppsGroupBy) => void
  view: AppsView
  onView: (value: AppsView) => void
}) => (
  <div className="flex flex-wrap items-center justify-end gap-2" data-testid="apps-toolbar">
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" data-testid="apps-group-by" />}>
        <Rows3 />
        {`${COPY.groupBy}: ${COPY.groupByOption[groupBy]}`}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{COPY.groupBy}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={groupBy} onValueChange={(value) => onGroupBy(value as AppsGroupBy)}>
            {GROUP_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {COPY.groupByOption[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
    <Tabs value={view} onValueChange={(value) => onView(value as AppsView)}>
      <TabsList variant="toggle" aria-label="View">
        {VIEWS.map(({ value, icon: Icon }) => (
          <TabsTrigger key={value} value={value} data-testid={`apps-view-${value}`}>
            <Icon />
            {COPY.view[value]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  </div>
)

/** DES-201 prototype: the Apps list on the Treasury table, grouped by job, with built-in features listed first. */
export const AppsV1View = ({
  config,
  filteredApps,
  customApps,
  query,
  selectedCategories,
  batchOnly,
  pinnedIds,
  onTogglePin,
  onRemoveCustom,
}: {
  config: AppsV1Config
  filteredApps: SafeApp[]
  customApps: SafeApp[]
  query: string
  selectedCategories: string[]
  batchOnly: boolean
  pinnedIds: Set<number>
  onTogglePin: (appId: number) => void
  onRemoveCustom?: (app: SafeApp) => void
}) => {
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const chainId = useChainId()
  const { configs } = useChains()
  const { openedSafeAppIds } = useOpenedSafeApps()
  const { isPreviewDrawerOpen, previewDrawerApp, openPreviewDrawer, closePreviewDrawer } = useSafeAppPreviewDrawer()
  const [groupBy, setGroupBy] = useState<AppsGroupBy>('job')
  const [view, setView] = useState<AppsView>(config.view)
  const [hubTab, setHubTab] = useState<HubTab>('swap')
  const [isMoving, setIsMoving] = useState(false)

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

  const isKnown = (app: SafeApp) => app.id < 1 || openedSafeAppIds.includes(app.id)

  const onClickApp = (event: SyntheticEvent, app: SafeApp) => {
    if (isKnown(app)) return launch(app)
    event.preventDefault()
    openPreviewDrawer(app)
  }

  const onOpen = (row: AppRow) => {
    if (row.builtIn === 'treasury') {
      router.push({ pathname: AppRoutes.earn, query: router.query })
      return
    }
    if (row.builtIn) {
      setHubTab(row.builtIn)
      setIsMoving(true)
      return
    }
    if (!row.app) return
    if (!isKnown(row.app)) return openPreviewDrawer(row.app)
    launch(row.app)
    router.push(getSafeAppUrl(router, safeLinkQuery, row.app.url))
  }

  const togglePin = (row: AppRow) => row.app && onTogglePin(row.app.id)

  return (
    <div className="flex flex-col gap-4" data-testid="apps-v1">
      <AppsToolbar groupBy={groupBy} onGroupBy={setGroupBy} view={view} onView={setView} />

      {view === 'table' ? (
        <AppsTable groups={groups} isPinned={isPinned} onOpen={onOpen} onTogglePin={togglePin} chainName={chainName} />
      ) : (
        <AppsGrid
          groups={groups}
          isPinned={isPinned}
          onOpen={onOpen}
          onTogglePin={togglePin}
          onClickApp={onClickApp}
          onPreview={openPreviewDrawer}
          onRemoveCustom={onRemoveCustom}
        />
      )}

      {query && groups.length === 0 && <SafeAppsZeroResultsPlaceholder searchQuery={query} />}

      <SafeAppPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        safeApp={previewDrawerApp}
        isBookmarked={previewDrawerApp && pinnedIds.has(previewDrawerApp.id)}
        onClose={closePreviewDrawer}
        onBookmark={onTogglePin}
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
