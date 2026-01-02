import type { ReactElement } from 'react'
import { useState, useCallback } from 'react'
import { Popover, Paper, Tabs, Tab, Box, Button, IconButton, Tooltip } from '@mui/material'
import { useRouter } from 'next/router'
import AddIcon from '@mui/icons-material/Add'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'

import { AppRoutes } from '@/config/routes'
import { trackEvent, OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import useWallet from '@/hooks/wallets/useWallet'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import type { OrderByOption } from '@/store/orderByPreferenceSlice'
import OrderByButton from '@/features/myAccounts/components/OrderByButton'
import SearchField from './SearchField'
import PinnedSafesList from './PinnedSafesList'
import AllSafesList from './AllSafesList'
import FilteredSafesList from './FilteredSafesList'
import { YourDataTab } from './YourDataTab'

import css from './styles.module.css'

type SafeAccountsDropdownProps = {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
}

const SafeAccountsDropdown = ({ anchorEl, open, onClose }: SafeAccountsDropdownProps): ReactElement => {
  const [activeTab, setActiveTab] = useState<'pinned' | 'all' | 'yourdata'>('pinned')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const wallet = useWallet()
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'pinned' | 'all' | 'yourdata') => {
    setActiveTab(newValue)
    setSearchQuery('') // Clear search when switching tabs
    trackEvent({
      ...OVERVIEW_EVENTS.ACCOUNTS_DROPDOWN_TAB_SWITCH,
      label: OVERVIEW_LABELS.sidebar_dropdown,
    })
  }

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (value) {
      trackEvent({
        ...OVERVIEW_EVENTS.ACCOUNTS_DROPDOWN_SEARCH,
        label: OVERVIEW_LABELS.sidebar_dropdown,
      })
    }
  }, [])

  const handleSafeSelect = useCallback(() => {
    trackEvent({
      ...OVERVIEW_EVENTS.SWITCH_SAFE,
      label: OVERVIEW_LABELS.sidebar_dropdown,
    })
    onClose()
  }, [onClose])

  const handleAddSafe = () => {
    router.push(AppRoutes.newSafe.load)
    onClose()
  }

  const handleCreateSafe = () => {
    router.push(AppRoutes.newSafe.create)
    onClose()
  }

  const handleOrderByChange = (orderBy: OrderByOption) => {
    dispatch(setOrderByPreference({ orderBy }))
  }

  const handleOpenFullScreen = () => {
    router.push(AppRoutes.welcome.accounts)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Paper className={css.dropdown}>
        {/* Tabs with Full Screen Icon */}
        <Box className={css.tabsWrapper}>
          <Tabs value={activeTab} onChange={handleTabChange} className={css.tabs}>
            <Tab label="Pinned" value="pinned" />
            <Tab label="All accounts" value="all" />
            <Tab label="Your data" value="yourdata" />
          </Tabs>
          <Tooltip title="Open full screen view">
            <IconButton onClick={handleOpenFullScreen} size="small" className={css.fullScreenButton}>
              <OpenInFullIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Content based on active tab */}
        {activeTab === 'yourdata' ? (
          <YourDataTab />
        ) : (
          <>
            {/* Search Bar and Sort */}
            <Box className={css.filtersWrapper}>
              <Box className={css.searchFieldWrapper}>
                <SearchField
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search by name, ENS, address, or chain"
                />
              </Box>
              <Box className={css.sortButtonWrapper}>
                <OrderByButton orderBy={orderBy} onOrderByChange={handleOrderByChange} />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box className={css.actions}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddSafe}
                className={css.actionButton}
              >
                Add Account
              </Button>

              {wallet ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSafe}
                  className={css.actionButton}
                >
                  Create Account
                </Button>
              ) : (
                <Box className={css.actionButton}>
                  <ConnectWalletButton text="Connect" small />
                </Box>
              )}
            </Box>

            {/* Account List (scrollable) */}
            <Box className={css.accountList}>
              {searchQuery ? (
                <FilteredSafesList searchQuery={searchQuery} onSelect={handleSafeSelect} />
              ) : activeTab === 'pinned' ? (
                <PinnedSafesList onSelect={handleSafeSelect} />
              ) : (
                <AllSafesList onSelect={handleSafeSelect} />
              )}
            </Box>
          </>
        )}
      </Paper>
    </Popover>
  )
}

export default SafeAccountsDropdown
