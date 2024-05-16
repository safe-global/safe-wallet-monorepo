import { Box, IconButton, Stack, SvgIcon, Typography } from '@mui/material'
import React from 'react'
import css from './styles.module.css'
import type { ResponseBadges } from '@/types/super-chain'
import Link from 'next/link'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Share from '@/public/images/common/share.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
function BadgeInfo({
  currentBadge,
  setCurrentBadge,
  switchFavorite,
}: {
  currentBadge: ResponseBadges | null
  setCurrentBadge: (_: null | ResponseBadges) => void
  switchFavorite: ({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) => Promise<void>
}) {
  const { safe } = useSafeInfo()
  const handleSwitchFavorite = async () => {
    await switchFavorite({
      id: currentBadge?.id!,
      account: safe.address as unknown as Address,
      isFavorite: !currentBadge?.favorite,
    })
    setCurrentBadge({
      ...currentBadge!,
      favorite: !currentBadge?.favorite,
    })
    console.debug('favorite switched')
  }
  if (!currentBadge) return null
  return (
    <Stack padding="24px" justifyContent="flex-start" alignItems="center" spacing={2} className={css.drawer}>
      <Box
        display="flex"
        width="100%"
        paddingTop="24px"
        position="relative"
        justifyContent="center"
        alignItems="center"
      >
        <img src={currentBadge?.image!} />
        <Box display="flex" gap={1} position="absolute" top="10%" right="0">
          <IconButton className={css.actionBtn}>
            <SvgIcon component={Share} color="inherit" inheritViewBox fontSize="small" />
          </IconButton>
          <IconButton onClick={handleSwitchFavorite} className={css.actionBtn}>
            <SvgIcon
              component={currentBadge?.favorite ? HeartFilled : Hearth}
              color="inherit"
              inheritViewBox
              fontSize="small"
            />
          </IconButton>
          <IconButton onClick={() => setCurrentBadge(null)} className={css.actionBtn}>
            <SvgIcon component={Close} color="inherit" inheritViewBox fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center">
        <Typography fontSize={20} fontWeight={600}>
          {currentBadge?.name}
        </Typography>
        <Typography fontSize={12} fontWeight={400}>
          {currentBadge?.description}
        </Typography>
      </Box>
      <Box
        border={2}
        borderRadius={1}
        display="flex"
        justifyContent="center"
        width="100%"
        alignItems="center"
        padding="12px"
        flexDirection="column"
        borderColor="secondary.main"
      >
        <Typography fontSize={12} fontWeight={600} color="secondary">
          Unlock Next Tier:
        </Typography>
        <Typography fontSize={12} fontWeight={400}>
          400 something on somewhere
        </Typography>
      </Box>
      <Box
        border={2}
        borderRadius={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        padding="12px"
        flexDirection="column"
        width="100%"
        borderColor="primary.light"
      >
        <Typography fontSize={12} fontWeight={500}>
          <strong>Network: </strong>
          Ethereum
        </Typography>
        <Typography fontSize={12} fontWeight={500}>
          <strong>Current Tier:</strong> 0
        </Typography>
        <Typography fontSize={12} fontWeight={500}>
          <strong>Next rewards:</strong> 0
        </Typography>
      </Box>
      <Box
        border={2}
        borderRadius={1}
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        padding="12px"
        flexDirection="column"
        borderColor="primary.light"
      >
        <Typography fontSize={12} fontWeight={600}>
          Website:
        </Typography>
        <Link href="https://something.com">
          <Typography fontSize={12} fontWeight={500}>
            https://something.com
          </Typography>
        </Link>
      </Box>
    </Stack>
  )
}

export default BadgeInfo
