import { Box, Card, CardActions, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React, { SyntheticEvent } from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import css from './styles.module.css'
import type { Address } from 'viem'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { ResponseBadges } from '@/types/super-chain'
function Badge({
  image,
  title,
  description,
  networkOrProtocol,
  points,
  tiers,
  isFavorite,
  id,
  switchFavorite,
  isSwitchFavoritePending,
  setCurrentBadge,
}: {
  image: string
  title: string
  description: string
  networkOrProtocol: string
  points: number
  tiers: number[]
  isFavorite: boolean
  id: number
  switchFavorite: ({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) => Promise<void>
  isSwitchFavoritePending: boolean
  setCurrentBadge: (badge: ResponseBadges) => void
}) {
  const { safeAddress, safeLoading } = useSafeInfo()
  const handleSwitchFavorite = async (event: SyntheticEvent, id: number, account: Address, isFavorite: boolean) => {
    event.stopPropagation()
    await switchFavorite({ id, account, isFavorite })
    console.debug('favorite switched')
  }

  const handlePickBadge = () => {
    const badge: ResponseBadges = {
      id,
      name: title,
      description,
      networkorprotocol: networkOrProtocol,
      points,
      favorite: isFavorite,
      image,
    }
    setCurrentBadge(badge)
  }
  return (
    <Card onClick={handlePickBadge} className={css.badgeContainer}>
      <CardContent>
        <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
          <IconButton
            disabled={isSwitchFavoritePending || safeLoading}
            onClick={(e) => handleSwitchFavorite(e, id, safeAddress as Address, !isFavorite)}
            className={css.hearth}
          >
            <SvgIcon component={isFavorite ? HeartFilled : Hearth} color="secondary" inheritViewBox fontSize="small" />
          </IconButton>
          <img src={image} alt={networkOrProtocol} />
          <Typography margin={0} fontWeight={600} fontSize={16} textAlign="center" variant="h4">
            {title}
          </Typography>
          <Typography margin={0} fontSize={14} fontWeight={400} textAlign="center" color="text.secondary">
            {description}
          </Typography>
          <Box border={2} borderRadius={1} padding="12px" borderColor="secondary.main">
            <Typography margin={0} textAlign="center" color="secondary.main">
              Unlock Next Tier:
            </Typography>
            <Typography textAlign="center" margin={0}>
              400 transactions on {networkOrProtocol}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
      <CardActions>
        <Box width="100%" display="flex" gap={1} pt={3} justifyContent="center" alignItems="center">
          <strong> {points} </strong> <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
        </Box>
      </CardActions>
    </Card>
  )
}

export default Badge
