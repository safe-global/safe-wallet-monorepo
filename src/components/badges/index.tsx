import { Grid } from '@mui/material'
import React from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import type { ResponseBadges } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import badgesService from '@/features/superChain/services/badges.service'

function Badges() {
  const { data: superChainAccount, loading: isSuperChainLoading } = useAppSelector(selectSuperChainAccount)
  const { data, isLoading, error } = useQuery<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }>({
    queryKey: ['badges', superChainAccount.smartAccount],
    queryFn: async () => await badgesService.getBadges(superChainAccount.smartAccount),
  })

  return (
    <Grid spacing={2} container>
      <BadgesHeader
        level={Number(superChainAccount.level)}
        points={Number(superChainAccount.points)}
        pointsToNextLevel={Number(superChainAccount.points) * 2}
        totalBadges={data?.currentBadges.length}
        isLoading={isLoading || isSuperChainLoading}
      />
      <BadgesActions />
      <BadgesContent badges={data?.currentBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
