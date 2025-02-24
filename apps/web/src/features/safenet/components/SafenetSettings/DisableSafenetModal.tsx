import ChainIndicator from '@/components/common/ChainIndicator'
import ModalDialog from '@/components/common/ModalDialog'
import useChainId from '@/hooks/useChainId'
import CloseIcon from '@mui/icons-material/Close'
import { Button, DialogActions, DialogContent, Stack, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import css from './styles.module.css'

const DisableSafenetModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const chainId = useChainId()

  const disableSafenet = () => {
    // TODO: Handle Safenet opt out
  }

  return (
    <ModalDialog
      data-testid="disable-safenet-dialog"
      open
      onClose={onClose}
      dialogTitle="Are you sure?"
      hideChainIndicator
      maxWidth="xs"
    >
      <DialogContent sx={{ mt: 3 }}>
        <Stack spacing={2}>
          <Typography fontWeight={700}>Disabling Safenet will result in the loss of:</Typography>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Aggregation of Ethereum&apos;s assets in the unified balance</Typography>
          </Stack>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Instant cross-chain transactions on Ethereum, without bridging</Typography>
          </Stack>
          <Stack flexDirection="row" gap={2}>
            <CloseIcon className={css.closeIcon} />
            <Typography>Sponsored transactions on Ethereum</Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={disableSafenet} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
          Disable Safenet on
          <ChainIndicator chainId={chainId} className={css.chainIndicator} />
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default DisableSafenetModal
