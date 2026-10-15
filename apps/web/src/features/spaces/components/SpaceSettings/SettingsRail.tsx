import { useRouter } from 'next/router'
import Link from 'next/link'
import { FlaskConical, Info, SlidersHorizontal, User } from 'lucide-react'
import { Fragment, type ReactElement } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export type SettingsPageKey = 'general' | 'account' | 'about' | 'experimental'

type RailItem = {
  key: SettingsPageKey
  label: string
  icon: ReactElement
  href: string
}

type RailGroup = {
  label?: string
  isExperimental?: boolean
  items: RailItem[]
}

const RAIL_GROUPS: RailGroup[] = [
  {
    items: [
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
    ],
  },
  {
    label: 'More',
    isExperimental: true,
    items: [
      {
        key: 'experimental',
        label: 'Experimental',
        icon: <FlaskConical className="h-4 w-4" />,
        href: AppRoutes.spaces.settingsExperimental,
      },
    ],
  },
]

const SettingsRail = ({ activePage }: { activePage: SettingsPageKey }) => {
  const router = useRouter()
  const spaceId = typeof router.query.spaceId === 'string' ? router.query.spaceId : undefined
  const isExperimentalEnabled = useHasFeature(FEATURES.WORKSPACES_EXPERIMENTAL_FEATURES)
  const groups = RAIL_GROUPS.filter((group) => !group.isExperimental || isExperimentalEnabled)

  return (
    <aside className="sm:w-[220px] sm:shrink-0 sm:sticky sm:top-6 flex flex-row sm:flex-col gap-1 mb-4 sm:mb-0 overflow-x-auto">
      {groups.map((group, groupIndex) => (
        <Fragment key={group.label ?? groupIndex}>
          {group.label && (
            <div className="hidden sm:block mt-3 pt-4 px-3 pb-1 border-t border-border">
              <span className="text-sm text-muted-foreground">{group.label}</span>
            </div>
          )}
          {group.items.map((item) => {
            const isActive = activePage === item.key
            return (
              <Link
                key={item.key}
                href={{ pathname: item.href, query: spaceId ? { spaceId } : undefined }}
                data-testid={`settings-rail-${item.key}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline whitespace-nowrap',
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
        </Fragment>
      ))}
    </aside>
  )
}

export default SettingsRail
