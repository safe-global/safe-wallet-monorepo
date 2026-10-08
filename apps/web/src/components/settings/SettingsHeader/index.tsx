import type { ReactElement } from 'react'

import NavTabs from '@/components/common/NavTabs'
import PageHeader from '@/components/common/PageHeader'
import { generalSettingsNavItems, settingsNavItems } from '@/components/common/NavTabs/navItemsConfig'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import madProps from '@/utils/mad-props'
import { SettingsHeaderView } from '@views/components/settings/SettingsHeader/SettingsHeaderView'

export const SettingsHeader = ({
  safeAddress,
  chain,
}: {
  safeAddress: ReturnType<typeof useSafeAddress>
  chain: ReturnType<typeof useCurrentChain>
}): ReactElement => {
  const navItems = safeAddress
    ? settingsNavItems.filter((route) => isRouteEnabled(route.href, chain))
    : generalSettingsNavItems

  return (
    <SettingsHeaderView renderPageHeader={(props) => <PageHeader {...props} />} navTabs={<NavTabs tabs={navItems} />} />
  )
}

export default madProps(SettingsHeader, {
  safeAddress: useSafeAddress,
  chain: useCurrentChain,
})
