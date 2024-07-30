import { Box, Dialog, SvgIcon, Typography, AlertTitle, Alert, Button, Stack } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import css from './styles.module.css'
import { ModalContext } from '../..'
import BeautyAlert from '@/public/images/common/beauty-alert.svg'
import { zeroAddress } from 'viem'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import ExplorerButton from '@/components/common/ExplorerButton'

function AcceptInvite({
  modalContext,
  onClose,
  handleAcceptInvitation,
}: {
  modalContext: ModalContext
  onClose: () => void
  handleAcceptInvitation: () => void
}) {
  const stopPropagation = (e: SyntheticEvent) => e.stopPropagation()
  return (
    <Dialog
      className={css.claimModal}
      open={modalContext.isOpen}
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
        <SvgIcon fontSize="inherit" component={BeautyAlert} inheritViewBox />
        <Typography id="modal-modal-title" fontSize={24} fontWeight={600}>
          Accepting invite
        </Typography>
        <Stack alignItems="center" spacing={1}>
          <Typography id="modal-modal-description" fontSize={16}>
            Are you sure you want to connect your wallet to:
          </Typography>
          <Stack alignItems="center" direction="row">
            <Typography id="modal-modal-description" fontSize={16}>
              <strong>luuk.superchain</strong>
            </Typography>
            <CopyAddressButton address={zeroAddress} />
            <ExplorerButton onClick={stopPropagation} />
          </Stack>
        </Stack>

        <Alert severity="warning">
          <AlertTitle sx={{ fontWeight: 700 }}>Note</AlertTitle>
          You can cannot disconnect once you have accepted an invite to a Superchain Account.
        </Alert>
      </Box>
      <Stack spacing={1} className={css.outsideButtonContainer} direction="row">
        <Button fullWidth color="background" onClick={onClose} variant="contained">
          Go back
        </Button>
        <Button fullWidth onClick={handleAcceptInvitation} variant="contained" color="secondary">
          Accept
        </Button>
      </Stack>
    </Dialog>
  )
}

export default AcceptInvite
