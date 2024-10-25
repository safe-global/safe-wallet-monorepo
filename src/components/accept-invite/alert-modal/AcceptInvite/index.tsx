import { Box, Dialog, SvgIcon, Typography, AlertTitle, Alert, Button, Stack } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import css from './styles.module.css'
import { ModalContext } from '../..'
import BeautyAlert from '@/public/images/common/beauty-alert.svg'
import { zeroAddress } from 'viem'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'

function AcceptInvite({
  modalContext,
  onClose,
  handleAcceptInvitation,
}: {
  modalContext: ModalContext
  onClose: () => void
  handleAcceptInvitation: () => void
}) {
  const chain = useCurrentChain()
  const blockExplorerLink = chain && modalContext.safe ? getBlockExplorerLink(chain, modalContext.safe) : undefined

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
              <strong>{modalContext.superChainId}</strong>
            </Typography>
            <CopyAddressButton address={modalContext.safe ?? zeroAddress} />
            <ExplorerButton {...blockExplorerLink} onClick={stopPropagation} />
          </Stack>
        </Stack>

        <Alert severity="warning">
          <AlertTitle sx={{ fontWeight: 700 }}>Note</AlertTitle>
          you cannot disconnect once you have accepted an invite to a Super Account.
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
