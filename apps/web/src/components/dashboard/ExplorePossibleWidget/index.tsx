import { Card, Stack, Typography, Box, Chip, IconButton } from '@mui/material'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeftRounded'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import Link from 'next/link'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import type { UrlObject } from 'url'
import { AppRoutes } from '@/config/routes'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { trackEvent } from '@/services/analytics'
import { EXPLORE_POSSIBLE_EVENTS } from '@/services/analytics/events/overview'
import { useDarkMode } from '@/hooks/useDarkMode'
import css from './styles.module.css'

export type ExplorePossibleApp = {
  id: string
  title: string
  iconUrl: string
  link: string | UrlObject
  tag?: {
    text: string
    color: string
  }
}

const ITEM_WIDTH = 180
const ITEM_GAP = 16

const ExplorePossibleWidget = () => {
  const router = useRouter()
  const txBuilderApp = useTxBuilderApp()
  const isDarkMode = useDarkMode()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLUListElement>(null)

  const EXPLORE_POSSIBLE_APPS: ExplorePossibleApp[] = useMemo(
    () => [
      {
        id: 'swap',
        title: 'Swap tokens instantly',
        iconUrl: isDarkMode
          ? '/images/explore-possible/swap-large-dark.svg'
          : '/images/explore-possible/swap-large.svg',
        link: {
          pathname: AppRoutes.swap,
          query: { safe: router.query.safe },
        },
        tag: {
          text: 'Popular',
          color: '#12FF80',
        },
      },
      {
        id: 'spaces',
        title: 'Manage multiple Safes',
        iconUrl: isDarkMode
          ? '/images/explore-possible/spaces-large-dark.svg'
          : '/images/explore-possible/spaces-large.svg',
        link: 'https://app.safe.global/welcome/spaces',
      },
      {
        id: 'transaction-builder',
        title: 'Build custom transaction',
        iconUrl: isDarkMode
          ? '/images/explore-possible/tx-builder-large-dark.svg'
          : '/images/explore-possible/tx-builder-large.svg',
        link: txBuilderApp?.link || {
          pathname: AppRoutes.apps.index,
          query: { safe: router.query.safe },
        },
      },
      {
        id: 'walletconnect',
        title: 'Connect to Web3 apps',
        iconUrl: isDarkMode
          ? '/images/explore-possible/apps-large-dark.svg'
          : '/images/explore-possible/apps-large.svg',
        link: {
          pathname: AppRoutes.apps.index,
          query: { safe: router.query.safe },
        },
      },
    ],
    [router.query.safe, txBuilderApp, isDarkMode],
  )

  const updateScrollState = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const newCanScrollLeft = container.scrollLeft > 0
    const newCanScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 1

    setCanScrollLeft(newCanScrollLeft)
    setCanScrollRight(newCanScrollRight)
  }

  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [])

  const scrollList = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = ITEM_WIDTH + ITEM_GAP
    const newScrollLeft =
      direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }

  const handleAppClick = (appId: string) => {
    trackEvent(EXPLORE_POSSIBLE_EVENTS.EXPLORE_POSSIBLE_CLICKED, { id: appId })
  }

  return (
    <Card sx={{ px: 3, pt: 2.5, pb: 3 }} component="section">
      <Box position="relative">
        {/* Gradient fade on the right */}
        <Box
          className={css.gradientFade}
          sx={{
            background: (theme) => `linear-gradient(to left, ${theme.palette.background.paper}, transparent)`,
          }}
        />

        {/* Header with title and navigation */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={700} fontSize="16px" lineHeight="22px">
            Explore what&apos;s possible
          </Typography>
          {(canScrollLeft || canScrollRight) && (
            <div className={css.carouselNav}>
              <IconButton
                aria-label="previous apps"
                onClick={() => scrollList('left')}
                disabled={!canScrollLeft}
                size="small"
              >
                <KeyboardArrowLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label="next apps"
                onClick={() => scrollList('right')}
                disabled={!canScrollRight}
                size="small"
              >
                <KeyboardArrowRightIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </Stack>

        {/* Scrollable container */}
        <ul
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className={css.carouselContainer}
          style={{
            display: 'flex',
            gap: `${ITEM_GAP}px`,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            listStyle: 'none',
            padding: '2px 0 0 0', // Top padding to prevent card from being cut off on hover
            margin: 0,
          }}
        >
          {EXPLORE_POSSIBLE_APPS.map((app) => (
            <li key={app.id} style={{ width: ITEM_WIDTH, flexShrink: 0 }}>
              <Link href={app.link} className={css.cardLink} onClick={() => handleAppClick(app.id)}>
                <Box
                  className={css.card}
                  sx={{
                    backgroundColor: 'background.main',
                    '&:hover': {
                      backgroundColor: 'background.lightGrey',
                    },
                  }}
                >
                  {/* Tag */}
                  {app.tag && (
                    <Chip
                      label={
                        <Typography
                          component="span"
                          fontSize="11px"
                          lineHeight="16px"
                          letterSpacing="1px"
                          fontWeight={400}
                          textTransform="uppercase"
                        >
                          {app.tag.text}
                        </Typography>
                      }
                      size="small"
                      className={css.tag}
                      sx={{
                        backgroundColor: app.tag.color,
                        color: 'static.main', // #121312 - stays dark in both light and dark mode
                        height: '20px',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <Box className={css.iconContainer}>
                    <img src={app.iconUrl} alt="" className={css.icon} />
                  </Box>

                  {/* Title */}
                  <Typography
                    fontWeight={700}
                    fontSize="16px"
                    lineHeight="22px"
                    letterSpacing="0.15px"
                    color="text.primary"
                    className={css.title}
                  >
                    {app.title}
                  </Typography>
                </Box>
              </Link>
            </li>
          ))}
        </ul>
      </Box>
    </Card>
  )
}

export default ExplorePossibleWidget
