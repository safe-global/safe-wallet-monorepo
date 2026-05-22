import { useRouter } from 'next/router'
import Link from 'next/link'
import { Info, SlidersHorizontal, User } from 'lucide-react'
import { type ReactElement } from 'react'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'

export type SettingsPageKey = 'general' | 'account' | 'about'

type RailItem = {
  key: SettingsPageKey
  label: string
  icon: ReactElement
  href: string
}

const RAIL_ITEMS: RailItem[] = [
  {
    key: 'general',
    label: 'Workspace settings',
    icon: <SlidersHorizontal className="h-4 w-4" />,
    href: AppRoutes.spaces.settingsGeneral,
  },
  {
    key: 'account',
    label: 'User settings',
    icon: <User className="h-4 w-4" />,
    href: AppRoutes.spaces.settingsAccount,
  },
  {
    key: 'about',
    label: 'About',
    icon: <Info className="h-4 w-4" />,
    href: AppRoutes.spaces.settingsAbout,
  },
]

const SettingsRail = ({ activePage }: { activePage: SettingsPageKey }) => {
  const router = useRouter()

  return (
    <aside className="w-[220px] shrink-0 sticky top-6 flex flex-col gap-2">
      {RAIL_ITEMS.map((item) => {
        const isActive = activePage === item.key
        return (
          <Link
            key={item.key}
            href={{ pathname: item.href, query: router.query }}
            data-testid={`settings-rail-${item.key}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold dark:bg-accent dark:text-primary'
                : 'text-sidebar-foreground hover:bg-muted',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={cn('shrink-0', isActive ? 'dark:text-primary' : 'text-muted-foreground')}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}

export default SettingsRail
