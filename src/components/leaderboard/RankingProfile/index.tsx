import NounsAvatar from '@/components/common/NounsAvatar'
import { Box, Stack, SvgIcon, Typography } from '@mui/material'
import SuperChainPoints from '@/public/images/common/superChain.svg'
import React from 'react'
import { NounProps } from '@/components/new-safe/create/steps/AvatarStep'

type _Props = {
  isMainProfile?: boolean
  position: number
  points: string
  name: string
  level: string
  noun: NounProps
  badges: number
  onClick?: () => void
}

function RankingProfile({ isMainProfile, position, points, name, level, badges, noun, onClick }: _Props) {
  return (
    <Box
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      display="flex"
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      border={isMainProfile ? 2 : 0}
      borderColor="secondary.main"
      borderRadius="6px"
      padding={{
        xs: '4px 8px',
        sm: '8px 24px',
      }}
      bgcolor="white"
    >
      <Stack direction="row" alignItems="center" justifyContent="flex-start">
        <Box height={28} width={28} display="flex" justifyContent="center" alignItems="center">
          <Typography fontWeight={500}>{position}</Typography>
        </Box>
        <Stack paddingLeft={{ xs: 0, sm: 6 }} direction="row" alignItems="center" gap={{ xs: '6px', sm: '12px' }}>
          <Box width={32} height={32} borderRadius="6px">
            <NounsAvatar seed={noun} />
          </Box>
          <Typography fontSize={14}>
            <strong>{name.split('.superchain')[0]}</strong>.superchain
          </Typography>
          <Box display={{ xs: 'none', sm: 'block' }} bgcolor="GrayText" padding="3px 12px" borderRadius="100px">
            <Typography fontSize={12} fontWeight={500} color="white">
              Level: {level}
            </Typography>
          </Box>
          <Box
            display={{ xs: 'none', sm: 'block' }}
            bgcolor="GrayText"
            padding="3px 12px"
            borderRadius="100px"
            color="white"
          >
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
