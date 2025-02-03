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
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')

  const { data, isLoading, error } = useQuery<{
    currentBadges: ResponseBadge[]
  }>({
    queryKey: ['badges', safeAddress, safeLoaded],
    queryFn: async () => await badgesService.getBadges(safeAddress as `0x${string}`),
    refetchInterval: 5000,
    enabled: !!safeLoaded,
  })
  const isClaimable = useMemo(() => data?.currentBadges.some((badge) => badge.claimable), [data?.currentBadges])
  const filteredBadges = useMemo(() => {
    if (!data) return []
    let filtered = data.currentBadges
    if (searchTerm) {
      filtered = filtered.filter(
        (badge) =>
          badge.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          badge.metadata.platform.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (selectedNetwork && selectedNetwork !== 'all') {
      filtered = filtered.filter((badge) => badge.metadata.chain.toLowerCase() === selectedNetwork.toLowerCase())
    }
    return filtered
  }, [data?.currentBadges, searchTerm, selectedNetwork])

  return (
    <Grid spacing={2} container>
      <BadgesHeader
        level={Number(superChainAccount.level)}
        points={Number(superChainAccount.points)}
        pointsToNextLevel={Number(superChainAccount.pointsToNextLevel ?? superChainAccount.points)}
        totalBadges={data?.currentBadges.reduce((acc, badge) => acc + badge.badgeTiers.length, 0)}
        completeBadges={
          data?.currentBadges.reduce((acc, badge) => {
            acc += Number(badge.tier)
            return acc
          }, 0) ?? 0
        }
        isLoading={isLoading || isSuperChainLoading}
      />
      <BadgesActions setNetwork={setSelectedNetwork} setFilter={setSearchTerm} claimable={isClaimable ?? false} />
      <BadgesContent badges={filteredBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
