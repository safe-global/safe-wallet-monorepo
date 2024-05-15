import { Grid } from '@mui/material'
import React, { useEffect } from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import type { ResponseBadges } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
import badgesService from '@/features/superChain/services/badges.service'

function Badges() {
  const superChainAccount = useAppSelector(selectSuperChainAccount)
  const { data, isLoading, isRefetching, error, dataUpdatedAt } = useQuery<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }>({
    queryKey: ['badges', superChainAccount.data.smartAccount],
    queryFn: async () => await badgesService.getBadges(superChainAccount.data.smartAccount),
  })

  useEffect(() => {
    console.debug('This is pretty weird', { data })
  }, [data])

  useEffect(() => {
    console.debug({ dataUpdatedAt })
  }, [dataUpdatedAt])

  return (
    <Grid spacing={2} container>
      <BadgesHeader />
      <BadgesActions />
      <BadgesContent badges={data?.currentBadges} isLoading={isLoading} error={error} />
    </Grid>
  )
}

export default Badges
