import { Skeleton, Stack, Typography } from '@mui/material'
import React from 'react'
import RankingProfile from './RankingProfile/index'
import { useLeaderboard } from '@/hooks/super-chain/useLeaderboard'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { Address } from 'viem'
import { useUserRank } from '@/hooks/super-chain/useUserRank'
import InfiniteScroll from '../common/InfiniteScroll'

function Leaderboard({ handleUserSelect }: { handleUserSelect: (_: string) => void }) {
  const address = useSafeAddress()
  const {
    data,
    isLoading: leaderboardIsLoading,
    error: leaderboardError,
    isFetchingNextPage: leaderboardIsFetching,
    fetchNextPage,
    hasNextPage,
  } = useLeaderboard()
  const { rank, user, loading: rankIsLoading, error: rankError } = useUserRank(address as Address)

  const handleLoadMore = () => {
    if (!leaderboardIsFetching && hasNextPage) {
      fetchNextPage()
    }
  }

  if (leaderboardError) return

  if (leaderboardIsLoading || rankIsLoading || !data || !rank || !user) {
    return (
      <main>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography fontSize={12} fontWeight={600} color="gray">
              YOUR RANKING
            </Typography>
            <Skeleton variant="rounded" height={48} />
          </Stack>
          <Stack spacing={1}>
            <Typography fontSize={12} fontWeight={600} color="gray">
              TOP USERS OF ALL-TIME
            </Typography>
            {Array.from(new Array(5)).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={48} />
            ))}
          </Stack>
        </Stack>
      </main>
    )
  }

  return (
    <main>
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography fontSize={12} fontWeight={600} color="gray">
            YOUR RANKING
          </Typography>
          <RankingProfile
            isMainProfile
            onClick={() => handleUserSelect(address)}
            position={rank!}
            points={user!.total_points}
            name={user!.superChainId}
            level={user!.level.toString()}
            badges={0}
            noun={{
              accessory: user!.noun.accessory,
              background: user!.noun.background,
              body: user!.noun.body,
              glasses: user!.noun.glasses,
              head: user!.noun.head,
            }}
          />
        </Stack>
        <Stack spacing={1} height="100%">
          <Typography fontSize={12} fontWeight={600} color="gray">
            TOP USERS OF ALL-TIME
          </Typography>
          {data.pages.map((page, pageIndex) =>
            page.data.map((user, index) => (
              <RankingProfile
                key={`${pageIndex}-${index}`}
                position={index + 1 + pageIndex * 20}
                points={user.total_points}
                onClick={() => handleUserSelect(user.superaccount)}
                name={user.superChainId}
                level={user.level.toString()}
                isMainProfile={user.superaccount.toLowerCase() === address.toLowerCase()}
                badges={0}
                noun={{
                  accessory: user.noun.accessory,
                  background: user.noun.background,
                  body: user.noun.body,
                  glasses: user.noun.glasses,
                  head: user.noun.head,
                }}
              />
            )),
          )}

          {hasNextPage &&
            (leaderboardIsFetching ? (
              <Skeleton variant="rounded" height={48} />
            ) : (
              <InfiniteScroll onLoadMore={handleLoadMore} />
            ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default Leaderboard
