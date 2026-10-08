import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import { SAFE_APPS_LABELS } from '@/services/analytics'
import { useEffect, useRef, useState } from 'react'
import { SafeAppsDashboardSectionView } from '@views/components/dashboard/SafeAppsDashboardSection/SafeAppsDashboardSectionView'

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
    <SafeAppsDashboardSectionView
      safeApps={rankedSafeApps}
      listRef={listRef}
      itemGap={ITEM_GAP}
      showNav={showNav}
      canScrollLeft={canScrollLeft}
      canScrollRight={canScrollRight}
      onScrollLeft={() => scrollList('left')}
      onScrollRight={() => scrollList('right')}
      renderCard={(rankedSafeApp) => (
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
      )}
      previewDrawer={
        <SafeAppPreviewDrawer
          isOpen={isPreviewDrawerOpen}
          safeApp={previewDrawerApp}
          isBookmarked={previewDrawerApp && pinnedSafeAppIds.has(previewDrawerApp.id)}
          onClose={closePreviewDrawer}
          onBookmark={(appId) => togglePin(appId, SAFE_APPS_LABELS.apps_sidebar)}
        />
      }
    />
  )
}

export default SafeAppsDashboardSection
