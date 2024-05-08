import { Grid, Typography } from '@mui/material'
import React from 'react'

function BadgesContent() {
  return (
    <Grid container item spacing={1}>
      <Grid item xs={12}>
        <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
          All badges
        </Typography>
      </Grid>
      <Grid xs={12} item>
        There are the badges
      </Grid>
    </Grid>
  )
}

export default BadgesContent
