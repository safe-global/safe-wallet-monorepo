import NavTabs from '@/components/common/NavTabs'
import { transactionNavItems } from '@/components/sidebar/SidebarNavigation/config'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

const TxNavigation = () => {
  const isEIP1271 = useHasFeature(FEATURES.EIP1271)

  const navItems = isEIP1271
    ? transactionNavItems
    : transactionNavItems.filter((item) => item.href !== AppRoutes.transactions.messages)

  return <NavTabs tabs={navItems} />
}

export default TxNavigation
