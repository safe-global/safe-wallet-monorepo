import AccountsHeader from '@/features/myAccounts/components/AccountsHeader'
import AccountsList from '@/features/myAccounts/components/AccountsList'
import { DataWidget } from '@/features/myAccounts/components/DataWidget'
import { useAllSafesGrouped, type AllSafeItemsGrouped } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import useTrackSafesCount from '@/features/myAccounts/hooks/useTrackedSafesCount'
import css from '@/features/myAccounts/styles.module.css'
import SafenetBanner from '@/features/safenet/components/new-safe/SafenetBanner'
import useWallet from '@/hooks/wallets/useWallet'
import madProps from '@/utils/mad-props'
import { Box, Divider, Paper } from '@mui/material'
import classNames from 'classnames'
import { useState } from 'react'
import AccountListFilters from 'src/features/myAccounts/components/AccountListFilters'

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

        {!isSidebar && <SafenetBanner />}

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
