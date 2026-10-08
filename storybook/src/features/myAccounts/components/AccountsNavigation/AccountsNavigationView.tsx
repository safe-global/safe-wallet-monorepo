import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { ProHighlight } from '@/components/common/ProHighlight'
import { cn } from '@/utils/cn'

export type AccountsNavItem = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
  /** Under SAFE_PRO the Workspaces tab is named after Safe Pro and wears the brand underline. */
  proLabel?: string
}

export const accountsNavItems: AccountsNavItem[] = [
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

export type AccountsNavigationViewProps = {
  activeUrl: string
  isSafePro: boolean
  getClickHandler: (item: AccountsNavItem) => () => void
}

export const AccountsNavigationView = ({ activeUrl, isSafePro, getClickHandler }: AccountsNavigationViewProps) => {
  return (
    <Tabs value={activeUrl} className={cn('w-full', isSafePro ? 'max-w-116' : 'max-w-110')}>
      <TabsList variant="toggle" size="lg" aria-label="Accounts navigation" className="w-full">
        {accountsNavItems.map((item) => (
          <TabsTrigger
            key={item.url}
            value={item.url}
            nativeButton={false}
            render={<NextLink href={item.url} onClick={getClickHandler(item)} />}
          >
            {isSafePro && item.proLabel ? <ProHighlight>{item.proLabel}</ProHighlight> : item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
