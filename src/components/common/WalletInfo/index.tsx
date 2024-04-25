import WalletBalance from '@/components/common/WalletBalance'
import { WalletIdenticon } from '@/components/common/WalletOverview'
import { Box, Button, Typography } from '@mui/material'
import css from './styles.module.css'
import SocialLoginInfo from '@/components/common/SocialLoginInfo'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import LockIcon from '@/public/images/common/lock-small.svg'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import { IS_PRODUCTION } from '@/config/constants'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'
import useOnboard, { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useRouter } from 'next/router'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppSelector } from '@/store'
import { selectChainById } from '@/store/chainsSlice'
import madProps from '@/utils/mad-props'
import useSocialWallet from '@/hooks/wallets/mpc/useSocialWallet'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import useChainId from '@/hooks/useChainId'
import { usePrivy } from '@privy-io/react-auth'

type WalletInfoProps = {
  wallet: ConnectedWallet
  balance?: string | bigint
  currentChainId: ReturnType<typeof useChainId>
  socialWalletService: ReturnType<typeof useSocialWallet>
  router: ReturnType<typeof useRouter>
  onboard: ReturnType<typeof useOnboard>
  addressBook: ReturnType<typeof useAddressBook>
  handleClose: () => void
}

export const WalletInfo = ({
  wallet,
  balance,
  currentChainId,
  socialWalletService,
  router,
  onboard,
  addressBook,
  handleClose,
}: WalletInfoProps) => {
  const chainInfo = useAppSelector((state) => selectChainById(state, wallet.chainId))
  const prefix = chainInfo?.shortName
  const { logout } = usePrivy()

  // const handleSwitchWallet = () => {
  //   if (onboard) {
  //     handleClose()
  //     switchWallet(onboard)
  //   }
  // }

  const resetAccount = () => socialWalletService?.__deleteAccount()

  const handleDisconnect = () => {
    logout()

    handleClose()
  }

  const isSocialLogin = isSocialLoginWallet(wallet.label)

  return (
    <>
      <Box display="flex" gap="12px">
        {isSocialLogin ? (
          <Box>
            <SocialLoginInfo wallet={wallet} chainInfo={chainInfo} size={36} />

            {socialWalletService && !socialWalletService.isMFAEnabled() && (
              <Link href={{ pathname: AppRoutes.settings.securityLogin, query: router.query }} passHref>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  className={css.warningButton}
                  disableElevation
                  startIcon={<LockIcon />}
                  sx={{ mt: 1, p: 1 }}
                  onClick={handleClose}
                >
                  Add multifactor authentication
                </Button>
              </Link>
            )}
          </Box>
        ) : (
          <>
            <WalletIdenticon wallet={wallet} size={36} />
            <Typography variant="body2" className={css.address} component="div">
              <EthHashInfo
                address={wallet.address}
                name={addressBook[wallet.address] || wallet.ens || wallet.label}
                showAvatar={false}
                showPrefix={false}
                hasExplorer
                showCopyButton
                prefix={prefix}
              />
            </Typography>
          </>
        )}
      </Box>

      <Box className={css.rowContainer}>
        <Box className={css.row}>
          <Typography variant="body2" color="primary.light">
            Wallet
          </Typography>
          <Typography variant="body2">{wallet.label}</Typography>
        </Box>

        <Box className={css.row}>
          <Typography variant="body2" color="primary.light">
            Balance
          </Typography>
          <Typography variant="body2" textAlign="right">
            <WalletBalance balance={balance} />

            {currentChainId !== chainInfo?.chainId && (
              <>
                <Typography variant="body2" color="primary.light">
                  ({chainInfo?.chainName || 'Unknown chain'})
                </Typography>
              </>
            )}
          </Typography>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={2} width={1}>
        <ChainSwitcher fullWidth />

        {/* <Button variant="contained" size="small" onClick={handleSwitchWallet} fullWidth>
          Switch wallet
        </Button> */}

        <Button
          onClick={handleDisconnect}
          variant="danger"
          size="small"
          fullWidth
          disableElevation
          startIcon={<PowerSettingsNewIcon />}
        >
          Disconnect
        </Button>

        {!IS_PRODUCTION && isSocialLogin && (
          <Button onClick={resetAccount} variant="danger" size="small" fullWidth disableElevation>
            Delete account
          </Button>
        )}
      </Box>
    </>
  )
}

export default madProps(WalletInfo, {
  socialWalletService: useSocialWallet,
  router: useRouter,
  onboard: useOnboard,
  addressBook: useAddressBook,
  currentChainId: useChainId,
})
