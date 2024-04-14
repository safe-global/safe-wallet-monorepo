import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import madProps from '@/utils/mad-props'
import { Popover, ButtonBase, Typography, Paper, Box } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import classnames from 'classnames'
import { useState, type MouseEvent, type ReactElement } from 'react'

import KeyholeIcon from '@/components/common/icons/KeyholeIcon'
import WalletDetails from '@/components/common/ConnectWallet/WalletDetails'

import css from '@/components/common/ConnectWallet/styles.module.css'

export const ConnectionCenter = ({ isSocialLoginEnabled }: { isSocialLoginEnabled: boolean }): ReactElement => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const open = !!anchorEl

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const ExpandIcon = open ? ExpandLessIcon : ExpandMoreIcon

  if (!isSocialLoginEnabled) {
    return (
      <Box className={css.buttonContainer}>
        <ConnectWalletButton small={true} />
      </Box>
    )
  }

  return (
    <>
      <ButtonBase disableRipple onClick={handleClick} className={css.buttonContainer}>
        <KeyholeIcon />

        <Typography variant="caption" className={css.notConnected}>
          <b>Not connected</b>
          <Typography variant="inherit" sx={{ color: ({ palette }) => palette.error.main }}>
            LogIn or SigUp
          </Typography>
        </Typography>

        <ExpandIcon color="border" />
      </ButtonBase>

      <Popover
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
        sx={{ mt: 1 }}
        transitionDuration={0}
      >
        <Paper className={classnames(css.popoverContainer, css.largeGap)}>
          <WalletDetails onConnect={handleClose} />
        </Paper>
      </Popover>
    </>
  )
}

const useIsSocialLoginEnabled = () => useHasFeature(FEATURES.SOCIAL_LOGIN)

export default madProps(ConnectionCenter, {
  isSocialLoginEnabled: useIsSocialLoginEnabled,
})
