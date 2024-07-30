import { Box, Dialog, Grid, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import SuperChainStar from '@/public/images/common/superchain-star.svg'
import css from './styles.module.css'

function LoadingTxn({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          Accepting invite
        </Typography>
        <SvgIcon className={css.spin} component={SuperChainStar} inheritViewBox fontSize="inherit" />
      </Box>
    </Dialog>
  )
}

export default LoadingTxn
