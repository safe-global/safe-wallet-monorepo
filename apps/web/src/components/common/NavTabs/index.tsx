import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/components/sidebar/SidebarNavigation/config'

const NavTabs = ({ tabs }: { tabs: NavItem[] }) => {
  const router = useRouter()
  const activeHref = tabs.map((tab) => tab.href).includes(router.pathname) ? router.pathname : tabs[0]?.href
  const query = router.query.safe ? { safe: router.query.safe } : undefined

  return (
    <Tabs value={activeHref}>
      <TabsList
        variant="line"
        className="h-auto gap-6 overflow-x-auto overflow-y-hidden rounded-none bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            tabIndex={0}
            nativeButton={false}
            className={cn(
              // Compact, non-growing, underline-able
              'h-auto flex-none px-0 pb-2 text-sm font-bold whitespace-nowrap',
              // Design-system text colours: primary when active, primary.light when idle
              'text-[var(--color-primary-light)] hover:text-[var(--color-primary-main)]',
              'data-active:bg-transparent data-active:text-[var(--color-primary-main)] dark:data-active:bg-transparent',
              // Active underline in the brand primary colour, flush to the bottom
              'after:inset-x-0 after:bottom-0 after:bg-[var(--color-primary-main)]',
            )}
            render={<NextLink href={{ pathname: tab.href, query }} />}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.tag}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

export default NavTabs
