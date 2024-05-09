import { Grid, Stack, Typography } from '@mui/material'
import React from 'react'
import Badge from '../badge'
import type { ResponseBadges } from '@/types/super-chain'

function BadgesContent({ badges, isLoading }: { badges?: ResponseBadges[]; isLoading: boolean }) {
  console.debug({ badges, isLoading })
  if (isLoading || !badges) return <Typography>Loading...</Typography>
  return (
    <Grid container item spacing={1}>
      <Grid item xs={12}>
        <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
          All badges
        </Typography>
      </Grid>
      <Grid xs={12} item>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          {badges.map((badge) => (
            <Badge
              key={badge.id}
              image={badge.image!}
              title={badge.name}
              description={badge.description!}
              networkOrProtocol={badge.networkorprotocol!}
              points={badge.points}
              tiers={[1, 2, 3]}
            />
          ))}
        </Stack>
      </Grid>
    </Grid>
  )
}

export default BadgesContent
