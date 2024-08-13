import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import { Box } from '@mui/material'
import Head from 'next/head'
import React from 'react'

function Leaderboard() {
  return (
    <>
      <Head>
        <title>{'Superchain Account – Leaderboard'}</title>
      </Head>
      <Box width="100%" height="100%">
        <LeaderboardHeader />
      </Box>
    </>
  )
}

export default Leaderboard
