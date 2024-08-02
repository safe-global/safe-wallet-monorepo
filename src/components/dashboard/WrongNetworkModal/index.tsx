import { Box, Button, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useCallback, useState } from 'react'
import WrongChain from '@/public/images/common/wrong-chain.svg'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { toQuantity } from 'ethers'
function WrongNetworkModal() {
  const [open, setOpen] = useState(true)
  const onClose = () => setOpen(false)
  const chain = useCurrentChain()
  const wallet = useWallet()
  const handleChainSwitch = useCallback(async () => {
    if (!wallet || !chain) return

    // await switchWalletChain(onboard, chain.chainId)
    try {
      await wallet?.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toQuantity(parseInt(chain.chainId)) }],
      })
      onClose()
    } catch (e) {
      console.error(e)
    }
  }, [chain])
  return (
    <Dialog
      className={css.claimModal}
      open={open}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        display="flex"
        flexDirection="column"
        gap="20px"
        padding="36px 24px 36px 24px"
        justifyContent="center"
        alignItems="center"
        fontSize="54px"
      >
        <SvgIcon fontSize="inherit" component={WrongChain} inheritViewBox />
        <Typography id="modal-modal-title" fontSize={24} fontWeight={600}>
          Wrong network
        </Typography>
        <Stack alignItems="center" spacing={1}>
          <Typography textAlign="center" id="modal-modal-description" fontSize={16}>
            You are connected to the wrong network. Switch over to the OP Mainnet in order to continue.
          </Typography>
        </Stack>
      </Box>

      <Button className={css.outsideButton} fullWidth onClick={handleChainSwitch} color="secondary" variant="contained">
        Switch to Optimism
      </Button>
    </Dialog>
  )
}

export default WrongNetworkModal
