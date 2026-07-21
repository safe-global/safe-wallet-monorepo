import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NavItem } from '@/components/common/NavTabs/navItemsConfig'

const NavTabs = ({ tabs }: { tabs: NavItem[] }) => {
  const router = useRouter()
  const activeHref = tabs.map((tab) => tab.href).includes(router.pathname) ? router.pathname : tabs[0]?.href
  const query = router.query.safe ? { safe: router.query.safe } : undefined

  return (
    <Tabs value={activeHref}>
      <TabsList variant="underline" tone="brand" className="overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            tabIndex={0}
            nativeButton={false}
            className="whitespace-nowrap"
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
