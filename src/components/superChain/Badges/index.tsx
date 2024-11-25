import { BadgeResponse } from '@/types/super-chain'
import { Box, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import React from 'react'
import SuperChainPoints from '@/public/images/common/superChain.svg'

function Badges({ badges, isLoading }: { badges?: BadgeResponse[]; isLoading?: boolean }) {
  return (
    <>
      {isLoading ? (
        <>
          <Skeleton variant="circular" width={60} height={60} />
          <Skeleton variant="circular" width={60} height={60} />
          <Skeleton variant="circular" width={60} height={60} />
        </>
      ) : (
        badges?.map((badge, key) => {
          console.debug('Badge:', badge)
          return (
            <Tooltip
              arrow
              key={key}
              title={
                <Box
                  display="flex"
                  gap="6px"
                  padding="12px"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography fontSize={14} textAlign="center" fontWeight={400}>
                    {badge.badge.metadata.condition.replace(
                      '{{variable}}',
                      badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata.minValue.toString(),
                    )}
                  </Typography>
                  <Box justifyContent="center" alignItems="center" display="flex" gap={1}>
                    <strong>{badge.badge.badgeTiers[parseInt(badge.tier) - 1].points}</strong>
                    <SvgIcon component={SuperChainPoints} inheritViewBox fontSize="medium" />
                  </Box>
                </Box>
              }
            >
              <img
                style={{
                  height: 60,
                  width: 60,
                }}
                src={badge.badge.badgeTiers[parseInt(badge.tier) - 1].metadata['2DImage']}
              />
            </Tooltip>
          )
        })
      )}
    </>
  )
}

export default Badges
