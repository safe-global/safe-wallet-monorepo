import { Box, Button, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useState, type SyntheticEvent } from 'react'
import BeautySuccess from '@/public/images/common/beauty-success.svg'
import css from './styles.module.css'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useRouter } from 'next/router'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import useSafeAddress from '@/hooks/useSafeAddress'
function EOAAddedModal() {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  const [open, setOpen] = useState(true)
  const onClose = () => setOpen(false)
  const router = useRouter()
  const address = useSafeAddress()
  const { superChainId = '' } = router.query

  const chain = useCurrentChain()
  const blockExplorerLink = chain && address ? getBlockExplorerLink(chain, address) : undefined
  return (
    <Dialog
      className={css.claimModal}
      open={open}
      onClose={onClose}
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
        fontSize="48px"
      >
        <SvgIcon fontSize="inherit" component={BeautySuccess} inheritViewBox />
        <Typography id="modal-modal-title" fontSize={24} fontWeight={600}>
          Wallet successfully added
        </Typography>
        <Stack alignItems="center" spacing={1}>
          <Typography id="modal-modal-description" fontSize={16}>
            Your wallet is now connected to Super Account:{' '}
          </Typography>
          <Stack alignItems="center" direction="row">
            <Typography id="modal-modal-description" fontSize={16}>
              <strong>{superChainId}</strong>
            </Typography>
            <CopyAddressButton address={address} />
            <ExplorerButton {...blockExplorerLink} onClick={stopPropagation} />
          </Stack>
        </Stack>
      </Box>

      <Button className={css.outsideButton} fullWidth onClick={onClose} variant="contained">
        Continue
      </Button>
    </Dialog>
  )
}

export default EOAAddedModal
