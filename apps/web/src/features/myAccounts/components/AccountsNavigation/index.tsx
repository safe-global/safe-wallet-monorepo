import { useState } from 'react'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Chip } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'motion/react'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
  beta?: boolean
}

type NavItems = Item[]

const navItems: NavItems = [
  {
    label: 'Accounts',
    url: AppRoutes.welcome.accounts,
  },
  {
    label: 'Spaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
    beta: true,
  },
]

const INDICATOR_LAYOUT_ID = 'accounts-nav-indicator'

const AccountsNavigation = () => {
  const router = useRouter()
  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null)

  const isActiveNavigation = (pathname: string) => {
    return router.pathname === pathname
  }

  const activeUrl = navItems.find((item) => isActiveNavigation(item.url))?.url
  const highlightedUrl = hoveredUrl ?? activeUrl

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && !isActiveNavigation(item.url)) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <nav className={css.nav} onMouseLeave={() => setHoveredUrl(null)}>
      {navItems.map((item) => (
        <Link
          key={item.url}
          href={item.url}
          onClick={handleClick(item)}
          onMouseEnter={() => setHoveredUrl(item.url)}
          className={classNames(css.tab, { [css.active]: isActiveNavigation(item.url) })}
        >
          {highlightedUrl === item.url && (
            <motion.div
              layoutId={INDICATOR_LAYOUT_ID}
              className={css.indicator}
              transition={{ type: 'spring', duration: 1, stiffness: 400, damping: 32 }}
            />
          )}
          <span className={css.label}>
            {item.label}
            {item.beta && <Chip label="Beta" size="small" sx={{ ml: 1, fontWeight: 'normal', borderRadius: '4px' }} />}
          </span>
        </Link>
      ))}
    </nav>
  )
}

export default AccountsNavigation
