import { useMemo, type ReactElement, type ReactNode } from 'react'

import NavTabs from '@/components/common/NavTabs'
import { balancesNavItems } from '@/components/common/NavTabs/navItemsConfig'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import { AssetsHeaderView } from '@views/components/balances/AssetsHeader/AssetsHeaderView'

const AssetsHeader = ({ children }: { children?: ReactNode }): ReactElement => {
  const chain = useCurrentChain()
  const navItems = useMemo(() => balancesNavItems.filter((item) => isRouteEnabled(item.href, chain)), [chain])

  return <AssetsHeaderView navTabs={<NavTabs tabs={navItems} />}>{children}</AssetsHeaderView>
}

export default AssetsHeader
