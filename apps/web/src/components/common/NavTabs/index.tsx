import { useRouter } from 'next/router'
import type { NavItem } from '@/components/common/NavTabs/navItemsConfig'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { NavTabsView } from '@views/components/common/NavTabs/NavTabsView'

const NavTabs = ({ tabs }: { tabs: NavItem[] }) => {
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const activeHref = tabs.map((tab) => tab.href).includes(router.pathname) ? router.pathname : tabs[0]?.href
  const query = safeLinkQuery.safe ? safeLinkQuery : undefined

  // Mounting Tabs with value=undefined (tabs still loading) locks Base UI into uncontrolled mode
  // and the active tab is never highlighted once the tabs arrive.
  if (!tabs.length) return null

  return <NavTabsView tabs={tabs} activeHref={activeHref} query={query} />
}

export default NavTabs
