import { Grid } from '@mui/material'
import React from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'

function Badges() {
  return (
    <Grid spacing={2} container>
      <BadgesHeader />
      <BadgesActions />
      <BadgesContent />
    </Grid>
  )
}

export default Badges
