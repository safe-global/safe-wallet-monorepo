import { Box, Card, CardActions, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React, { useMemo, type SyntheticEvent } from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import css from './styles.module.css'
import type { Address } from 'viem'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { ResponseBadges } from '@/types/super-chain'
import classNames from 'classnames'
import Complete from '@/public/images/common/complete.svg'
function Badge({
  data,
  isSwitchFavoritePending,
  switchFavorite,
  setCurrentBadge,
}: {
  data: ResponseBadges
  switchFavorite: ({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) => Promise<void>
  isSwitchFavoritePending: boolean
  setCurrentBadge: (badge: ResponseBadges) => void
}) {
  const { safeAddress, safeLoading } = useSafeInfo()
  const handleSwitchFavorite = async (event: SyntheticEvent, id: number, account: Address, isFavorite: boolean) => {
    event.stopPropagation()
    await switchFavorite({ id, account, isFavorite })
  }
  const unClaimed = useMemo(() => {
    if (data?.claimableTier === null || data?.lastclaimtier === null) return false
    return data?.lastclaimtier === data?.claimableTier
  }, [data])

  const handlePickBadge = () => {
    const badge: ResponseBadges = {
      ...data,
    }
    setCurrentBadge(badge)
  }
  return (
    <Card
      onClick={handlePickBadge}
      className={classNames(css.badgeContainer, data.tiers.length - 1 === data.lastclaimtier && css.badgeComplete)}
    >
      <CardContent>
        <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
          <IconButton
            disabled={isSwitchFavoritePending || safeLoading}
            onClick={(e) => handleSwitchFavorite(e, data.id, safeAddress as Address, !data.favorite)}
            className={css.hearth}
          >
            <SvgIcon
              component={data.favorite ? HeartFilled : Hearth}
              color="secondary"
              inheritViewBox
              fontSize="small"
            />
          </IconButton>
          {data.lastclaimtier !== null ? (
            <img
              width={72}
              height={72}
              src={data.tiers[data.claimableTier!]['3DImage']}
              className={!unClaimed ? css.unclaimed : undefined}
              alt={data.networkorprotocol}
            />
          ) : (
            <img
              width={72}
              height={72}
              src={data.tiers[0]['3DImage']}
              className={!unClaimed ? css.unclaimed : undefined}
              alt={data.networkorprotocol}
            />
          )}
          <Typography margin={0} fontWeight={600} fontSize={16} textAlign="center" variant="h4">
            {data.name}
          </Typography>
          <Typography margin={0} fontSize={14} fontWeight={400} textAlign="center" color="text.secondary">
            {data.description}
          </Typography>
          {data.tiers.length - 1 !== data.lastclaimtier && (
            <Box border={2} borderRadius={1} padding="12px" borderColor="secondary.main">
              {data.lastclaimtier !== null ? (
                <>
                  <Typography margin={0} textAlign="center" color="secondary.main">
                    Unlock Next Tier:
                  </Typography>
                  <Typography textAlign="center" margin={0}>
                    {data.tierdescription.replace(
                      '{{variable}}',
                      data.tiers[data.claimableTier! + 1].minValue.toString(),
                    )}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography margin={0} textAlign="center" color="secondary.main">
                    Unlock First Tier:
                  </Typography>
                  <Typography textAlign="center" margin={0}>
                    {data.tierdescription.replace('{{variable}}', data.tiers[0].minValue.toString())}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
      <CardActions>
        <Box width="100%" display="flex" gap={1} pt={3} justifyContent="center" alignItems="center">
          {data.tiers.length - 1 !== data.lastclaimtier ? (
            <>
              <strong>{data.lastclaimtier !== null ? data.points : data.tiers[0].points}</strong>{' '}
              <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
            </>
          ) : (
            <>
              <strong>Complete</strong> <SvgIcon component={Complete} inheritViewBox fontSize="medium" />
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  )
}

export default Badge
