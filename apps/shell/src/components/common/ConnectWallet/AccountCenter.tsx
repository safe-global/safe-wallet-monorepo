import type { MouseEvent } from 'react'
import { useState } from 'react'
import { Box, ButtonBase, Paper, Popover, Typography } from '@mui/material'
import css from './styles.module.css'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'

const AccountCenter = ({ wallet }: { wallet: ConnectedWallet }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const { balance, address, ens, label } = wallet

  const openWalletInfo = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const closeWalletInfo = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'wallet-popover' : undefined

  // Format address for display
  const displayAddress = ens || `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <>
      <ButtonBase
        onClick={openWalletInfo}
        aria-describedby={id}
        disableRipple
        sx={{ alignSelf: 'stretch' }}
        data-testid="open-account-center"
      >
        <Box className={css.buttonContainer}>
          <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5} px={2}>
            <Typography variant="body2" fontWeight="bold">
              {displayAddress}
            </Typography>
            {balance && (
              <Typography variant="caption" color="text.secondary">
                {balance}
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center" justifyContent="flex-end" ml="auto" pr={1}>
            {open ? <ExpandLessIcon color="inherit" /> : <ExpandMoreIcon color="inherit" />}
          </Box>
        </Box>
      </ButtonBase>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={closeWalletInfo}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          '& > .MuiPaper-root': {
            top: 'var(--header-height) !important',
          },
        }}
        transitionDuration={0}
      >
        <Paper className={css.popoverContainer}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {address}
            </Typography>
            {balance && (
              <Typography variant="body2" mt={1}>
                Balance: {balance}
              </Typography>
            )}
          </Box>
        </Paper>
      </Popover>
    </>
  )
}

export default AccountCenter
