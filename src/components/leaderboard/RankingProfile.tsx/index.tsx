import NounsAvatar from '@/components/common/NounsAvatar'
import { Box, Stack, SvgIcon, Typography } from '@mui/material'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import React from 'react'
import { NounProps } from '@/components/new-safe/create/steps/AvatarStep'

type _Props = {
  isMainProfile?: boolean
  position: number
  points: number
  name: string
  level: number
  noun: NounProps
  badges: number
}

function RankingProfile({ isMainProfile, position, points, name, level, badges, noun }: _Props) {
  return (
    <Box
      display="flex"
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border={isMainProfile ? 2 : 0}
      borderColor="secondary.main"
      borderRadius="6px"
      padding="8px 24px"
      bgcolor="white"
    >
      <Stack direction="row" alignItems="center" justifyContent="flex-start">
        <Box width={28} height={28} display="flex" justifyContent="center" alignItems="center">
          <Typography fontWeight={500}>{position}</Typography>
        </Box>
        <Stack paddingLeft={6} direction="row" alignItems="center" gap="12px">
          <Box width={32} height={32} borderRadius="6px">
            <NounsAvatar seed={noun} />
          </Box>
          <Typography fontSize={14}>
            <strong>{name.split('.superchain')[0]}</strong>.superchain
          </Typography>
          <Box bgcolor="GrayText" padding="3px 12px" borderRadius="100px">
            <Typography fontSize={12} fontWeight={500} color="white">
              Level: {level}
            </Typography>
          </Box>
          <Box bgcolor="GrayText" padding="3px 12px" borderRadius="100px" color="white">
            <Typography fontSize={12} fontWeight={500} color="white">
              Badges: {badges}
            </Typography>
          </Box>
        </Stack>
      </Stack>
      <Box display="flex" justifyContent="center" alignItems="center" gap="6px">
        <strong>{points}</strong>
        <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
      </Box>
    </Box>
  )
}

export default RankingProfile
