import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
  /** Workspaces are the Safe Pro side of the app, and the chip says so regardless of any flag. */
  pro?: boolean
}

const navItems: Item[] = [
  {
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
    pro: true,
  },
  {
    label: 'My accounts',
    url: AppRoutes.welcome.accounts,
  },
]

const AccountsNavigation = () => {
  const router = useRouter()

  const activeUrl = navItems.some((item) => item.url === router.pathname) ? router.pathname : navItems[0].url

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && router.pathname !== item.url) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <Tabs value={activeUrl} className="w-full max-w-[440px]">
      <TabsList variant="toggle" size="lg" aria-label="Accounts navigation" className="w-full">
        {navItems.map((item) => (
          <TabsTrigger
            key={item.url}
            value={item.url}
            nativeButton={false}
            render={<NextLink href={item.url} onClick={handleClick(item)} />}
          >
            {item.label}
            {item.pro && (
              <span className="block h-4 w-6 shrink-0" role="img" aria-label="Pro">
                <ProChip className="size-full" />
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default AccountsNavigation
