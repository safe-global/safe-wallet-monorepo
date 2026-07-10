import { AppRoutes } from '@/config/routes'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

type Item = {
  label: string
  url: string
  trackEvent?: AnalyticsEvent
}

const navItems: Item[] = [
  {
    label: 'Workspaces',
    url: AppRoutes.welcome.spaces,
    trackEvent: { ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.accounts_page },
  },
  {
    label: 'My accounts',
    url: AppRoutes.welcome.accounts,
  },
]

const AccountsNavigation = () => {
  const router = useRouter()
  const isDarkMode = useDarkMode()

  const isActiveNavigation = (pathname: string) => router.pathname === pathname

  const handleClick = (item: Item) => () => {
    if (item.trackEvent && !isActiveNavigation(item.url)) {
      trackEvent(item.trackEvent)
    }
  }

  return (
    <nav
      className={cn(
        'shadcn-scope flex w-full max-w-[440px] items-center gap-1 rounded-2xl bg-[#fafafa] p-1 dark:bg-muted',
        isDarkMode && 'dark',
      )}
    >
      {navItems.map((item) => {
        const isActive = isActiveNavigation(item.url)

        return (
          <Link
            key={item.url}
            href={item.url}
            onClick={handleClick(item)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex h-[38px] flex-1 items-center justify-center rounded-xl border border-transparent px-2.5 text-lg no-underline transition-all',
              isActive
                ? 'bg-background font-semibold text-foreground shadow-sm dark:border-input dark:bg-input/30 dark:text-foreground'
                : 'font-normal text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default AccountsNavigation
