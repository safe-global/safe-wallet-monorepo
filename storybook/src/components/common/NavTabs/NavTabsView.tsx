import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NavItem } from '@/components/common/NavTabs/navItemsConfig'

export type NavTabsViewProps = {
  tabs: NavItem[]
  activeHref?: string
  query?: Record<string, string | string[] | undefined>
}

export function NavTabsView({ tabs, activeHref, query }: NavTabsViewProps): ReactElement {
  return (
    <Tabs value={activeHref}>
      <TabsList variant="underline" tone="brand">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            value={tab.href}
            tabIndex={0}
            nativeButton={false}
            className="whitespace-nowrap"
            render={<NextLink href={{ pathname: tab.href, query }} />}
          >
            {tab.label}
            {tab.tag}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
