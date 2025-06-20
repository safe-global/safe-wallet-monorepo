import React, { createElement, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { Box, IconButton, Stack } from '@mui/material'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeftRounded'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import css from './styles.module.css'
import { getSlidePosition, NEWS_BANNER_STORAGE_KEY } from '@/components/dashboard/NewsCarousel/utils'

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

const isInteractive = (element: HTMLElement | null) =>
  !!element?.closest('button, a, input, textarea, select, #carousel-overlay')

const NewsCarousel = ({ banners }: NewsCarouselProps) => {
  const [dismissed = [], setDismissed] = useLocalStorage<string[]>(NEWS_BANNER_STORAGE_KEY)

  const [isDragging, setIsDragging] = useState(false)
  const [prevScrollLeft, setPrevScrollLeft] = useState(0)
  const [prevClientX, setPrevClientX] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
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
    const adjustedScrollLeft = getSlidePosition(prevScrollLeft, scrollLeft, itemWidth) ?? scrollLeft

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

    if (itemWidth) {
      setActiveIndex(Math.round(adjustedScrollLeft / itemWidth))
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

  const goToSlide = (index: number) => {
    const width = getItemWidth()
    if (!sliderRef.current || !width) return

    const position = width * index
    sliderRef.current.scrollTo({ left: position, behavior: 'smooth' })
    setActiveIndex(index)
  }

  const scrollSlides = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? Math.max(0, activeIndex - 1) : Math.min(items.length - 1, activeIndex + 1)
    goToSlide(newIndex)
  }

  const getItemWidth = () => {
    if (!sliderRef.current) return
    return sliderRef.current.clientWidth * (ITEM_WIDTH_PERCENT / 100)
  }

  const items = useMemo(() => banners.filter((b) => !dismissed.includes(b.id)), [banners, dismissed])
  const ITEM_WIDTH_PERCENT = items.length === 1 ? 100 : 80

  const dismissItem = (id: string) => {
    setDismissed((prev = []) => Array.from(new Set([...prev, id])))
  }

  useEffect(() => {
    setCanScrollLeft(activeIndex > 0)
    setCanScrollRight(activeIndex < items.length - 1)
  }, [activeIndex, items.length])

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
        {items.map((item, index) => (
          <>
            <Box width={`${ITEM_WIDTH_PERCENT}%`} flexShrink={0} key={item.id}>
              {createElement(item.element, {
                onDismiss: () => dismissItem(item.id),
              })}
            </Box>

            {activeIndex !== items.length - 1 && (
              <Box id="carousel-overlay" className={css.overlay} onClick={() => goToSlide(index)} />
            )}
          </>
        ))}
      </div>

      {items.length > 1 && (
        <div className={css.dots}>
          <IconButton
            aria-label="previous banner"
            onClick={() => scrollSlides('left')}
            disabled={!canScrollLeft}
            size="medium"
          >
            <KeyboardArrowLeftIcon fontSize="small" />
          </IconButton>

          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={classnames(css.dot, { [css.active]: index === activeIndex })}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToSlide(index)}
            />
          ))}

          <IconButton
            aria-label="next banner"
            onClick={() => scrollSlides('right')}
            disabled={!canScrollRight}
            size="medium"
          >
            <KeyboardArrowRightIcon fontSize="small" />
          </IconButton>
        </div>
      )}
    </Stack>
  )
}

export default NewsCarousel
