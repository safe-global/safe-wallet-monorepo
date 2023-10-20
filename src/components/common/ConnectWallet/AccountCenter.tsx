import type { MouseEvent } from 'react'
import { useState } from 'react'
import { Box, Button, ButtonBase, Paper, Popover } from '@mui/material'
import css from '@/components/common/ConnectWallet/styles.module.css'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import useOnboard, { switchWallet } from '@/hooks/wallets/useOnboard'
import { useAppSelector } from '@/store'
import { selectChainById } from '@/store/chainsSlice'
import ChainSwitcher from '../ChainSwitcher'
import useAddressBook from '@/hooks/useAddressBook'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import WalletInfo from '../WalletInfo'
import ChainIndicator from '@/components/common/ChainIndicator'
import { ONBOARD_MPC_MODULE_LABEL } from '@/services/mpc/module'
import SocialLoginInfo from '@/components/common/SocialLoginInfo'

const AccountCenter = ({ wallet }: { wallet: ConnectedWallet }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const onboard = useOnboard()
  const chainInfo = useAppSelector((state) => selectChainById(state, wallet.chainId))
  const addressBook = useAddressBook()
  const prefix = chainInfo?.shortName

  const handleSwitchWallet = () => {
    if (onboard) {
      handleClose()
      switchWallet(onboard)
    }
  }

  const handleDisconnect = () => {
    if (!wallet) return

    onboard?.disconnectWallet({
      label: wallet.label,
    })

    handleClose()
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <>
      <ButtonBase onClick={handleClick} aria-describedby={id} disableRipple sx={{ alignSelf: 'stretch' }}>
        <Box className={css.buttonContainer}>
          <WalletInfo wallet={wallet} />

          <Box display="flex" alignItems="center" justifyContent="flex-end" marginLeft="auto">
            {open ? <ExpandLessIcon color="border" /> : <ExpandMoreIcon color="border" />}
          </Box>
        </Box>
      </ButtonBase>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ marginTop: 1 }}
      >
        <Paper className={css.popoverContainer}>
          <Box className={css.accountContainer}>
            <ChainIndicator />
            <Box className={css.addressContainer}>
              {wallet.label === ONBOARD_MPC_MODULE_LABEL ? (
                <SocialLoginInfo wallet={wallet} chainInfo={chainInfo} />
              ) : (
                <EthHashInfo
                  address={wallet.address}
                  name={addressBook[wallet.address] || wallet.ens}
                  hasExplorer
                  showCopyButton
                  prefix={prefix}
                  avatarSize={32}
                />
              )}
            </Box>
          </Box>

          <ChainSwitcher fullWidth />

          <Button variant="contained" size="small" onClick={handleSwitchWallet} fullWidth>
            Switch wallet
          </Button>

          <Button onClick={handleDisconnect} variant="danger" size="small" fullWidth disableElevation>
            Disconnect
          </Button>
        </Paper>
      </Popover>
    </>
  )
}

export default AccountCenter
