import { Grid, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import SuperChainStart from '@/public/images/common/superchain-star.svg'

function LoadingTxn() {
  return (
    <Grid>
      <Grid item>
        <Typography fontSize={24} fontWeight={600}>
          Topping up your account
        </Typography>
        <SvgIcon component={SuperChainStart} inheritViewBox />
        <Stack direction="row" spacing={2}>
          <Typography color="GrayText">View on explorer</Typography>
        </Stack>
      </Grid>
    </Grid>
  )
}

export default LoadingTxn
