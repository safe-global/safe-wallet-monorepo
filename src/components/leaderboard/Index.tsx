import { Box, Stack, Typography } from '@mui/material'
import React from 'react'
import RankingProfile from './RankingProfile.tsx'
import useLeaderboard from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { Address } from 'viem'

function Leaderboard() {
  const address = useSafeAddress()
  const { data, loading } = useLeaderboard(address as Address)
  if (loading) return
  return (
    <main>
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography fontSize={12} fontWeight={600} color="gray">
            YOUR RANKING
          </Typography>
          <RankingProfile
            isMainProfile
            position={500}
            points={data!.superChainSmartAccount.points}
            name={data!.superChainSmartAccount.superChainId}
            level={5}
            badges={data!.superChainSmartAccount.badges.length}
            noun={{
              accessory: data!.superChainSmartAccount.noun_accessory,
              background: data!.superChainSmartAccount.noun_background,
              body: data!.superChainSmartAccount.noun_body,
              glasses: data!.superChainSmartAccount.noun_glasses,
              head: data!.superChainSmartAccount.noun_head,
            }}
          />
        </Stack>
        <Stack spacing={1}>
          <Typography fontSize={12} fontWeight={600} color="gray">
            TOP USERS OF ALL-TIME
          </Typography>
          {data?.superChainSmartAccounts.map((user, index) => (
            <RankingProfile
              key={index}
              position={index + 1}
              points={user.points}
              name={user.superChainId}
              level={user.level}
              badges={user.badges.length}
              noun={{
                accessory: user.noun_accessory,
                background: user.noun_background,
                body: user.noun_body,
                glasses: user.noun_glasses,
                head: user.noun_head,
              }}
            />
          ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
