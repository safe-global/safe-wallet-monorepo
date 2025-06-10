import { createElement, useEffect, useMemo, useState } from 'react'
import { Box, Fade, Stack } from '@mui/material'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import css from './styles.module.css'

export interface NewsBannerProps {
  onDismiss: () => void
}

export interface BannerItem {
  id: string
  element: React.ComponentType<NewsBannerProps>
}

export interface NewsCarouselProps {
  banners: BannerItem[]
}

const DOT_SIZE = 6
const ITEM_WIDTH_VW = 60 // width of each banner in viewport width
const GAP = 16
const STORAGE_KEY = 'dismissedNewsBanners'

const NewsCarousel = ({ banners }: NewsCarouselProps) => {
  const [dismissed = [], setDismissed] = useLocalStorage<string[]>(STORAGE_KEY)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => banners.filter((b) => !dismissed.includes(b.id)), [banners, dismissed])

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(Math.max(items.length - 1, 0))
    }
  }, [items.length, activeIndex])

  const dismissItem = (id: string) => {
    setDismissed((prev = []) => Array.from(new Set([...prev, id])))
  }

  if (!items.length) return null

  return (
    <Stack spacing={1} alignItems="center" mt={3}>
      <Box overflow="hidden" width="100%">
        <Box
          sx={{
            display: 'flex',
            gap: `${GAP}px`,
            transition: 'transform 0.3s',
            transform: `translateX(calc(-${activeIndex} * (${ITEM_WIDTH_VW}vw + ${GAP}px)))`,
            width: `calc(${items.length} * ${ITEM_WIDTH_VW}vw + ${(items.length - 1) * GAP}px)`,
          }}
        >
          {items.map((item, idx) => (
            <Fade in key={item.id} timeout={150} style={{ width: `${ITEM_WIDTH_VW}vw`, flexShrink: 0 }}>
              <Box width="100%" position="relative">
                {createElement(item.element, { onDismiss: () => dismissItem(item.id) })}
                {idx !== activeIndex && (
                  <Box
                    className={css.overlay}
                    data-testid={`carousel-item-overlay-${idx}`}
                    onClick={() => setActiveIndex(idx)}
                  />
                )}
              </Box>
            </Fade>
          ))}
        </Box>
      </Box>

      <Stack direction="row" spacing={0.5} p={0.5}>
        {items.map((_, idx) => (
          <Box
            key={idx}
            data-testid={`carousel-dot-${idx}`}
            onClick={() => setActiveIndex(idx)}
            sx={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: '50%',
              bgcolor: idx === activeIndex ? 'primary.main' : 'divider',
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
    </Stack>
  )
}

export default NewsCarousel
