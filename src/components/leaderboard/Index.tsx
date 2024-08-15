import { Box, Stack, Typography } from '@mui/material'
import React from 'react'
import RankingProfile from './RankingProfile.tsx'
import useLeaderboard from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { Address } from 'viem'
import { add, head, map } from 'lodash'
import { useUserRank } from '@/hooks/super-chain/useUserRank'
import { color } from 'framer-motion'
import badges from '../badges/index.jsx'

function Leaderboard() {
  const address = useSafeAddress()
  const { data, loading } = useLeaderboard(address as Address)
  const {
    rank,
    error,
    loading: rankLoading,
  } = useUserRank(address as Address, data?.superChainSmartAccount.points, loading)
  if (loading || !data || rankLoading || error) return

  return (
    <main>
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography fontSize={12} fontWeight={600} color="gray">
            YOUR RANKING
          </Typography>
          <RankingProfile
            isMainProfile
            position={rank!}
            points={data!.superChainSmartAccount.points}
            name={data!.superChainSmartAccount.superChainId}
            level={data!.superChainSmartAccount.level}
            badges={data!.superChainSmartAccount.badges.length}
            noun={{
              accessory: parseInt(data!.superChainSmartAccount.noun_accessory),
              background: parseInt(data!.superChainSmartAccount.noun_background),
              body: parseInt(data!.superChainSmartAccount.noun_body),
              glasses: parseInt(data!.superChainSmartAccount.noun_glasses),
              head: parseInt(data!.superChainSmartAccount.noun_head),
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
              isMainProfile={user.safe.toLowerCase() === address.toLowerCase()}
              badges={user.badges.length}
              noun={{
                accessory: parseInt(user.noun_accessory),
                background: parseInt(user.noun_background),
                body: parseInt(user.noun_body),
                glasses: parseInt(user.noun_glasses),
                head: parseInt(user.noun_head),
              }}
            />
          ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
