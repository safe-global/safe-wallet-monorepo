import { Card, IconButton } from '@mui/material'
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
import { MixpanelEvent, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { EURCV_ASSET_ID } from '@/config/eurcv'
import css from './styles.module.css'

export type ExplorePossibleApp = {
  id: string
  title: string
  subtitle?: string
  badge?: string
  iconUrl: string
  link: string | UrlObject
}

const EXPLORE_POSSIBLE_CONFIG = [
  {
    id: 'earn',
    title: '',
    badge: '',
    subtitle: 'Earn boosted APY on stablecoins',
    iconUrl: {
      light: '/images/explore-possible/earn-large.svg',
      dark: '/images/explore-possible/earn-large-dark.svg',
    },
    getLink: (safeQuery: string | string[] | undefined) => ({
      pathname: AppRoutes.earn,
      query: {
        safe: safeQuery,
        asset_id: EURCV_ASSET_ID,
      },
    }),
  },
  {
    id: 'swap',
    title: 'Swap tokens instantly',
    iconUrl: { light: '/images/explore-possible/swap-large.svg', dark: '/images/explore-possible/swap-large-dark.svg' },
    getLink: (safeQuery: string | string[] | undefined) => ({
      pathname: AppRoutes.swap,
      query: { safe: safeQuery },
    }),
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
  const isSwapEnabled = useHasFeature(FEATURES.NATIVE_SWAPS)
  const isEurcvBoostEnabled = useHasFeature(FEATURES.EURCV_BOOST)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLUListElement>(null)

  const EXPLORE_POSSIBLE_APPS: ExplorePossibleApp[] = useMemo(
    () =>
      EXPLORE_POSSIBLE_CONFIG.filter((config) => {
        // Filter out swap if feature flag is disabled
        if (config.id === 'swap' && isSwapEnabled !== true) {
          return false
        }
        // Filter out earn if EURCV boost feature flag is disabled
        if (config.id === 'earn' && isEurcvBoostEnabled !== true) {
          return false
        }
        return true
      }).map((config) => ({
        id: config.id,
        title: config.title,
        subtitle: 'subtitle' in config ? config.subtitle : undefined,
        badge: 'badge' in config ? config.badge : undefined,
        iconUrl: isDarkMode ? config.iconUrl.dark : config.iconUrl.light,
        link: config.getLink(router.query.safe, txBuilderApp.link),
      })),
    [router.query.safe, txBuilderApp, isDarkMode, isSwapEnabled, isEurcvBoostEnabled],
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

  const handleAppClick = (appId: string, title: string) => {
    trackEvent(EXPLORE_POSSIBLE_EVENTS.EXPLORE_POSSIBLE_CLICKED, { id: appId })
    trackEvent(EXPLORE_POSSIBLE_EVENTS.HORIZONTAL_CARD_CLICKED, { label: title })

    // Additional Mixpanel tracking for EURCV Boost Earn card
    if (appId === 'earn') {
      trackEvent(
        { action: MixpanelEvent.EURCV_BOOST_EXPLORE_CLICKED, category: 'overview' },
        { [MixpanelEventParams.SOURCE]: 'explore_widget' },
      )
    }
  }

  return (
    <Card sx={{ px: 3, pt: 2.5, pb: 1.5 }} component="section">
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
                onClick={() => handleAppClick(app.id, app.title)}
                aria-label={app.subtitle ? `${app.title} ${app.badge} ${app.subtitle}` : app.title}
              >
                <div className={`${css.card} ${app.id === 'earn' ? css.earnCard : ''}`}>
                  {/* Icon */}
                  <div className={css.iconContainer}>
                    <img src={app.iconUrl} alt={`${app.title} icon`} className={css.icon} />
                  </div>

                  {/* Title with optional badge and subtitle */}
                  <div className={css.titleContainer}>
                    <p className={css.title}>
                      {app.title}
                      {app.badge && <span className={css.badge}>{app.badge}</span>}
                    </p>
                    {app.subtitle && <p className={css.subtitle}>{app.subtitle}</p>}
                  </div>
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
