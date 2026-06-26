import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'

import NavTabs from '@/components/common/NavTabs'
import { safeAppsNavItems } from '@/components/sidebar/SidebarNavigation/config'
import css from './styles.module.css'

const SafeAppsHeader = (): ReactElement => {
  const chain = useCurrentChain()
  return (
    <>
      <Box className={css.container}>
        {/* Safe Apps Title */}
        <Typography className={css.title} variant="h3">
          Explore the {chain?.chainName} ecosystem
        </Typography>

        {/* Safe Apps Subtitle */}
        <Typography className={css.subtitle}>
          Connect to your favourite web3 applications with your Safe account, securely and efficiently.
        </Typography>
      </Box>

      {/* Safe Apps Tabs */}
      <Box className={css.tabs}>
        <NavTabs tabs={safeAppsNavItems} />
      </Box>
    </>
  )
}

export default SafeAppsHeader
