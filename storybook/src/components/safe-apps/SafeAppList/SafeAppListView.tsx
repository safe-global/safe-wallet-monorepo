import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import SafeAppsListHeader from '@/components/safe-apps/SafeAppsListHeader'
import { Skeleton } from '@/components/ui/skeleton'
import css from './styles.module.css'

export type SafeAppListViewProps = {
  title: string
  safeAppsList: SafeAppData[]
  safeAppsListLoading?: boolean
  query?: string
  showAddCustomApp: boolean
  addCustomAppCard: ReactNode
  showNativeSwapsCard: boolean
  nativeSwapsCardCell: ReactNode
  renderCard: (safeApp: SafeAppData) => ReactNode
  renderZeroResultsPlaceholder: (searchQuery: string) => ReactNode
  previewDrawer: ReactNode
}

export function SafeAppListView({
  title,
  safeAppsList,
  safeAppsListLoading,
  query,
  showAddCustomApp,
  addCustomAppCard,
  showNativeSwapsCard,
  nativeSwapsCardCell,
  renderCard,
  renderZeroResultsPlaceholder,
  previewDrawer,
}: SafeAppListViewProps): ReactElement {
  const showZeroResultsPlaceholder = query && safeAppsList.length === 0

  return (
    <>
      {/* Safe Apps List Header */}
      <SafeAppsListHeader title={title} amount={safeAppsList.length} />

      {/* Safe Apps List */}
      <ul data-testid="apps-list" className={css.safeAppsContainer}>
        {/* Add Custom Safe App Card */}
        {showAddCustomApp && <li>{addCustomAppCard}</li>}

        {safeAppsListLoading &&
          Array.from({ length: 8 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-[271px] w-full" />
            </li>
          ))}

        {showNativeSwapsCard && nativeSwapsCardCell}

        {/* Flat list filtered by search query */}
        {safeAppsList.map((safeApp) => (
          <li key={safeApp.id}>{renderCard(safeApp)}</li>
        ))}
      </ul>

      {/* Zero results placeholder */}
      {showZeroResultsPlaceholder && renderZeroResultsPlaceholder(query)}

      {/* Safe App Preview Drawer */}
      {previewDrawer}
    </>
  )
}
