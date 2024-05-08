import { Grid, Stack, Typography } from '@mui/material'
import React from 'react'
import Badge from '../badge'
import Concept from '@/public/images/concept/base.png'

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
          <Badge
            image={Concept}
            title="Base User"
            description="Number of transactions made on Base"
            networkOrProtocol="Base"
            points={20}
            tiers={[1, 2, 3]}
          />
          <Badge
            image={Concept}
            title="Base User"
            description="Number of transactions made on Base"
            networkOrProtocol="Base"
            points={20}
            tiers={[1, 2, 3]}
          />
          <Badge
            image={Concept}
            title="Base User"
            description="Number of transactions made on Base"
            networkOrProtocol="Base"
            points={20}
            tiers={[1, 2, 3]}
          />
          <Badge
            image={Concept}
            title="Base User"
            description="Number of transactions made on Base"
            networkOrProtocol="Base"
            points={20}
            tiers={[1, 2, 3]}
          />
          <Badge
            image={Concept}
            title="Base User"
            description="Number of transactions made on Base"
            networkOrProtocol="Base"
            points={20}
            tiers={[1, 2, 3]}
          />
        </Stack>
      </Grid>
    </Grid>
  )
}

export default BadgesContent
