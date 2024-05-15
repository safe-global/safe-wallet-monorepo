import { Grid, Stack, Typography } from '@mui/material'
import React from 'react'
import Badge from '../badge'
import type { ResponseBadges } from '@/types/super-chain'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'
import { type Address } from 'viem'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'

type Params = {
  id: number
  account: string
  isFavorite: boolean
}

function BadgesContent({
  badges,
  isLoading,
  error,
}: {
  badges?: ResponseBadges[]
  isLoading: boolean
  error: Error | null
}) {
  const queryClient = useQueryClient()
  const superChainAccount = useAppSelector(selectSuperChainAccount)

  const { mutateAsync, isPending } = useMutation<void, Error, Params, unknown>({
    mutationFn: async (params) => {
      return await badgesService.switchFavoriteBadge(params.id, params.account as Address, params.isFavorite)
    },
    onSuccess: async (_, variables) => {
      queryClient.setQueryData(['badges', superChainAccount.data.smartAccount], (oldData: any) => {
        return {
          ...oldData,
          currentBadges: oldData.currentBadges.map((badge: ResponseBadges) => {
            if (badge.id === variables.id) {
              return {
                ...badge,
                favorite: !badge.favorite,
              }
            }
            return badge
          }),
        }
      })
    },
  })
  if (isLoading) return <Typography>Loading...</Typography>
  if (error) return <Typography>Error: {error.message}</Typography>
  if (!badges) return <Typography>No badges found</Typography>

  return (
    <Grid container item spacing={1}>
      {badges.find((badge) => !!badge.favorite) && (
        <>
          <Grid item xs={12}>
            <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
              Favorite badges
            </Typography>
          </Grid>
          <Grid xs={12} item>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              {badges
                .filter((badge) => !!badge.favorite)
                .map((badge) => (
                  <Badge
                    key={badge.id}
                    id={badge.id}
                    image={badge.image!}
                    title={badge.name}
                    description={badge.description!}
                    networkOrProtocol={badge.networkorprotocol!}
                    points={badge.points}
                    tiers={[1, 2, 3]}
                    isFavorite={badge.favorite!}
                    switchFavorite={mutateAsync}
                    isSwitchFavoritePending={isPending}
                  />
                ))}
            </Stack>
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
          All badges
        </Typography>
      </Grid>
      <Grid xs={12} item>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          {badges
            .filter((badge) => !badge.favorite)
            .map((badge) => (
              <Badge
                key={badge.id}
                id={badge.id}
                image={badge.image!}
                title={badge.name}
                description={badge.description!}
                networkOrProtocol={badge.networkorprotocol!}
                points={badge.points}
                tiers={[1, 2, 3]}
                isFavorite={badge.favorite!}
                switchFavorite={mutateAsync}
                isSwitchFavoritePending={isPending}
              />
            ))}
        </Stack>
      </Grid>
    </Grid>
  )
}

export default BadgesContent
