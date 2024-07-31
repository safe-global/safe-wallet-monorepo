import { Box, IconButton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import css from './styles.module.css'
import type { ResponseBadge } from '@/types/super-chain'
import Link from 'next/link'
import Hearth from '@/public/images/common/hearth.svg'
import HeartFilled from '@/public/images/common/hearth-filled.svg'
import Share from '@/public/images/common/share.svg'
import Close from '@/public/images/common/close.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { Address } from 'viem'
import SuperChainPoints from '@/public/images/common/superChain.svg'

function BadgeInfo({
  currentBadge,
  setCurrentBadge,
  switchFavorite,
}: {
  currentBadge: (ResponseBadge & { isFavorite: boolean }) | null
  setCurrentBadge: (_: null | (ResponseBadge & { isFavorite: boolean })) => void
  switchFavorite: ({ id, account, isFavorite }: { id: number; account: Address; isFavorite: boolean }) => void
}) {
  const { safe } = useSafeInfo()

  const unClaimed = useMemo(() => {
    if (currentBadge?.claimableTier === null || currentBadge?.tier === null) return false

    return currentBadge?.tier === currentBadge?.claimableTier
  }, [currentBadge])

  const handleSwitchFavorite = async () => {
    switchFavorite({
      id: currentBadge?.badgeId,
      account: safe.address.value as Address,
      isFavorite: !currentBadge?.isFavorite,
    })
    setCurrentBadge({
      ...currentBadge!,
      isFavorite: !currentBadge?.isFavorite,
    })
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
        {!!Number(currentBadge.tier) ? (
          <img
            src={currentBadge.badgeTiers[currentBadge.claimableTier! - 1].metadata['3DImage']}
            className={!unClaimed ? css.unclaimed : undefined}
            alt={currentBadge.metadata.platform}
          />
        ) : (
          <img
            src={currentBadge.badgeTiers[0].metadata['3DImage']}
            className={!unClaimed ? css.unclaimed : undefined}
            alt={currentBadge.metadata.platform}
          />
        )}
        <Box display="flex" gap={1} position="absolute" top="10%" right="0">
          <IconButton className={css.actionBtn}>
            <SvgIcon component={Share} color="inherit" inheritViewBox fontSize="small" />
          </IconButton>
          <IconButton onClick={handleSwitchFavorite} className={css.actionBtn}>
            <SvgIcon
              component={currentBadge?.isFavorite ? HeartFilled : Hearth}
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
          {currentBadge?.metadata.name}
        </Typography>
        <Typography fontSize={12} fontWeight={400}>
          {currentBadge?.metadata.description}
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
        {!!Number(currentBadge.tier) ? (
          <>
            <Typography fontSize={12} fontWeight={600} color="secondary.main">
              Unlock Next Tier:
            </Typography>
            <Typography fontSize={12} fontWeight={400}>
              {currentBadge.metadata.description.replace(
                '{{variable}}',
                currentBadge.badgeTiers[currentBadge.claimableTier! - 1].metadata.minValue.toString(),
              )}
            </Typography>
          </>
        ) : (
          <>
            <Typography fontSize={12} fontWeight={600} color="secondary.main">
              Unlock First Tier:
            </Typography>
            <Typography fontSize={12} fontWeight={400}>
              {currentBadge.metadata.condition.replace(
                '{{variable}}',
                currentBadge.badgeTiers[0].metadata.minValue.toString(),
              )}
            </Typography>
          </>
        )}
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
          {currentBadge.metadata.platform}
        </Typography>
        <Typography fontSize={12} fontWeight={500}>
          <strong>Current Tier:</strong> {currentBadge.tier ? currentBadge.tier : 0}
        </Typography>
        <Typography fontSize={12} fontWeight={500}>
          {!!Number(currentBadge.tier) ? (
            <strong>Next rewards: {currentBadge.badgeTiers[currentBadge.claimableTier! - 1].points}</strong>
          ) : (
            <strong>First rewards: {currentBadge.badgeTiers[0].metadata.points} </strong>
          )}
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
      <Box display="flex" paddingTop={2} alignItems="center" justifyContent="center" flexDirection="column" gap="20px">
        <Typography fontWeight={600} fontSize={20}>
          My Badges ({currentBadge.tier}/{currentBadge?.badgeTiers.length})
        </Typography>
        <Box display="flex" gap="12px">
          {currentBadge?.badgeTiers.map((tier) => (
            <Tooltip
              arrow
              title={
                <Box
                  display="flex"
                  gap="6px"
                  padding="12px"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography fontSize={14} fontWeight={400}>
                    {currentBadge.metadata.condition.replace('{{variable}}', tier.metadata.minValue.toString())}
                  </Typography>

                  <Box justifyContent="center" alignItems="center" display="flex" gap={1}>
                    <strong>{tier.points}</strong>
                    <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
                  </Box>
                </Box>
              }
            >
              <img
                style={{
                  height: 60,
                  width: 60,
                  opacity: tier.tier <= currentBadge.tier ? 1 : 0.5,
                }}
                src={tier.metadata['2DImage']}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Stack>
  )
}

export default BadgeInfo
