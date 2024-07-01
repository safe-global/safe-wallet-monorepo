import { Grid } from '@mui/material'
import React, { useMemo, useState } from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import type { ResponseBadge } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import badgesService from '@/features/superChain/services/badges.service'
import useSafeInfo from '@/hooks/useSafeInfo'

function Badges() {
  const { data: superChainAccount, loading: isSuperChainLoading } = useAppSelector(selectSuperChainAccount)
  const { safeAddress, safeLoaded } = useSafeInfo()
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  const { data, isLoading, error } = useQuery<{
    currentBadges: ResponseBadge[]
  }>({
    queryKey: ['badges', safeAddress, safeLoaded],
    queryFn: async () => await badgesService.getBadges(safeAddress as `0x${string}`),
    enabled: !!safeLoaded,
  })
  const isClaimable = useMemo(() => data?.currentBadges.some((badge) => badge.claimable), [data?.currentBadges])
  const filteredBadges = useMemo(() => {
    if (!data) return []
    if (!searchTerm) return data.currentBadges
    return data.currentBadges.filter((badge) =>
      badge.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) || badge.metadata.platform.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data?.currentBadges, searchTerm])

  return (
    <Grid spacing={2} container>
      <BadgesHeader
        level={Number(superChainAccount.level)}
        points={Number(superChainAccount.points)}
        pointsToNextLevel={Number(superChainAccount.pointsToNextLevel ?? superChainAccount.points)}
        totalBadges={data?.currentBadges.length}
        completeBadges={
          data?.currentBadges.reduce((acc, badge) => {
            if (!badge.tier) return acc
            if (badge.tier === badge.badgeTiers.length) {
              acc += 1
            }
            return acc
          }, 0) ?? 0
        }
        isLoading={isLoading || isSuperChainLoading}
      />
      <BadgesActions setFilter={setSearchTerm} claimable={isClaimable ?? false} />
      <BadgesContent badges={filteredBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
