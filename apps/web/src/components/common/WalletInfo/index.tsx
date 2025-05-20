import WalletBalance from '@/components/common/WalletBalance'
import { WalletIdenticon } from '@/components/common/WalletOverview'
import { Box, Button, Typography } from '@mui/material'
import css from './styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import useOnboard, { type ConnectedWallet, switchWallet } from '@/hooks/wallets/useOnboard'
import useAddressBook from '@/hooks/useAddressBook'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectChainById } from '@/store/chainsSlice'
import madProps from '@/utils/mad-props'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import useChainId from '@/hooks/useChainId'
import { useAuthLogoutV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { setUnauthenticated } from '@/store/authSlice'
import { logError, Errors } from '@/services/exceptions'

type WalletInfoProps = {
  wallet: ConnectedWallet
  balance?: string | bigint
  currentChainId: ReturnType<typeof useChainId>
  onboard: ReturnType<typeof useOnboard>
  addressBook: ReturnType<typeof useAddressBook>
  handleClose: () => void
}

export const WalletInfo = ({ wallet, balance, currentChainId, onboard, addressBook, handleClose }: WalletInfoProps) => {
  const [authLogout] = useAuthLogoutV1Mutation()
  const dispatch = useAppDispatch()
  const chainInfo = useAppSelector((state) => selectChainById(state, wallet.chainId))
  const prefix = chainInfo?.shortName

  const handleSwitchWallet = () => {
    if (onboard) {
      handleClose()
      switchWallet(onboard)
    }
  }

  const handleDisconnect = async () => {
    onboard?.disconnectWallet({
      label: wallet.label,
    })
    try {
      await authLogout()
      dispatch(setUnauthenticated())
    } catch (error) {
      logError(Errors._108, error)
    }

    handleClose()
  }

  return (
    <>
      <Box display="flex" gap="12px">
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

        <Button variant="contained" size="small" onClick={handleSwitchWallet} fullWidth>
          Switch wallet
        </Button>

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
      </Box>
    </>
  )
}

export default madProps(WalletInfo, {
  onboard: useOnboard,
  addressBook: useAddressBook,
  currentChainId: useChainId,
})
