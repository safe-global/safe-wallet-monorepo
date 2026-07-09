import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
}

const navItems: Item[] = [
  {
    label: 'Accounts',
    url: AppRoutes.welcome.accounts,
  },
  {
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
  },
]

const AccountsNavigation = () => {
  const router = useRouter()
  const isRequireLoginEnabled = useIsRequireLoginEnabled() ?? false

  if (isRequireLoginEnabled) return null

  const activeUrl = navItems.some((item) => item.url === router.pathname) ? router.pathname : navItems[0].url

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && router.pathname !== item.url) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <Tabs value={activeUrl}>
      <TabsList variant="segmented" aria-label="Accounts navigation">
        {navItems.map((item) => (
          <TabsTrigger
            key={item.url}
            value={item.url}
            nativeButton={false}
            render={<NextLink href={item.url} onClick={handleClick(item)} />}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default AccountsNavigation
