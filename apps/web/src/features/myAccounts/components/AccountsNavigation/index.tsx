import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { ProHighlight } from '@/components/common/ProHighlight'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { cn } from '@/utils/cn'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
  /** Under SAFE_PRO the Workspaces tab is named after Safe Pro and wears the brand underline. */
  proLabel?: string
}

const navItems: Item[] = [
  {
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
    proLabel: 'Safe Pro',
  },
  {
    label: 'My accounts',
    url: AppRoutes.welcome.accounts,
  },
]

const AccountsNavigation = () => {
  const router = useRouter()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true

  const activeUrl = navItems.some((item) => item.url === router.pathname) ? router.pathname : navItems[0].url

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && router.pathname !== item.url) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <Tabs value={activeUrl} className={cn('w-full', isSafePro ? 'max-w-116' : 'max-w-110')}>
      <TabsList variant="toggle" size="lg" aria-label="Accounts navigation" className="w-full">
        {navItems.map((item) => (
          <TabsTrigger
            key={item.url}
            value={item.url}
            nativeButton={false}
            render={<NextLink href={item.url} onClick={handleClick(item)} />}
          >
            {isSafePro && item.proLabel ? <ProHighlight>{item.proLabel}</ProHighlight> : item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default AccountsNavigation
