import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import NavTabs from '@/components/common/NavTabs'
import { safeAppsNavItems } from '@/components/common/NavTabs/navItemsConfig'
import { SafeAppsHeaderView } from '@views/components/safe-apps/SafeAppsHeader/SafeAppsHeaderView'

const SafeAppsHeader = (): ReactElement => {
  const chain = useCurrentChain()
  return <SafeAppsHeaderView chainName={chain?.chainName} navTabs={<NavTabs tabs={safeAppsNavItems} />} />
}

export default SafeAppsHeader
