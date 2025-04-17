import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import CreateButton from '@/features/myAccounts/components/CreateButton'
import css from '@/features/myAccounts/styles.module.css'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import AddIcon from '@/public/images/common/add.svg'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Box, Button, Link, SvgIcon, Typography } from '@mui/material'
import classNames from 'classnames'
import { useRouter } from 'next/router'

const AddSafeButton = ({ trackingLabel, onLinkClick }: { trackingLabel: string; onLinkClick?: () => void }) => {
  return (
    <Track {...OVERVIEW_EVENTS.ADD_TO_WATCHLIST} label={trackingLabel}>
      <Link href={AppRoutes.newSafe.load}>
        <Button
          data-testid="add-safe-button"
          disableElevation
          variant="outlined"
          size="small"
          onClick={onLinkClick}
          startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
          sx={{ height: '36px', width: '100%', px: 2 }}
        >
          <Box mt="1px">Add</Box>
        </Button>
      </Link>
    </Track>
  )
}

const AccountsHeader = ({ isSidebar, onLinkClick }: { isSidebar: boolean; onLinkClick?: () => void }) => {
  const wallet = useWallet()
  const router = useRouter()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isLoginPage = router.pathname === AppRoutes.welcome.accounts
  const trackingLabel = isLoginPage ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  return (
    <Box className={classNames(css.header, { [css.sidebarHeader]: isSidebar })}>
      {isSidebar || !isSpacesFeatureEnabled ? (
        <Typography variant="h1" fontWeight={700} className={css.title}>
          Accounts
        </Typography>
      ) : (
        <AccountsNavigation />
      )}

      <Box className={css.headerButtons}>
        <AddSafeButton trackingLabel={trackingLabel} onLinkClick={onLinkClick} />

        {wallet ? (
          <Track {...OVERVIEW_EVENTS.CREATE_NEW_SAFE} label={trackingLabel}>
            <CreateButton isPrimary />
          </Track>
        ) : (
          <Box sx={{ '& button': { height: '36px' } }}>
            <ConnectWalletButton small={true} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default AccountsHeader
