import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Chip } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

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
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
    beta: true,
  },
]

const AccountsNavigation = () => {
  const router = useRouter()
  const isRequireLoginEnabled = useIsRequireLoginEnabled() ?? false

  if (isRequireLoginEnabled) return null

  const isActiveNavigation = (pathname: string) => {
    return router.pathname === pathname
  }

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && !isActiveNavigation(item.url)) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <nav className={css.nav}>
      {navItems.map((item) => (
        <Link
          key={item.url}
          href={item.url}
          onClick={handleClick(item)}
          className={classNames(css.tab, { [css.active]: isActiveNavigation(item.url) })}
        >
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
