import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import { SAFE_APPS_LABELS } from '@/services/analytics'
import css from './styles.module.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const ITEM_GAP = 16

const SafeAppsDashboardSection = () => {
  const { rankedSafeApps, togglePin, pinnedSafeAppIds } = useSafeApps()
  const { isPreviewDrawerOpen, previewDrawerApp, openPreviewDrawer, closePreviewDrawer } = useSafeAppPreviewDrawer()
  const listRef = useRef<HTMLUListElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    setCanScrollLeft(list.scrollLeft > 0)
    setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth)
  }, [rankedSafeApps.length])

  const scrollList = (direction: 'left' | 'right') => {
    const list = listRef.current
    if (!list) return

    const firstItem = list.firstElementChild as HTMLElement | null
    if (!firstItem) return

    const itemWidth = firstItem.offsetWidth + ITEM_GAP
    const itemsInView = Math.max(1, Math.floor(list.clientWidth / itemWidth))
    const scrollAmount = itemWidth * itemsInView
    const newScrollLeft =
      direction === 'left'
        ? Math.max(0, list.scrollLeft - scrollAmount)
        : Math.min(list.scrollWidth - list.clientWidth, list.scrollLeft + scrollAmount)

    list.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    setCanScrollLeft(newScrollLeft > 0)
    setCanScrollRight(newScrollLeft + list.clientWidth < list.scrollWidth)
  }

  if (rankedSafeApps.length === 0) return null

  const showNav = canScrollLeft || canScrollRight

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
                onClick={() => scrollList('left')}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="next apps"
                onClick={() => scrollList('right')}
                disabled={!canScrollRight}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={css.carouselWrapper}>
        <ul className={css.carouselList} ref={listRef} style={{ gap: ITEM_GAP }}>
          {rankedSafeApps.map((rankedSafeApp) => (
            <li key={rankedSafeApp.id}>
              <SafeAppCard
                safeApp={rankedSafeApp}
                onBookmarkSafeApp={(appId) => togglePin(appId, SAFE_APPS_LABELS.dashboard)}
                isBookmarked={pinnedSafeAppIds.has(rankedSafeApp.id)}
                onClickSafeApp={(e) => {
                  e.preventDefault()
                  openPreviewDrawer(rankedSafeApp)
                }}
                openPreviewDrawer={openPreviewDrawer}
                compact
              />
            </li>
          ))}
        </ul>
      </div>

      <SafeAppPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        safeApp={previewDrawerApp}
        isBookmarked={previewDrawerApp && pinnedSafeAppIds.has(previewDrawerApp.id)}
        onClose={closePreviewDrawer}
        onBookmark={(appId) => togglePin(appId, SAFE_APPS_LABELS.apps_sidebar)}
      />
    </section>
  )
}

export default SafeAppsDashboardSection
