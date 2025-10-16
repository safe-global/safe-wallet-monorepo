import { Card, Chip, IconButton } from '@mui/material'
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

const EXPLORE_POSSIBLE_CONFIG = [
  {
    id: 'swap',
    title: 'Swap tokens instantly',
    iconUrl: { light: '/images/explore-possible/swap-large.svg', dark: '/images/explore-possible/swap-large-dark.svg' },
    getLink: (safeQuery: string | string[] | undefined) => ({
      pathname: AppRoutes.swap,
      query: { safe: safeQuery },
    }),
    tag: {
      text: 'Popular',
      color: '#12FF80',
    },
  },
  {
    id: 'spaces',
    title: 'Manage multiple Safes',
    iconUrl: {
      light: '/images/explore-possible/spaces-large.svg',
      dark: '/images/explore-possible/spaces-large-dark.svg',
    },
    getLink: () => 'https://app.safe.global/welcome/spaces',
  },
  {
    id: 'transaction-builder',
    title: 'Build custom transactions',
    iconUrl: {
      light: '/images/explore-possible/tx-builder-large.svg',
      dark: '/images/explore-possible/tx-builder-large-dark.svg',
    },
    getLink: (safeQuery: string | string[] | undefined, txBuilderLink?: string | UrlObject) =>
      txBuilderLink || {
        pathname: AppRoutes.apps.index,
        query: { safe: safeQuery },
      },
  },
  {
    id: 'walletconnect',
    title: 'Connect to web3 apps',
    iconUrl: {
      light: '/images/explore-possible/apps-large.svg',
      dark: '/images/explore-possible/apps-large-dark.svg',
    },
    getLink: (safeQuery: string | string[] | undefined) => ({
      pathname: AppRoutes.apps.index,
      query: { safe: safeQuery },
    }),
  },
] as const

const ExplorePossibleWidget = () => {
  const router = useRouter()
  const txBuilderApp = useTxBuilderApp()
  const isDarkMode = useDarkMode()
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLUListElement>(null)

  const EXPLORE_POSSIBLE_APPS: ExplorePossibleApp[] = useMemo(
    () =>
      EXPLORE_POSSIBLE_CONFIG.map((config) => ({
        id: config.id,
        title: config.title,
        iconUrl: isDarkMode ? config.iconUrl.dark : config.iconUrl.light,
        link: config.getLink(router.query.safe, txBuilderApp?.link),
        ...('tag' in config && config.tag ? { tag: config.tag } : {}),
      })),
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

    const items = container.querySelectorAll('li')
    if (items.length === 0) return

    const scrollPosition = container.scrollLeft
    let targetIndex = 0

    items.forEach((item, index) => {
      const itemLeft = (item as HTMLElement).offsetLeft
      if (Math.abs(itemLeft - scrollPosition) < 10) {
        targetIndex = index
      }
    })

    const newIndex = direction === 'left' ? Math.max(0, targetIndex - 1) : Math.min(items.length - 1, targetIndex + 1)
    const targetItem = items[newIndex] as HTMLElement

    container.scrollTo({
      left: targetItem.offsetLeft,
      behavior: 'smooth',
    })
  }

  const handleAppClick = (appId: string) => {
    trackEvent(EXPLORE_POSSIBLE_EVENTS.EXPLORE_POSSIBLE_CLICKED, { id: appId })
  }

  return (
    <Card sx={{ px: 3, pt: 2.5, pb: 3 }} component="section">
      <div style={{ position: 'relative' }}>
        {/* Gradient fade on the right */}
        <div
          className={css.gradientFade}
          style={{
            background: `linear-gradient(to left, var(--color-background-paper), transparent)`,
          }}
          aria-hidden="true"
        />

        {/* Header with title and navigation */}
        <div className={css.header}>
          <h2 className={css.headerTitle}>Explore what&apos;s possible</h2>
          {(canScrollLeft || canScrollRight) && (
            <nav className={css.carouselNav} aria-label="Carousel navigation">
              <IconButton
                aria-label="Scroll to previous apps"
                onClick={() => scrollList('left')}
                disabled={!canScrollLeft}
                size="small"
              >
                <KeyboardArrowLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label="Scroll to next apps"
                onClick={() => scrollList('right')}
                disabled={!canScrollRight}
                size="small"
              >
                <KeyboardArrowRightIcon fontSize="small" />
              </IconButton>
            </nav>
          )}
        </div>

        {/* Scrollable container */}
        <ul
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className={css.carouselContainer}
          role="list"
          aria-label="Explore possible features"
          tabIndex={0}
        >
          {EXPLORE_POSSIBLE_APPS.map((app) => (
            <li key={app.id} className={css.carouselItem}>
              <Link
                href={app.link}
                className={css.cardLink}
                onClick={() => handleAppClick(app.id)}
                aria-label={`${app.title}${app.tag ? ` - ${app.tag.text}` : ''}`}
              >
                <div className={css.card}>
                  {/* Tag */}
                  {app.tag && (
                    <Chip
                      label={<span className={css.tagText}>{app.tag.text}</span>}
                      size="small"
                      className={css.tag}
                      sx={{
                        backgroundColor: app.tag.color,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div className={css.iconContainer}>
                    <img src={app.iconUrl} alt={`${app.title} icon`} className={css.icon} />
                  </div>

                  {/* Title */}
                  <p className={css.title}>{app.title}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

export default ExplorePossibleWidget
