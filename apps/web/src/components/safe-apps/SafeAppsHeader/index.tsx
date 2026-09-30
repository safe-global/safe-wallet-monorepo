import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import { useCurrentChain } from '@/hooks/useChains'

import NavTabs from '@/components/common/NavTabs'
import { safeAppsNavItems } from '@/components/common/NavTabs/navItemsConfig'
import css from './styles.module.css'

const SafeAppsHeader = (): ReactElement => {
  const chain = useCurrentChain()
  return (
    <>
      <div className={css.container}>
        {/* Safe Apps Title */}
        <Typography variant="h3" className={css.title}>
          Explore the {chain?.chainName} ecosystem
        </Typography>

        {/* Safe Apps Subtitle */}
        <Typography className={css.subtitle}>
          Connect to your favourite web3 applications with your Safe account, securely and efficiently.
        </Typography>
      </div>

      {/* Safe Apps Tabs */}
      <div className={css.tabs}>
        <NavTabs tabs={safeAppsNavItems} />
      </div>
    </>
  )
}

export default SafeAppsHeader
