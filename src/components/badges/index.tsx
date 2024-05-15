import { Grid } from '@mui/material'
import React from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import { BACKEND_BASE_URI } from '@/config/constants'
import type { ResponseBadges } from '@/types/super-chain'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'

function Badges() {
  const superChainAccount = useAppSelector(selectSuperChainAccount)
  const { data, isLoading, isRefetching } = useQuery<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }>({
    queryKey: ['badges', superChainAccount.data?.smartAccount],
    queryFn: async () => {
      if (superChainAccount.loading) return null
      const response = await fetch(`${BACKEND_BASE_URI}/get-badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Account: superChainAccount.data?.smartAccount,
        },
      })
      console.debug({ response })
      return await response.json()
    },
  })

  console.debug({ isRefetching })
  return (
    <Grid spacing={2} container>
      <BadgesHeader />
      <BadgesActions />
      <BadgesContent badges={data?.currentBadges} isLoading={isLoading} />
    </Grid>
  )
}

export default Badges
