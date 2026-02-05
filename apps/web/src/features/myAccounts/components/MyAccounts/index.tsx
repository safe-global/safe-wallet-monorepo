import AccountListFilters from '../AccountListFilters'
import AccountsHeader from '../AccountsHeader'
import AccountsList from '../AccountsList'
import { useState } from 'react'
import { Box, Divider, Paper } from '@mui/material'
import madProps from '@/utils/mad-props'
import css from '../../styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { type AllSafeItemsGrouped, useAllSafesGrouped } from '@/hooks/safes'
import classNames from 'classnames'
import useTrackSafesCount from '../../hooks/useTrackedSafesCount'
import { DataWidget } from '../DataWidget'

type MyAccountsProps = {
  safes: AllSafeItemsGrouped
  isSidebar?: boolean
  onLinkClick?: () => void
}

const MyAccounts = ({ safes, onLinkClick, isSidebar = false }: MyAccountsProps) => {
  const wallet = useWallet()
  const [searchQuery, setSearchQuery] = useState('')
  useTrackSafesCount(safes, wallet)

  return (
    <Box data-testid="sidebar-safe-container" className={css.container}>
      <Box className={classNames(css.myAccounts, { [css.sidebarAccounts]: isSidebar })}>
        <AccountsHeader isSidebar={isSidebar} onLinkClick={onLinkClick} />

        <Paper sx={{ padding: 0 }}>
          <AccountListFilters setSearchQuery={setSearchQuery} />

          {isSidebar && <Divider />}

          <Paper className={css.safeList}>
            <AccountsList searchQuery={searchQuery} safes={safes} isSidebar={isSidebar} onLinkClick={onLinkClick} />
          </Paper>
        </Paper>

        {isSidebar && <Divider />}
        <DataWidget />
      </Box>
    </Box>
  )
}

export default madProps(MyAccounts, {
  safes: useAllSafesGrouped,
})
