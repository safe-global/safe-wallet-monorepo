import type { ReactElement, ReactNode, Ref } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import css from './styles.module.css'

export type SafeAppsDashboardSectionViewProps = {
  safeApps: SafeAppData[]
  listRef: Ref<HTMLUListElement>
  itemGap: number
  showNav: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  renderCard: (safeApp: SafeAppData) => ReactNode
  previewDrawer: ReactNode
}

export function SafeAppsDashboardSectionView({
  safeApps,
  listRef,
  itemGap,
  showNav,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  renderCard,
  previewDrawer,
}: SafeAppsDashboardSectionViewProps): ReactElement {
  return (
    <section className="overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pb-6 pt-5">
      <div className="mb-4 flex flex-row justify-between">
        <Typography variant="paragraph-bold">Featured Apps</Typography>
        {showNav && (
          <>
            <div className={css.carouselNav}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="previous apps"
                onClick={onScrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="next apps"
                onClick={onScrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={css.carouselWrapper}>
        <ul className={css.carouselList} ref={listRef} style={{ gap: itemGap }}>
          {safeApps.map((safeApp) => (
            <li key={safeApp.id}>{renderCard(safeApp)}</li>
          ))}
        </ul>
      </div>

      {previewDrawer}
    </section>
  )
}
