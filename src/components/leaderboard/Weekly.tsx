import { Stack, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import RankingProfile from './RankingProfile/index'
import { useWeeklyLeaderboard } from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'

function WeeklyLeaderboard() {
  const address = useSafeAddress()
  const { leaderboard: data, loading } = useWeeklyLeaderboard()
  // const {
  //   rank,
  //   error,
  //   loading: rankLoading,
  // } = useUserRank(address as Address, data?.superChainSmartAccount.points, loading)
  const currentUser = useMemo(() => {
    const index = data?.superChainSmartAccounts.findIndex((user) => user.safe.toLowerCase() === address.toLowerCase())

    if (index !== -1 && index !== undefined) {
      return { rank: index + 1, user: data?.superChainSmartAccounts[index] }
    }

    return { rank: index, user: null } // Retorna -1 y null si no se encuentra al usuario
  }, [data, address])

  if (loading || !data) return

  return (
    <main>
      <Stack spacing={2}>
        {currentUser.user && (
          <Stack spacing={1}>
            <Typography fontSize={12} fontWeight={600} color="gray">
              YOUR RANKING
            </Typography>
            <RankingProfile
              isMainProfile
              position={currentUser.rank}
              points={currentUser.user!.points}
              name={currentUser.user!.superChainId}
              level={currentUser.user!.level}
              badges={currentUser.user!.badges.length}
              noun={{
                accessory: parseInt(currentUser.user!.noun_accessory),
                background: parseInt(currentUser.user!.noun_background),
                body: parseInt(currentUser.user!.noun_body),
                glasses: parseInt(currentUser.user!.noun_glasses),
                head: parseInt(currentUser.user!.noun_head),
              }}
            />
          </Stack>
        )}
        <Stack spacing={1}>
          <Typography fontSize={12} fontWeight={600} color="gray">
            TOP USERS OF ALL-TIME
          </Typography>
          {data.superChainSmartAccounts.map((user, index) => (
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

export default WeeklyLeaderboard
