import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type SafeAppsListKind = 'pinned' | 'featured' | 'all'

export type SafeAppsViewProps = {
  isSafeAppsEnabled?: boolean
  header: ReactNode
  filters: ReactNode
  showPinnedApps: boolean
  showFeaturedApps: boolean
  renderAppList: (kind: SafeAppsListKind, props: { title: string }) => ReactNode
}

export const SafeAppsView = ({
  isSafeAppsEnabled,
  header,
  filters,
  showPinnedApps,
  showFeaturedApps,
  renderAppList,
}: SafeAppsViewProps) => {
  return isSafeAppsEnabled === undefined ? null : !isSafeAppsEnabled ? (
    <Typography align="center" className="my-6">
      Safe Apps are not available on this network.
    </Typography>
  ) : (
    <>
      {header}

      <main>
        {/* Safe Apps Filters */}
        {filters}

        {/* Pinned apps */}
        {showPinnedApps && renderAppList('pinned', { title: 'My pinned apps' })}

        {/* Featured apps */}
        {showFeaturedApps && renderAppList('featured', { title: 'Featured apps' })}

        {/* All apps */}
        {renderAppList('all', { title: 'All apps' })}
      </main>
    </>
  )
}
