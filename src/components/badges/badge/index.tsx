import { Box, Card, CardActions, CardContent, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import css from './styles.module.css'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import badgesService from '@/features/superChain/services/badges.service'
import { useAppSelector } from '@/store'
import { selectSuperChainAccount } from '@/store/superChainAccountSlice'
function Badge({
  image,
  title,
  description,
  networkOrProtocol,
  points,
  tiers,
  isFavorite,
  id,
}: {
  image: string
  title: string
  description: string
  networkOrProtocol: string
  points: number
  tiers: number[]
  isFavorite: boolean
  id: number
}) {
  const queryClient = useQueryClient()
  const { data: superChainAccount, loading: isSuperChainAccountLoading } = useAppSelector(selectSuperChainAccount)
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (isSuperChainAccountLoading) return null
      return await badgesService.switchFavoriteBadge(id, superChainAccount.smartAccount, !isFavorite)
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['badges'] })
      console.info('Badge favorite status updated')
    },
  })

  return (
    <Card className={css.badgeContainer}>
      <CardContent>
        <Stack padding={0} justifyContent="center" alignItems="center" spacing={1} position="relative">
          <IconButton disabled={isPending} onClick={() => mutate()} className={css.hearth}>
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
