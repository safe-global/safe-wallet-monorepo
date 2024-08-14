import Leaderboard from '@/components/leaderboard/Index'
import LeaderboardHeader from '@/components/leaderboard/LeaderboardHeader'
import { Box } from '@mui/material'
import Head from 'next/head'
import React from 'react'

function LeaderboardLayout() {
  return (
    <>
      <Head>
        <title>{'Superchain Account – Leaderboard'}</title>
      </Head>
      <Box width="100%" height="100%">
        <LeaderboardHeader />
        <Leaderboard />
      </Box>
    </>
  )
}

export default LeaderboardLayout
