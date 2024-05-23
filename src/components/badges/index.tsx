import { Grid } from '@mui/material'
import React, { useMemo } from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import type { ResponseBadges } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import badgesService from '@/features/superChain/services/badges.service'
import useSafeInfo from '@/hooks/useSafeInfo'

function Badges() {
  const { data: superChainAccount, loading: isSuperChainLoading } = useAppSelector(selectSuperChainAccount)
  const { safeAddress, safeLoaded } = useSafeInfo()

  const { data, isLoading, error } = useQuery<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }>({
    queryKey: ['badges', safeAddress, safeLoaded],
    queryFn: async () => await badgesService.getBadges(safeAddress as `0x${string}`),
    enabled: !!safeLoaded,
  })
  const isClaimable = useMemo(() => data?.currentBadges.some((badge) => badge.claimable), [data?.currentBadges])
  return (
    <Grid spacing={2} container>
      <BadgesHeader
        level={Number(superChainAccount.level)}
        points={Number(superChainAccount.points)}
        pointsToNextLevel={Number(superChainAccount.points) * 2}
        totalBadges={data?.currentBadges.length}
        isLoading={isLoading || isSuperChainLoading}
      />
      <BadgesActions claimable={isClaimable ?? false} />
      <BadgesContent badges={data?.currentBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
