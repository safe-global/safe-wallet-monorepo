import type { ReactElement } from 'react'

import NavTabs from '@/components/common/NavTabs'
import PageHeader from '@/components/common/PageHeader'
import css from '@/components/common/PageHeader/styles.module.css'
import { generalSettingsNavItems, settingsNavItems } from '@/components/sidebar/SidebarNavigation/config'
import { AppRoutes } from '@/config/routes'
import { useHasSafenetFeature } from '@/features/safenet/hooks/useHasSafenetFeature'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import { isRouteEnabled } from '@/utils/chains'
import madProps from '@/utils/mad-props'

export const SettingsHeader = ({
  safeAddress,
  chain,
}: {
  safeAddress: ReturnType<typeof useSafeAddress>
  chain: ReturnType<typeof useCurrentChain>
}): ReactElement => {
  const hasSafenetFeature = useHasSafenetFeature()

  const navItems = safeAddress
    ? settingsNavItems.filter(
        (route) =>
          isRouteEnabled(route.href, chain) || (hasSafenetFeature && route.href === AppRoutes.settings.safenet),
      )
    : generalSettingsNavItems

  return (
    <PageHeader
      title={safeAddress ? 'Settings' : 'Preferences'}
      action={
        <div className={css.navWrapper}>
          <NavTabs tabs={navItems} />
        </div>
      }
    />
  )
}

export default madProps(SettingsHeader, {
  safeAddress: useSafeAddress,
  chain: useCurrentChain,
})
