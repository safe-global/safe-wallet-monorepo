import { Drawer, Grid, Skeleton, Stack, Typography } from '@mui/material'
import React, { useMemo, useState } from 'react'
import Badge from '../badge'
import type { ResponseBadge } from '@/types/super-chain'
import badgesService from '@/features/superChain/services/badges.service'
import { type Address } from 'viem'
import useSafeInfo from '@/hooks/useSafeInfo'
import BadgeInfo from '../badgeInfo'
import css from './styles.module.css'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

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
  badges?: ResponseBadge[]
  isLoading: boolean
  error: Error | null
}) {
  const { safeAddress, safeLoaded } = useSafeInfo()
  const [currentBadge, setCurrentBadge] = useState<(ResponseBadge & { isFavorite: boolean }) | null>(null)
  const [favoriteBadgesLocalStorage, setFavoriteBadgesLocalStorage] = useLocalStorage<string>('favoriteBadges')
  const favoriteBadges = useMemo(
    () => (safeLoaded ? badgesService.getFavoriteBadges(safeAddress as Address) : []),
    [safeAddress, safeLoaded, favoriteBadgesLocalStorage],
  )

  if (isLoading)
    return (
      <Grid container item spacing={1}>
        <Grid xs={12} item>
          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
            <Skeleton className={css.badgeSkeleton} variant="rectangular" width={245} height={324} />
            <Skeleton className={css.badgeSkeleton} variant="rectangular" width={245} height={324} />
            <Skeleton className={css.badgeSkeleton} variant="rectangular" width={245} height={324} />
            <Skeleton className={css.badgeSkeleton} variant="rectangular" width={245} height={324} />
          </Stack>
        </Grid>
      </Grid>
    )
  if (error)
    return (
      <Grid container item spacing={1}>
        <Grid xs={12} item>
          <Typography>Error: {error.message}</Typography>
        </Grid>
      </Grid>
    )

  if (!badges)
    return (
      <Grid container item spacing={1}>
        <Grid xs={12} item>
          <Typography>No badges founded</Typography>
        </Grid>
      </Grid>
    )

  return (
    <Grid container item spacing={1}>
      {favoriteBadges.length > 0 && (
        <>
          <Grid item xs={12}>
            <Typography variant="h3" fontSize={12} fontWeight={600} color="primary.light">
              Favorite badges
            </Typography>
          </Grid>
          <Grid xs={12} item>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              {badges
                .filter((badge) => favoriteBadges.includes(badge.badgeId))
                .map((badge) => (
                  <Badge
                    data={badge}
                    key={badge.badgeId}
                    switchFavorite={() =>
                      badgesService.switchFavoriteBadge(
                        badge.badgeId,
                        safeAddress as Address,
                        false,
                        setFavoriteBadgesLocalStorage,
                      )
                    }
                    setCurrentBadge={setCurrentBadge}
                    isFavorite
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
            .filter((badge) => !favoriteBadges.includes(badge.badgeId))
            .map((badge) => (
              <Badge
                data={badge}
                key={badge.badgeId}
                switchFavorite={() =>
                  badgesService.switchFavoriteBadge(
                    badge.badgeId,
                    safeAddress as Address,
                    true,
                    setFavoriteBadgesLocalStorage,
                  )
                }
                setCurrentBadge={setCurrentBadge}
                isFavorite={false}
              />
            ))}
        </Stack>
      </Grid>
      <Drawer variant="temporary" anchor="right" onClose={() => setCurrentBadge(null)} open={!!currentBadge}>
        <BadgeInfo
          switchFavorite={({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) =>
            badgesService.switchFavoriteBadge(id, account, isFavorite, setFavoriteBadgesLocalStorage)
          }
          setCurrentBadge={setCurrentBadge}
          currentBadge={currentBadge}
        />
      </Drawer>
    </Grid>
  )
}

export default BadgesContent
