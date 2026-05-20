import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { Chip } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

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

const AccountsNavigation = () => {
  const router = useRouter()
  // When the new spaces flow is the default landing (DISABLE_SPACES_LOGIN unset), Accounts
  // is no longer surfaced from the welcome page — hide the tabs so /welcome/spaces is the
  // single, unambiguous entry. Show them again in legacy mode where classic is the default.
  const isLegacyMode = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN) === true

  if (!isLegacyMode) return null

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
