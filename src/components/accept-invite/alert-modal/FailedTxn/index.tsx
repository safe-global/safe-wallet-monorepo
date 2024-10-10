import React from 'react'
import { Box, Button, Dialog, Stack, SvgIcon, Typography } from '@mui/material'
import SuperChainBrokenStart from '@/public/images/common/superchain-star-broken.svg'
import css from './styles.module.css'

function FailedTxn({ open, onClose, handleRetry }: { open: boolean; onClose: () => void; handleRetry: () => void }) {
  return (
    <Dialog className={css.container} open={open} onClose={onClose}>
      <Box
        display="flex"
        flexDirection="column"
        gap="20px"
        padding="36px 24px 36px 24px"
        justifyContent="center"
        alignItems="center"
        fontSize="64px"
      >
        <Typography fontSize={24} fontWeight={600}>
          Error occurred
        </Typography>
        <Typography color="GrayText">Something went wrong during the transaction.</Typography>

        <SvgIcon component={SuperChainBrokenStart} inheritViewBox fontSize="inherit" />
      </Box>
      <Stack spacing={1} className={css.outsideButtonContainer} direction="row">
        <Button fullWidth onClick={onClose} variant="contained">
          Return
        </Button>
        <Button onClick={handleRetry} fullWidth color="secondary" variant="contained">
          Retry
        </Button>
      </Stack>
    </Dialog>
  )
}

export default FailedTxn
