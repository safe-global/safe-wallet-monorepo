import React, { createElement, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { Box, Stack } from '@mui/material'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import css from './styles.module.css'
import {
  getSlidePosition,
  NEWS_BANNER_STORAGE_KEY,
  isBannerDismissed,
  dismissBanner,
  type DismissalState,
} from '@/components/dashboard/NewsCarousel/utils'

export interface NewsBannerProps {
  onDismiss: (eligibilityState?: boolean) => void
}

export interface BannerItem {
  id: string
  element: React.ComponentType<NewsBannerProps>
  eligibilityState?: boolean
}

export interface NewsCarouselProps {
  banners: BannerItem[]
}

const isInteractive = (element: HTMLElement | null) =>
  !!element?.closest('button, a, input, textarea, select, [role="button"], #carousel-overlay')

const ITEM_WIDTH_PERCENT = 100
const SLIDER_GAP = 16

const NewsCarousel = ({ banners }: NewsCarouselProps) => {
  const [dismissed, setDismissed] = useLocalStorage<DismissalState>(NEWS_BANNER_STORAGE_KEY)

  const [isDragging, setIsDragging] = useState(false)
  const [prevScrollLeft, setPrevScrollLeft] = useState(0)
  const [prevClientX, setPrevClientX] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return
    if (isInteractive(e.target as HTMLElement)) return

    setIsDragging(true)
    setPrevScrollLeft(sliderRef.current.scrollLeft)
    setPrevClientX(e.clientX)

    sliderRef.current.setPointerCapture(e.pointerId)
  }

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return
    if (!isDragging) return

    const { scrollLeft } = sliderRef.current
    const itemWidth = getItemWidth()
    const adjustedScrollLeft = getSlidePosition(prevScrollLeft, scrollLeft, SLIDER_GAP, itemWidth) ?? scrollLeft

    setIsDragging(false)
    setPrevClientX(e.pageX)
    setPrevScrollLeft(adjustedScrollLeft)

    sliderRef.current.scrollTo({
      left: adjustedScrollLeft,
      behavior: 'smooth',
    })

    // This helps with dragging slides on mobile via touch
    if (sliderRef.current.hasPointerCapture(e.pointerId)) {
      sliderRef.current.releasePointerCapture(e.pointerId)
    }
  }

  const handleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (!isDragging) return
    if (!sliderRef.current) return

    const change = e.clientX - prevClientX
    const newScrollLeft = prevScrollLeft - change

    sliderRef.current.scrollLeft = newScrollLeft
  }

  const getItemWidth = () => {
    if (!sliderRef.current) return
    return sliderRef.current.clientWidth * (ITEM_WIDTH_PERCENT / 100)
  }

  const items = useMemo(
    () => banners.filter((banner) => !isBannerDismissed(banner.id, dismissed || [], banner.eligibilityState)),
    [banners, dismissed],
  )

  const dismissItem = (id: string, eligibilityState?: boolean) => {
    setDismissed((prev) => dismissBanner(id, prev || [], eligibilityState))
  }

  if (!items.length) return null

  return (
    <Stack spacing={1} alignItems="center" position="relative">
      <div
        className={classnames(css.slider, { [css.grabbing]: isDragging })}
        style={{ gap: SLIDER_GAP }}
        ref={sliderRef}
        onPointerDown={handleDragStart}
        onPointerMove={handleDrag}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        {items.map((item) => {
          const { id, element, eligibilityState } = item
          return (
            <Box width={1} flexShrink={0} key={id}>
              {createElement(element, {
                onDismiss: () => dismissItem(id, eligibilityState),
              })}
            </Box>
          )
        })}
      </div>
    </Stack>
  )
}

export default NewsCarousel
