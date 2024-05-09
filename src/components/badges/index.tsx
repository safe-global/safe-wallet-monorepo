import { Grid } from '@mui/material'
import React from 'react'
import BadgesHeader from './header'
import BadgesActions from './actions'
import BadgesContent from './content'
import useAsync from '@/hooks/useAsync'
import { BACKEND_BASE_URI } from '@/config/constants'
import type { ResponseBadges } from '@/types/super-chain'

function Badges() {
  console.debug({ BACKEND_BASE_URI })
  const [data, error, loading] = useAsync<{
    currentBadges: ResponseBadges[]
    totalPoints: number
  }>(
    async () => {
      const response = await fetch(`${BACKEND_BASE_URI}/get-badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Address: '0x5E15DBf75d3819Dd9DA31Fc159Ce5bc5f3751AB0',
          Account: '0xf04E71B1D4de41f0F8EC2cE8fb7d5C213F7856bD',
        },
      })
      return await response.json()
    },
    [],
    false,
  )
  console.debug({ data, error, loading })
  return (
    <Grid spacing={2} container>
      <BadgesHeader />
      <BadgesActions />
      <BadgesContent badges={data?.currentBadges} isLoading={loading} />
    </Grid>
  )
}

export default Badges
