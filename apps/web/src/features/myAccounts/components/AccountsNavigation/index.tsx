import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
}

type NavItems = Item[]

const navItems: NavItems = [
  {
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
  },
  {
    label: 'Trusted accounts',
    url: AppRoutes.welcome.accounts,
  },
]

const AccountsNavigation = () => {
  const router = useRouter()

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
          <span className={css.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default AccountsNavigation
