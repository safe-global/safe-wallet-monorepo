import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ProWordmark from '@/public/images/safe-pro/pro-wordmark.svg'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
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
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO)

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
            {item.pro && isSafePro && (
              <span
                data-testid="pro-chip"
                className="rounded-md bg-accent-secondary px-2 py-1.5 text-accent-secondary-foreground dark:bg-accent-secondary/20 dark:text-accent-success"
              >
                <span className="block h-2 w-[21px]">
                  <ProWordmark className="size-full" />
                </span>
              </span>
            )}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default AccountsNavigation
