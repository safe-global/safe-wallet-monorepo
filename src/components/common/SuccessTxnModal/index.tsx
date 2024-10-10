import { Box, Button, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import React, { type SyntheticEvent } from 'react'
import BeautySuccess from '@/public/images/common/beauty-success.svg'
import css from './styles.module.css'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import ExplorerButton from '@/components/common/ExplorerButton'
import { useCurrentChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
type Props = {
  title: string
  description?: string
  onClose: () => void
  open: boolean
  hash: string
}
function SuccessTxnModal({ title, description, onClose, open, hash }: Props) {
  const stopPropagation = (e: SyntheticEvent) => {
    e.stopPropagation()
  }
  const slicedHash = hash.slice(0, 10) + '...' + hash.slice(-4)
  const chain = useCurrentChain()
  const blockExplorerLink = chain && hash ? getBlockExplorerLink(chain, hash) : undefined
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
          {title}
        </Typography>
        <Stack alignItems="center" spacing={1}>
          {description && (
            <Typography id="modal-modal-description" fontSize={16}>
              {description}
            </Typography>
          )}
          <Stack alignItems="center" direction="row">
            <Typography id="modal-modal-description" fontSize={16}>
              <strong>{slicedHash}</strong>
            </Typography>
            <CopyAddressButton address={hash} />
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

export default SuccessTxnModal
