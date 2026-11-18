import type { SyntheticEvent } from 'react'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import SafeAppsListHeader from '@safe-global/views/components/safe-apps/SafeAppsListHeader'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import css from '@/components/safe-apps/SafeAppList/styles.module.css'
import type { AppGroup, AppRow } from '../catalogue'
import { APPS_V1_COPY } from '../copy'
import { AppBadge, AppIcon } from './AppParts'

const BuiltInCard = ({ row, onOpen }: { row: AppRow; onOpen: (row: AppRow) => void }) => (
  <Card size="sm" data-testid={`app-card-${row.id}`}>
    <CardContent>
      <div className="flex min-h-[200px] flex-col gap-3">
        <div className="flex items-center gap-3">
          <AppIcon row={row} size={48} />
          <AppBadge row={row} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-semibold text-foreground">{row.name}</span>
          <span className="text-sm text-muted-foreground">{row.does}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => onOpen(row)} className="w-fit">
          {APPS_V1_COPY.open}
        </Button>
      </div>
    </CardContent>
  </Card>
)

export const AppsGrid = ({
  groups,
  isPinned,
  onOpen,
  onTogglePin,
  onClickApp,
  onPreview,
  onRemoveCustom,
}: {
  groups: AppGroup[]
  isPinned: (row: AppRow) => boolean
  onOpen: (row: AppRow) => void
  onTogglePin: (row: AppRow) => void
  onClickApp: (event: SyntheticEvent, app: SafeApp) => void
  onPreview: (app: SafeApp) => void
  onRemoveCustom?: (app: SafeApp) => void
}) => (
  <div className="flex flex-col gap-6" data-testid="apps-grid">
    {groups.map((group) => (
      <section key={group.key}>
        <SafeAppsListHeader title={group.title} amount={group.rows.length} />
        <ul className={css.safeAppsContainer}>
          {group.rows.map((row) => (
            <li key={row.id}>
              {row.app ? (
                <SafeAppCard
                  safeApp={row.app}
                  isBookmarked={isPinned(row)}
                  onBookmarkSafeApp={row.custom ? undefined : () => onTogglePin(row)}
                  removeCustomApp={row.custom ? onRemoveCustom : undefined}
                  onClickSafeApp={(event) => row.app && onClickApp(event, row.app)}
                  openPreviewDrawer={onPreview}
                />
              ) : (
                <BuiltInCard row={row} onOpen={onOpen} />
              )}
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
)
