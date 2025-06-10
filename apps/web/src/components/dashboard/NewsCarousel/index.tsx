import React, { createElement, type MouseEvent, useMemo, useRef, useState } from 'react'
import { Box, Stack } from '@mui/material'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import css from './styles.module.css'
import classnames from 'classnames'

export interface NewsBannerProps {
  onDismiss: (e: MouseEvent<HTMLButtonElement>) => void
}

export interface BannerItem {
  id: string
  element: React.ComponentType<NewsBannerProps>
}

export interface NewsCarouselProps {
  banners: BannerItem[]
}

const ITEM_WIDTH_PERCENT = 80 // width of each banner in viewport width
const STORAGE_KEY = 'dismissedNewsBanners'

const isInteractive = (element: HTMLElement | null) => !!element?.closest('button, a, input, textarea, select')

const NewsCarousel = ({ banners }: NewsCarouselProps) => {
  const [dismissed = [], setDismissed] = useLocalStorage<string[]>(STORAGE_KEY)

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
    const adjustedScrollLeft = getAdjustedScrollLeft(scrollLeft) ?? scrollLeft

    setIsDragging(false)
    setPrevClientX(e.pageX)
    setPrevScrollLeft(adjustedScrollLeft)

    sliderRef.current.scrollTo({
      left: adjustedScrollLeft,
      behavior: 'smooth',
    })
  }

  const handleDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (!isDragging) return
    if (!sliderRef.current) return

    const change = e.clientX - prevClientX
    const newScrollLeft = prevScrollLeft - change

    sliderRef.current.scrollLeft = newScrollLeft
  }

  const getAdjustedScrollLeft = (scrollLeft: number) => {
    const swipeWidth = getSwipeWidth()
    if (swipeWidth === undefined) return

    return Math.round(scrollLeft / swipeWidth) * swipeWidth
  }

  const getSwipeWidth = () => {
    if (!sliderRef.current) return
    return sliderRef.current.clientWidth * (ITEM_WIDTH_PERCENT / 100)
  }

  const items = useMemo(() => banners.filter((b) => !dismissed.includes(b.id)), [banners, dismissed])

  const dismissItem = (id: string) => {
    setDismissed((prev = []) => Array.from(new Set([...prev, id])))
  }

  if (!items.length) return null

  return (
    <Stack spacing={1} alignItems="center" mt={3} position="relative">
      <div
        className={classnames(css.slider, { [css.grabbing]: isDragging })}
        ref={sliderRef}
        onPointerDown={handleDragStart}
        onPointerMove={handleDrag}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        {items.map((item) => (
          <Box width={`${ITEM_WIDTH_PERCENT}%`} flexShrink={0} key={item.id}>
            {createElement(item.element, {
              onDismiss: () => dismissItem(item.id),
            })}
          </Box>
        ))}
      </div>
    </Stack>
  )
}

export default NewsCarousel
