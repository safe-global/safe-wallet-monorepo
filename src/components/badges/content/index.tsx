import { Grid, Stack, Typography } from '@mui/material'
import React from 'react'
import Badge from '../badge'

function BadgesContent() {
  return (
    <Grid container item spacing={1}>
      <Grid item xs={12}>
        <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
          All badges
        </Typography>
      </Grid>
      <Grid xs={12} item>
        <Stack direction="row" spacing={2} justifyContent="space-between" useFlexGap flexWrap="wrap">
          <Badge />
          <Badge />
          <Badge />
          <Badge />
          <Badge />
          <Badge />
          <Badge />
          <Badge />
        </Stack>
      </Grid>
    </Grid>
  )
}

export default BadgesContent
